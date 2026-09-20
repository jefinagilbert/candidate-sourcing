import { Injectable, Logger } from '@nestjs/common';
import { CandidateProfile } from '../entities/candidate-profile.entity';
import { SearchFilters } from '../entities/search-filters.entity';
import { getRelatedCompaniesAndKeywords, INDUSTRY_TAXONOMY } from '../constants/industry-taxonomy.constant';

export interface FilterResultItem {
  profile: CandidateProfile;
  matchScore: number;
  isExactMatch: boolean;
  isRelatedMatch?: boolean;
  relatedMatchReason?: string;
  filterPassStatus: {
    skills: boolean;
    experience: boolean;
    location: boolean;
    company_type: boolean;
    company_name?: boolean;
    notes?: string;
  };
}

@Injectable()
export class FilterEngineService {
  private readonly logger = new Logger(FilterEngineService.name);

  /**
   * Filters the candidate talent pool according to structured objective filters.
   * Supports both Strict Exact Matching and Smart Expansion (Related/Transferable) modes.
   */
  filterCandidates(candidates: CandidateProfile[], filters?: SearchFilters): FilterResultItem[] {
    const safeFilters: SearchFilters = filters || {
      skills: [],
      min_years_experience: 0,
      max_years_experience: 50,
      locations: [],
      company_types: [],
      target_companies: [],
      keywords: [],
      strict_match: true,
    };

    const isStrict = safeFilters.strict_match !== false; // Default is strict mode
    const hasTargetCompanies =
      safeFilters.target_companies && safeFilters.target_companies.length > 0;
    const hasTargetSkills = safeFilters.skills && safeFilters.skills.length > 0;

    // Collect related companies and keywords if in Smart Expansion mode
    let relatedCompanies: string[] = [];
    let domainKeywords: string[] = [];
    if (!isStrict && hasTargetCompanies) {
      for (const comp of safeFilters.target_companies!) {
        const lookup = getRelatedCompaniesAndKeywords(comp);
        relatedCompanies.push(...lookup.relatedCompanies);
        domainKeywords.push(...lookup.domainKeywords);
      }
    }

    const scoredList: FilterResultItem[] = [];

    for (const profile of candidates) {
      const passStatus = this.checkProfileFilterPass(profile, safeFilters);

      const isExactCompany = hasTargetCompanies ? passStatus.company_name : true;
      const isRelatedCompany = !isExactCompany && this.checkRelatedCompanyMatch(profile, relatedCompanies, domainKeywords);

      // In Strict Mode: Candidate MUST match the exact target company (if specified) and core constraints
      if (isStrict) {
        if (hasTargetCompanies && !passStatus.company_name) {
          continue; // Strict mode: exclude candidates who did not work at target company
        }
        if (hasTargetSkills && !passStatus.skills) {
          continue; // Strict mode: candidate must match required skills
        }
        if (!passStatus.experience) {
          continue; // Strict mode: candidate must fall within experience bounds
        }
        if (safeFilters.company_types && safeFilters.company_types.length > 0 && !passStatus.company_type) {
          continue; // Strict mode: candidate must match selected company type
        }
        if (safeFilters.locations && safeFilters.locations.length > 0 && !passStatus.location) {
          continue; // Strict mode: candidate must match location
        }
      } else {
        // Smart Expansion mode: require either exact company or related domain company if target companies specified
        if (hasTargetCompanies && !isExactCompany && !isRelatedCompany) {
          continue;
        }
      }

      // Check overall exact match
      const isExact =
        passStatus.skills &&
        passStatus.experience &&
        passStatus.location &&
        passStatus.company_type &&
        (!hasTargetCompanies || passStatus.company_name);

      // Determine related match status in Smart Expansion mode
      const isRelated = !isExact && (isRelatedCompany || passStatus.skills || passStatus.company_type);
      let relatedReason: string | undefined;

      if (!isExact && !isStrict) {
        if (isRelatedCompany) {
          relatedReason = `Transferable domain background (${profile.current_company} / ${profile.current_company_type})`;
        } else if (passStatus.skills && !passStatus.company_name) {
          relatedReason = `Matching technical stack (${profile.skills.slice(0, 3).join(', ')})`;
        } else {
          relatedReason = `Adjacent experience tier (${profile.years_experience} yrs at ${profile.current_company})`;
        }
      }

      // Compute Suitability Score
      let objectiveScore = 0;
      if (passStatus.skills) objectiveScore += 35;
      if (passStatus.experience) objectiveScore += 25;
      if (passStatus.company_type) objectiveScore += 20;
      if (passStatus.location) objectiveScore += 10;
      
      if (passStatus.company_name) {
        objectiveScore += 50; // Exact target company bonus
      } else if (isRelatedCompany) {
        objectiveScore += 25; // Related company bonus in Smart Expansion
      }

      scoredList.push({
        profile,
        matchScore: objectiveScore,
        isExactMatch: isExact,
        isRelatedMatch: isRelated,
        relatedMatchReason: relatedReason,
        filterPassStatus: passStatus,
      });
    }

    // Sort: Exact matches first, then highest score, then years of experience
    return scoredList.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      return b.matchScore - a.matchScore;
    });
  }

  private checkProfileFilterPass(profile: CandidateProfile, filters: SearchFilters) {
    // 1. Check Experience
    const minExp = filters.min_years_experience ?? 0;
    const maxExp = filters.max_years_experience ?? 50;
    const expPassed = profile.years_experience >= minExp && profile.years_experience <= maxExp;

    // 2. Check Skills (matches if candidate has key skills from filter list)
    let skillsPassed = true;
    if (filters.skills && filters.skills.length > 0) {
      const candidateSkillsNormalized = profile.skills.map((s) => s.toLowerCase().trim());
      const filterSkillsNormalized = filters.skills.map((s) => s.toLowerCase().trim());

      const matchedCount = filterSkillsNormalized.filter((filterSkill) =>
        candidateSkillsNormalized.some(
          (cs) => cs.includes(filterSkill) || filterSkill.includes(cs)
        )
      ).length;

      skillsPassed = matchedCount >= Math.min(1, Math.ceil(filterSkillsNormalized.length * 0.3));
    }

    // 3. Check Location (Exact match, Remote, or substring match)
    let locationPassed = true;
    if (filters.locations && filters.locations.length > 0) {
      const candidateLoc = (profile.location || '').toLowerCase();
      locationPassed = filters.locations.some((loc) => {
        const target = loc.toLowerCase().trim();
        return (
          candidateLoc.includes(target) ||
          target.includes(candidateLoc) ||
          candidateLoc === 'remote' ||
          target === 'remote' ||
          target === 'any' ||
          target === 'all'
        );
      });
    }

    // 4. Check Target Companies (Specific company names e.g. "Oracle", "Razorpay")
    // ONLY match against actual company employment — NEVER match skills containing company name
    let targetCompanyPassed = true;
    if (filters.target_companies && filters.target_companies.length > 0) {
      const normalizedTargets = filters.target_companies.map((c) => c.toLowerCase().trim());

      const companyFuzzyMatch = (candidateCompany: string, target: string): boolean => {
        const c = candidateCompany.toLowerCase().trim();
        const t = target.toLowerCase().trim();
        if (!c || !t) return false;
        // Exact match
        if (c === t) return true;
        // Substring match (only if the shorter string is 3+ chars to avoid false positives like "EY" matching "Honeybee")
        const shorter = c.length < t.length ? c : t;
        const longer = c.length < t.length ? t : c;
        return shorter.length >= 3 && longer.includes(shorter);
      };

      const currentMatched = normalizedTargets.some((tc) =>
        companyFuzzyMatch(profile.current_company || '', tc)
      );
      const pastMatched = profile.past_companies?.some((p) =>
        normalizedTargets.some((tc) => companyFuzzyMatch(p.company || '', tc))
      );
      targetCompanyPassed = currentMatched || pastMatched;
    }

    // 5. Check Company Types (Current company type OR past company background)
    let companyTypePassed = true;
    if (filters.company_types && filters.company_types.length > 0) {
      const allowedTypes = filters.company_types.map((t) => t.toLowerCase());
      const currentMatched = allowedTypes.includes(profile.current_company_type?.toLowerCase());
      const pastMatched = profile.past_companies?.some((p) =>
        allowedTypes.includes(p.company_type?.toLowerCase())
      );
      companyTypePassed = currentMatched || pastMatched;
    }

    return {
      skills: skillsPassed,
      experience: expPassed,
      location: locationPassed,
      company_type: companyTypePassed,
      company_name: targetCompanyPassed,
      notes: `${expPassed ? 'Exp match' : 'Exp outside target'}, ${skillsPassed ? 'Skills match' : 'Partial skills'}, ${companyTypePassed ? 'Company type match' : 'Different company background'}`,
    };
  }

  private checkRelatedCompanyMatch(
    profile: CandidateProfile,
    relatedCompanies: string[],
    domainKeywords: string[]
  ): boolean {
    if (relatedCompanies.length === 0 && domainKeywords.length === 0) return false;

    const normCompanies = relatedCompanies.map((c) => c.toLowerCase().trim());
    const normKeywords = domainKeywords.map((k) => k.toLowerCase().trim());

    const currCompany = (profile.current_company || '').toLowerCase();
    const pastCompanies = profile.past_companies?.map((p) => (p.company || '').toLowerCase()) || [];
    const allCandidateCompanies = [currCompany, ...pastCompanies];

    // Check if candidate worked at any related company
    const hasRelatedCompany = allCandidateCompanies.some((candComp) =>
      normCompanies.some((rc) => candComp.includes(rc) || rc.includes(candComp))
    );

    // Check if candidate summary/skills touch the domain keywords
    const summary = (profile.summary || '').toLowerCase();
    const skills = profile.skills.map((s) => s.toLowerCase());
    const hasKeyword = normKeywords.some(
      (kw) => summary.includes(kw) || skills.some((s) => s.includes(kw))
    );

    return hasRelatedCompany || hasKeyword;
  }
}
