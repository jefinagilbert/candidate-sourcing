import { Injectable, Logger } from '@nestjs/common';
import { CandidateProfile } from '../entities/candidate-profile.entity';
import { SearchFilters } from '../entities/search-filters.entity';

export interface FilterResultItem {
  profile: CandidateProfile;
  matchScore: number;
  isExactMatch: boolean;
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
   * Accurately supports target companies, skills, experience, and location constraints.
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
    };

    const hasTargetCompanies =
      safeFilters.target_companies && safeFilters.target_companies.length > 0;
    const hasTargetSkills = safeFilters.skills && safeFilters.skills.length > 0;

    const scoredList: FilterResultItem[] = [];

    for (const profile of candidates) {
      const passStatus = this.checkProfileFilterPass(profile, safeFilters);

      // If specific target companies are requested (e.g. "Oracle"), enforce hard company match
      if (hasTargetCompanies && !passStatus.company_name) {
        continue; // Exclude candidates who didn't work at the requested company
      }

      const isExact =
        passStatus.skills &&
        passStatus.experience &&
        passStatus.location &&
        passStatus.company_type &&
        (!hasTargetCompanies || passStatus.company_name);

      // Base objective suitability score
      let objectiveScore = 0;
      if (passStatus.skills) objectiveScore += 35;
      if (passStatus.experience) objectiveScore += 25;
      if (passStatus.company_type) objectiveScore += 20;
      if (passStatus.location) objectiveScore += 10;
      if (passStatus.company_name) objectiveScore += 40; // High boost for target company match

      scoredList.push({
        profile,
        matchScore: objectiveScore,
        isExactMatch: isExact,
        filterPassStatus: passStatus,
      });
    }

    // Sort by exact matches first, then highest objective score, then years of experience
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

    // 2. Check Skills (matches if candidate has at least 1-2 key skills from filter list)
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
    let targetCompanyPassed = true;
    if (filters.target_companies && filters.target_companies.length > 0) {
      const normalizedTargets = filters.target_companies.map((c) => c.toLowerCase().trim());
      const currentMatched = normalizedTargets.some((tc) =>
        (profile.current_company || '').toLowerCase().includes(tc)
      );
      const pastMatched = profile.past_companies?.some((p) =>
        normalizedTargets.some((tc) => (p.company || '').toLowerCase().includes(tc))
      );
      const skillMatched = profile.skills?.some((s) =>
        normalizedTargets.some((tc) => s.toLowerCase().includes(tc))
      );
      targetCompanyPassed = currentMatched || pastMatched || skillMatched;
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
}
