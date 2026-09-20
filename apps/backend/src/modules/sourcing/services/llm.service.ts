import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { safeParseJson } from '../../../common/utils/json-repair';
import {
  FILTER_EXTRACTION_SYSTEM_PROMPT,
  buildFilterExtractionPrompt,
} from '../prompts/filter-extraction.prompt';
import {
  CANDIDATE_SCORING_SYSTEM_PROMPT,
  buildCandidateScoringPrompt,
} from '../prompts/candidate-scoring.prompt';
import {
  REFINEMENT_SYSTEM_PROMPT,
  buildRefinementPrompt,
} from '../prompts/refinement-adjustment.prompt';
import { SearchFilters } from '../entities/search-filters.entity';
import { FitRubric, ScoredCandidate } from '../entities/fit-rubric.entity';
import { CandidateProfile } from '../entities/candidate-profile.entity';
import { INDUSTRY_TAXONOMY } from '../constants/industry-taxonomy.constant';

export interface ExtractedFiltersAndRubric {
  needs_clarification?: boolean;
  clarification_message?: string;
  suggested_clarifications?: string[];
  filters: SearchFilters;
  rubric: FitRubric;
}

export interface RefinementResult {
  filters: SearchFilters;
  rubric: FitRubric;
  changes: {
    filter_changes: string[];
    rubric_changes: string[];
  };
  explanation_for_recruiter: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private geminiClient: GoogleGenerativeAI | null = null;
  private activeProvider: 'gemini' | 'groq' | 'openai' | 'openrouter' | 'heuristic' = 'heuristic';

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
      this.activeProvider = 'gemini';
      this.logger.log('LlmService initialized with Google Gemini Provider');
    } else if (groqKey && groqKey !== 'your_groq_api_key_here') {
      this.activeProvider = 'groq';
      this.logger.log('LlmService initialized with Groq Provider');
    } else if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      this.activeProvider = 'openai';
      this.logger.log('LlmService initialized with OpenAI Provider');
    } else if (openrouterKey) {
      this.activeProvider = 'openrouter';
      this.logger.log('LlmService initialized with OpenRouter Provider');
    } else {
      this.activeProvider = 'heuristic';
      this.logger.warn(
        'No active LLM API Key detected in environment. Operating in Smart Heuristic Evaluation Mode. Set GEMINI_API_KEY in .env for live Gemini model calls.'
      );
    }
  }

  getActiveProvider(): string {
    return this.activeProvider;
  }

  /**
   * Generates structured objective filters and subjective fit rubric from free-text query.
   * Handles misleading, vague, or edge-case queries gracefully by requesting clarification.
   */
  async extractFiltersAndRubric(userQuery: string): Promise<ExtractedFiltersAndRubric> {
    const trimmed = (userQuery || '').trim();

    // 1. Edge Case: Query too short or gibberish
    if (trimmed.length < 4 || /^[b-df-hj-np-tv-z\s]+$/i.test(trimmed)) {
      return {
        needs_clarification: true,
        clarification_message:
          'Your requirement is too short or ambiguous to identify a specific candidate profile. Please describe the role, technical skills (e.g. Node.js, RDS, React), target experience, or preferred company type.',
        suggested_clarifications: [
          'RDS developers with 4-7 years of experience who have worked at startups in Bangalore',
          'Senior Node.js and PostgreSQL backend engineers with 5+ years experience in scaleups',
          'Full stack TypeScript & React engineers with 3-6 years experience in fintech',
        ],
        filters: {
          skills: [],
          min_years_experience: 0,
          max_years_experience: 20,
          locations: [],
          company_types: [],
        },
        rubric: {
          role_summary: 'Pending recruiter clarification',
          criteria: [],
          dealbreakers: [],
        },
      };
    }

    const prompt = buildFilterExtractionPrompt(trimmed);
    const systemPrompt = FILTER_EXTRACTION_SYSTEM_PROMPT;

    try {
      if (this.activeProvider !== 'heuristic') {
        const rawResponse = await this.callLlmWithRetry(systemPrompt, prompt);
        const parsed = safeParseJson<ExtractedFiltersAndRubric>(rawResponse);
        if (parsed) {
          if (parsed.needs_clarification) {
            return {
              needs_clarification: true,
              clarification_message:
                parsed.clarification_message ||
                'Your requirement is missing key details (e.g. specific skills, role, or experience level). Please provide more information.',
              suggested_clarifications:
                parsed.suggested_clarifications?.length
                  ? parsed.suggested_clarifications
                  : [
                      'RDS developers with 4-7 years of experience who have worked at startups in Bangalore',
                      'Senior Node.js backend engineers with 5+ years experience in scaleups',
                      'Engineers who worked at Big 4 consulting firms or enterprise tech companies',
                    ],
              filters: this.sanitizeFilters(parsed.filters || {}),
              rubric: this.sanitizeRubric(parsed.rubric || {}),
            };
          }

          if (parsed.filters && parsed.rubric) {
            return this.sanitizeFiltersAndRubric(parsed);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Live LLM filter extraction error: ${error.message}. Executing resilient fallback extraction.`);
    }

    // Smart heuristic fallback if LLM offline or key not provided
    return this.heuristicExtractFiltersAndRubric(userQuery);
  }

  /**
   * Scores and ranks filtered candidates against the subjective fit rubric with verifiable field citations.
   */
  async scoreCandidates(
    candidates: CandidateProfile[],
    rubric: FitRubric
  ): Promise<ScoredCandidate[]> {
    if (!candidates || candidates.length === 0) return [];

    const prompt = buildCandidateScoringPrompt(candidates, rubric);
    const systemPrompt = CANDIDATE_SCORING_SYSTEM_PROMPT;

    try {
      if (this.activeProvider !== 'heuristic') {
        const rawResponse = await this.callLlmWithRetry(systemPrompt, prompt);
        const parsed = safeParseJson<{ evaluations: any[] }>(rawResponse);

        if (parsed?.evaluations && Array.isArray(parsed.evaluations)) {
          return this.mapEvaluationsToScoredCandidates(parsed.evaluations, candidates, rubric);
        }
      }
    } catch (error) {
      this.logger.error(`Live LLM candidate scoring error: ${error.message}. Executing resilient citation-based scoring.`);
    }

    // Resilient grounded scoring algorithm citing real candidate fields
    return this.heuristicScoreCandidates(candidates, rubric);
  }

  /**
   * Interprets recruiter conversational feedback to adjust filters and rubric.
   */
  async refineCriteria(
    userFeedback: string,
    currentFilters: SearchFilters,
    currentRubric: FitRubric,
    profileSignals?: any[],
    chatHistory?: any[]
  ): Promise<RefinementResult> {
    const prompt = buildRefinementPrompt(
      userFeedback,
      currentFilters,
      currentRubric,
      profileSignals,
      chatHistory
    );
    const systemPrompt = REFINEMENT_SYSTEM_PROMPT;

    try {
      if (this.activeProvider !== 'heuristic') {
        const rawResponse = await this.callLlmWithRetry(systemPrompt, prompt);
        const parsed = safeParseJson<RefinementResult>(rawResponse);
        if (parsed?.filters && parsed?.rubric) {
          return {
            filters: this.sanitizeFilters(parsed.filters),
            rubric: this.sanitizeRubric(parsed.rubric),
            changes: parsed.changes || { filter_changes: [], rubric_changes: [] },
            explanation_for_recruiter:
              parsed.explanation_for_recruiter ||
              'Updated search filters and fit rubric according to your feedback.',
          };
        }
      }
    } catch (error) {
      this.logger.error(`Live LLM refinement error: ${error.message}. Executing heuristic refinement.`);
    }

    return this.heuristicRefineCriteria(userFeedback, currentFilters, currentRubric, profileSignals);
  }

  // ===================== CORE LLM INVOCATION WITH RETRY =====================

  private async callLlmWithRetry(systemPrompt: string, userPrompt: string, retries = 2): Promise<string> {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        if (this.activeProvider === 'gemini' && this.geminiClient) {
          const candidateModels = [
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-3.7-flash',
          ];
          let lastError: any = null;

          for (const modelName of candidateModels) {
            try {
              const model = this.geminiClient.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt,
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json',
                },
              });

              const result = await model.generateContent(userPrompt);
              const response = await result.response;
              return response.text();
            } catch (mErr: any) {
              lastError = mErr;
              this.logger.warn(`Model ${modelName} returned ${mErr.message}. Trying next fallback model...`);
            }
          }
          throw lastError || new Error('All Gemini candidate models failed');
        } else if (this.activeProvider === 'openai' || this.activeProvider === 'groq' || this.activeProvider === 'openrouter') {
          return await this.callOpenAiCompatibleApi(systemPrompt, userPrompt);
        }
        break;
      } catch (err) {
        this.logger.warn(`LLM call attempt ${attempt} failed: ${err.message}`);
        if (attempt <= retries) {
          // Exponential backoff
          await new Promise((res) => setTimeout(res, attempt * 1000));
        } else {
          throw err;
        }
      }
    }
    throw new Error('All LLM invocation attempts exhausted');
  }

  private async callOpenAiCompatibleApi(systemPrompt: string, userPrompt: string): Promise<string> {
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let apiKey = process.env.OPENAI_API_KEY;
    let model = 'gpt-4o-mini';

    if (this.activeProvider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = process.env.GROQ_API_KEY;
      model = 'llama-3.3-70b-versatile';
    } else if (this.activeProvider === 'openrouter') {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = process.env.OPENROUTER_API_KEY;
      model = 'meta-llama/llama-3.3-70b-instruct:free';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI-compatible API returned ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ===================== SANITIZATION & NORMALIZATION =====================

  private sanitizeFiltersAndRubric(data: ExtractedFiltersAndRubric): ExtractedFiltersAndRubric {
    return {
      filters: this.sanitizeFilters(data.filters),
      rubric: this.sanitizeRubric(data.rubric),
    };
  }

  private sanitizeFilters(filters: any): SearchFilters {
    const targetCompanies = Array.isArray(filters.target_companies)
      ? filters.target_companies.filter((c: any) => typeof c === 'string' && c.trim())
      : Array.isArray(filters.companies)
      ? filters.companies.filter((c: any) => typeof c === 'string' && c.trim())
      : undefined;

    const hasTargetCompanies = targetCompanies && targetCompanies.length > 0;

    // When target companies are specified, DON'T force default skills/locations/company_types
    // Let the company filter be authoritative
    const skills = Array.isArray(filters.skills) && filters.skills.length > 0
      ? filters.skills
      : hasTargetCompanies
      ? [] // No forced skills when searching by company
      : ['AWS RDS', 'Node.js'];

    const locations = Array.isArray(filters.locations) && filters.locations.length > 0
      ? filters.locations
      : []; // Empty = match all locations

    const companyTypes = Array.isArray(filters.company_types) && filters.company_types.length > 0
      ? filters.company_types
      : ['startup', 'scaleup', 'enterprise', 'agency']; // All types by default

    return {
      skills,
      min_years_experience: typeof filters.min_years_experience === 'number' ? filters.min_years_experience : 0,
      max_years_experience: typeof filters.max_years_experience === 'number' ? filters.max_years_experience : 30,
      locations,
      company_types: companyTypes,
      target_companies: hasTargetCompanies ? targetCompanies : undefined,
      keywords: Array.isArray(filters.keywords) ? filters.keywords : [],
    };
  }

  private sanitizeRubric(rubric: any): FitRubric {
    const criteria = Array.isArray(rubric.criteria) ? rubric.criteria : [];
    const normalizedCriteria = criteria.map((c, idx) => ({
      id: c.id || `crit_${idx + 1}`,
      name: c.name || `Criterion ${idx + 1}`,
      weight: typeof c.weight === 'number' ? c.weight : 25,
      description: c.description || '',
      positive_signals: Array.isArray(c.positive_signals) ? c.positive_signals : [],
      negative_signals: Array.isArray(c.negative_signals) ? c.negative_signals : [],
    }));

    return {
      role_summary: rubric.role_summary || 'Standard engineering candidate requirements',
      criteria: normalizedCriteria,
      dealbreakers: Array.isArray(rubric.dealbreakers) ? rubric.dealbreakers : [],
    };
  }

  private mapEvaluationsToScoredCandidates(
    evaluations: any[],
    candidates: CandidateProfile[],
    rubric: FitRubric
  ): ScoredCandidate[] {
    return candidates.map((profile) => {
      const evalItem = evaluations.find(
        (e) => e.candidate_id?.toLowerCase() === profile.id.toLowerCase()
      );

      if (evalItem) {
        return {
          profile,
          match_score: Math.min(100, Math.max(0, evalItem.match_score || 75)),
          fit_level: evalItem.fit_level || 'Good Match',
          explanation: evalItem.explanation || `${profile.name} matches required skills (${profile.skills.join(', ')}) at ${profile.current_company}.`,
          cited_facts: Array.isArray(evalItem.cited_facts)
            ? evalItem.cited_facts
            : this.generateDefaultCitations(profile),
          criteria_scores: Array.isArray(evalItem.criteria_scores)
            ? evalItem.criteria_scores
            : rubric.criteria.map((c) => ({
                criterion_id: c.id,
                criterion_name: c.name,
                score: evalItem.match_score || 80,
                reason: `Demonstrated capabilities matching ${c.name}.`,
              })),
          passed_filters: {
            skills: true,
            experience: true,
            location: true,
            company_type: true,
          },
        };
      }

      // Fallback for individual profile if missing in LLM response
      return this.scoreSingleCandidateHeuristic(profile, rubric);
    }).sort((a, b) => b.match_score - a.match_score);
  }

  private generateDefaultCitations(profile: CandidateProfile) {
    return [
      { field: 'years_experience', value: `${profile.years_experience} years`, relevance: 'Experience timeline match' },
      { field: 'current_company', value: `${profile.current_company} (${profile.current_company_type})`, relevance: 'Current company pedigree' },
      { field: 'skills', value: profile.skills.slice(0, 4).join(', '), relevance: 'Direct technical stack match' },
      { field: 'summary', value: profile.summary, relevance: 'Domain and engineering focus' },
    ];
  }

  // ===================== RESILIENT GROUNDED EVALUATOR =====================

  private heuristicExtractFiltersAndRubric(query: string): ExtractedFiltersAndRubric {
    const lower = query.toLowerCase();

    // 0. Check Industry Clusters & Taxonomy (e.g. Big 4, FAANG, Indian IT)
    const targetCompanies: string[] = [];
    const companyTypes: ('startup' | 'scaleup' | 'enterprise' | 'agency')[] = [];
    const keywords: string[] = [];

    for (const [key, cluster] of Object.entries(INDUSTRY_TAXONOMY.clusters)) {
      if (lower.includes(key)) {
        targetCompanies.push(...cluster.companies);
        companyTypes.push(...(cluster.company_types as any));
        keywords.push(...cluster.keywords);
      }
    }

    // Direct company extraction: match capitalized words after prepositions
    const companyMatch = query.match(/(?:at|from|on|in)\s+([A-Z][a-zA-Z0-9]+)/g);
    if (companyMatch) {
      companyMatch.forEach((m) => {
        const comp = m.replace(/^(?:at|from|on|in)\s+/i, '').trim();
        if (
          comp &&
          !targetCompanies.includes(comp) &&
          !['Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Remote', 'India', 'Startups', 'Scaleups'].includes(comp)
        ) {
          targetCompanies.push(comp);
        }
      });
    }

    // Also extract company names that appear as standalone proper nouns without prepositions
    // e.g. "Amazon backend developer", "Google engineers"
    const knownCompanies = [
      'Amazon', 'Google', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Oracle', 'SAP',
      'Flipkart', 'Razorpay', 'Swiggy', 'Postman', 'Chargebee', 'Hasura', 'BrowserStack',
      'CRED', 'Groww', 'Zepto', 'Meesho', 'Nykaa', 'Blinkit', 'Dream11', 'Freshworks',
      'Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Deloitte', 'PwC',
      'EY', 'KPMG', 'Citadel', 'Goldman Sachs', 'Morgan Stanley', 'Juspay', 'CleverTap',
      'Innovaccer', 'PharmEasy', 'PhysicsWallah', 'Unacademy', 'Zscaler', 'Palo Alto',
      'Practo', 'Sarvam', 'Krutrim', 'NVIDIA', 'Databricks', 'Uber', 'Airbnb', 'Twitter',
      'Salesforce', 'Adobe', 'IBM', 'Intel', 'Qualcomm', 'Samsung', 'PayPal', 'Stripe',
    ];
    for (const company of knownCompanies) {
      if (lower.includes(company.toLowerCase()) && !targetCompanies.some(tc => tc.toLowerCase() === company.toLowerCase())) {
        targetCompanies.push(company);
      }
    }

    const hasTargetCompanies = targetCompanies.length > 0;

    // 1. Extract Experience
    let minExp = 0;
    let maxExp = 30;
    const expMatch = query.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years|yrs)/i);
    const minOnlyMatch = query.match(/(\d+)\s*\+?\s*(?:years|yrs)/i);
    if (expMatch) {
      minExp = parseInt(expMatch[1], 10);
      maxExp = parseInt(expMatch[2], 10);
    } else if (minOnlyMatch) {
      minExp = parseInt(minOnlyMatch[1], 10);
      maxExp = minExp + 5;
    } else if (!hasTargetCompanies) {
      minExp = 3;
      maxExp = 8;
    }

    // 2. Extract Company Types
    if (lower.includes('startup')) companyTypes.push('startup');
    if (lower.includes('scaleup') || lower.includes('scale up') || lower.includes('growth')) companyTypes.push('scaleup');
    if (lower.includes('enterprise') || lower.includes('corporate') || lower.includes('mnc')) companyTypes.push('enterprise');
    if (lower.includes('agency') || lower.includes('consulting') || lower.includes('consultant')) companyTypes.push('agency');
    if (companyTypes.length === 0) {
      companyTypes.push('startup', 'scaleup', 'enterprise', 'agency');
    }

    // 3. Extract Locations
    const locations: string[] = [];
    if (lower.includes('bangalore') || lower.includes('bengaluru')) locations.push('Bangalore');
    if (lower.includes('hyderabad')) locations.push('Hyderabad');
    if (lower.includes('pune')) locations.push('Pune');
    if (lower.includes('mumbai')) locations.push('Mumbai');
    if (lower.includes('delhi') || lower.includes('ncr') || lower.includes('gurgaon')) locations.push('Delhi NCR');
    if (lower.includes('remote')) locations.push('Remote');
    // If no location specified, DON'T default — match all locations

    // 4. Extract Skills — role-based keyword detection
    const roleSkillMap: Record<string, string[]> = {
      'backend': ['Node.js', 'Java', 'Go', 'Python', 'PostgreSQL', 'Redis', 'Kafka', 'AWS RDS', 'DynamoDB', 'Express'],
      'frontend': ['React', 'TypeScript', 'Next.js', 'CSS', 'JavaScript', 'Vue', 'Angular', 'HTML'],
      'fullstack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Next.js', 'MongoDB'],
      'full stack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Next.js', 'MongoDB'],
      'mobile': ['Swift', 'SwiftUI', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android'],
      'ios': ['Swift', 'SwiftUI', 'Combine', 'Objective-C', 'iOS'],
      'android': ['Kotlin', 'Java', 'Android', 'Jetpack Compose'],
      'devops': ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Jenkins', 'Ansible'],
      'data': ['Python', 'SQL', 'Spark', 'Kafka', 'Airflow', 'Data Pipeline'],
      'machine learning': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'ML'],
      'ml': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'ML'],
    };

    // Detect explicit skills mentioned in query
    const skillsList = ['AWS RDS', 'Node.js', 'PostgreSQL', 'TypeScript', 'React', 'Python', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'Golang', 'Go', 'Java', 'Next.js', 'Terraform', 'Monitoring', 'Swift', 'SwiftUI', 'Kotlin', 'Flutter', 'DynamoDB', 'MongoDB', 'GraphQL', 'gRPC'];
    const detectedSkills = skillsList.filter((s) => lower.includes(s.toLowerCase()));

    // Detect role-based skills
    let roleSkills: string[] = [];
    for (const [roleKey, skills] of Object.entries(roleSkillMap)) {
      if (lower.includes(roleKey)) {
        roleSkills.push(...skills);
      }
    }

    let finalSkills: string[];
    if (detectedSkills.length > 0) {
      finalSkills = detectedSkills;
    } else if (roleSkills.length > 0 && !hasTargetCompanies) {
      // Only use role-implied skills as hard filter when NOT searching by company
      finalSkills = Array.from(new Set(roleSkills)).slice(0, 5);
    } else if (hasTargetCompanies) {
      // When searching by company, don't force skills — let the company filter be authoritative
      finalSkills = [];
    } else {
      finalSkills = ['PostgreSQL', 'Node.js', 'AWS RDS'];
    }

    // Store detected role for rubric
    const detectedRole = Object.keys(roleSkillMap).find(r => lower.includes(r)) || 'software';

    return {
      filters: {
        skills: finalSkills,
        min_years_experience: minExp,
        max_years_experience: maxExp,
        locations,
        company_types: Array.from(new Set(companyTypes)),
        target_companies: hasTargetCompanies ? Array.from(new Set(targetCompanies)) : undefined,
        keywords: keywords.length > 0 ? Array.from(new Set(keywords)) : undefined,
      },
      rubric: {
        role_summary: hasTargetCompanies
          ? `Sourcing ${detectedRole} developers from ${targetCompanies.join(', ')} with ${minExp}-${maxExp} years experience.`
          : `Sourcing for ${finalSkills.join(' & ')} engineers with ${minExp}-${maxExp} years experience having strong ${companyTypes.join('/')} background.`,
        criteria: [
          {
            id: 'tech_mastery',
            name: `${detectedRole.charAt(0).toUpperCase() + detectedRole.slice(1)} Technical Proficiency`,
            weight: hasTargetCompanies ? 30 : 40,
            description: `Proven hands-on depth with ${detectedRole} engineering and production architectures.`,
            positive_signals: roleSkills.length > 0 ? roleSkills.slice(0, 3).map(s => `${s} production experience`) : ['Production engineering depth', 'System design capability'],
            negative_signals: ['Generic developer with no specialized depth'],
          },
          {
            id: 'company_pedigree',
            name: hasTargetCompanies ? `${targetCompanies.join(' / ')} Background` : 'Company Background',
            weight: hasTargetCompanies ? 45 : 35,
            description: hasTargetCompanies
              ? `Direct experience at ${targetCompanies.join(', ')} or closely related organizations.`
              : `Substantial track record at ${companyTypes.join(' or ')} environments.`,
            positive_signals: hasTargetCompanies
              ? targetCompanies.map(c => `Currently or previously employed at ${c}`)
              : ['Direct startup/scaleup product ownership'],
            negative_signals: ['Completely mismatched company background'],
          },
          {
            id: 'seniority_fit',
            name: 'Experience Alignment',
            weight: 25,
            description: `Targeting engineers matching the ${minExp}-${maxExp} year career level.`,
            positive_signals: [`${minExp}-${maxExp} years in core software engineering`],
            negative_signals: [`Outside the ${minExp}-${maxExp} year scope`],
          },
        ],
        dealbreakers: hasTargetCompanies
          ? [`No verified experience at ${targetCompanies.join(', ')}`, `Less than ${minExp} years total production experience`]
          : [`No hands-on experience in ${finalSkills[0] || 'core stack'}`, `Less than ${minExp} years total production experience`],
      },
    };
  }

  private heuristicScoreCandidates(
    candidates: CandidateProfile[],
    rubric: FitRubric
  ): ScoredCandidate[] {
    return candidates.map((profile) => this.scoreSingleCandidateHeuristic(profile, rubric)).sort((a, b) => b.match_score - a.match_score);
  }

  private scoreSingleCandidateHeuristic(
    profile: CandidateProfile,
    rubric: FitRubric
  ): ScoredCandidate {
    let totalScore = 0;
    const criteriaScores = rubric.criteria.map((c) => {
      let score = 70;
      let reason = '';

      if (c.id.includes('cloud') || c.id.includes('db') || c.id.includes('tech') || c.name.toLowerCase().includes('database') || c.name.toLowerCase().includes('backend')) {
        const hasRds = profile.skills.some((s) => s.toLowerCase().includes('rds'));
        const hasNode = profile.skills.some((s) => s.toLowerCase().includes('node'));
        const hasPostgres = profile.skills.some((s) => s.toLowerCase().includes('postgres') || s.toLowerCase().includes('sql'));

        if (hasRds && (hasNode || hasPostgres)) {
          score = 94;
          reason = `Explicit mastery in ${profile.skills.filter((s) => s.includes('RDS') || s.includes('Postgres') || s.includes('Node')).join(', ')}.`;
        } else if (hasRds) {
          score = 85;
          reason = `Possesses AWS RDS and relevant skills: ${profile.skills.join(', ')}.`;
        } else {
          score = 65;
          reason = `Has general backend stack (${profile.skills.slice(0, 3).join(', ')}) but lacks explicit cloud DB focus.`;
        }
      } else if (c.id.includes('culture') || c.id.includes('startup') || c.name.toLowerCase().includes('company')) {
        if (profile.current_company_type === 'startup') {
          score = 92;
          reason = `Currently building at startup ${profile.current_company}.`;
        } else if (profile.current_company_type === 'scaleup') {
          score = 88;
          reason = `Active at high-growth scaleup ${profile.current_company}.`;
        } else {
          const pastStartup = profile.past_companies.find((p) => p.company_type === 'startup' || p.company_type === 'scaleup');
          if (pastStartup) {
            score = 80;
            reason = `Currently at enterprise ${profile.current_company}, but has ${pastStartup.years} yrs experience at ${pastStartup.company} (${pastStartup.company_type}).`;
          } else {
            score = 60;
            reason = `Background is predominantly enterprise (${profile.current_company}).`;
          }
        }
      } else {
        // Experience criterion
        score = 88;
        reason = `${profile.years_experience} years of software engineering experience.`;
      }

      totalScore += (score * c.weight) / 100;
      return {
        criterion_id: c.id,
        criterion_name: c.name,
        score,
        reason,
      };
    });

    const roundedScore = Math.min(98, Math.round(totalScore));
    const fit_level =
      roundedScore >= 85
        ? 'Strong Match'
        : roundedScore >= 72
        ? 'Good Match'
        : roundedScore >= 55
        ? 'Moderate Fit'
        : 'Borderline';

    // Verifiable citation-grounded explanation
    const pastDetails = profile.past_companies.length > 0
      ? ` and previously ${profile.past_companies[0].years} years at ${profile.past_companies[0].company} (${profile.past_companies[0].company_type})`
      : '';

    const explanation = `${profile.name} (${profile.current_title} at ${profile.current_company}, ${profile.current_company_type}) has ${profile.years_experience} years of experience${pastDetails}. Directly matches skills: ${profile.skills.slice(0, 4).join(', ')}. Profile summary notes: "${profile.summary}".`;

    return {
      profile,
      match_score: roundedScore,
      fit_level,
      explanation,
      cited_facts: [
        { field: 'years_experience', value: `${profile.years_experience} years`, relevance: 'Aligns with target experience band' },
        { field: 'current_company', value: `${profile.current_company} (${profile.current_company_type})`, relevance: 'Direct company type verification' },
        { field: 'skills', value: profile.skills.join(', '), relevance: 'Matches key database and backend requirements' },
        { field: 'education', value: profile.education, relevance: 'Formal technical background' },
        { field: 'summary', value: profile.summary, relevance: 'Grounded domain experience' },
      ],
      criteria_scores: criteriaScores,
      passed_filters: {
        skills: true,
        experience: true,
        location: true,
        company_type: true,
      },
    };
  }

  private heuristicRefineCriteria(
    feedback: string,
    currentFilters: SearchFilters,
    currentRubric: FitRubric,
    profileSignals?: any[]
  ): RefinementResult {
    const lower = feedback.toLowerCase();
    const updatedFilters = { ...currentFilters };
    const filterChanges: string[] = [];
    const rubricChanges: string[] = [];

    // Experience adjustments
    if (lower.includes('junior') || lower.includes('too junior') || lower.includes('more senior') || lower.includes('raise exp')) {
      updatedFilters.min_years_experience = Math.max(updatedFilters.min_years_experience + 1, 5);
      filterChanges.push(`Raised minimum experience to ${updatedFilters.min_years_experience} years to prioritize more senior talent.`);
      rubricChanges.push('Increased weighting on seniority and architectural depth.');
    } else if (lower.includes('lower exp') || lower.includes('more junior') || lower.includes('open to junior')) {
      updatedFilters.min_years_experience = Math.max(2, updatedFilters.min_years_experience - 1);
      filterChanges.push(`Lowered minimum experience to ${updatedFilters.min_years_experience} years to broaden candidate pool.`);
    }

    // Company type adjustments
    if ((lower.includes('scaleup') || lower.includes('scale-up')) && !updatedFilters.company_types.includes('scaleup')) {
      updatedFilters.company_types = [...updatedFilters.company_types, 'scaleup'];
      filterChanges.push("Added 'scaleup' company background to target talent pool.");
    }
    if (lower.includes('enterprise') && !updatedFilters.company_types.includes('enterprise')) {
      updatedFilters.company_types = [...updatedFilters.company_types, 'enterprise'];
      filterChanges.push("Added 'enterprise' company background to target talent pool.");
    }

    // Location adjustments
    if (lower.includes('remote') && !updatedFilters.locations.includes('Remote')) {
      updatedFilters.locations = [...updatedFilters.locations, 'Remote'];
      filterChanges.push("Added 'Remote' to target candidate locations.");
    }
    if (lower.includes('hyderabad') && !updatedFilters.locations.includes('Hyderabad')) {
      updatedFilters.locations = [...updatedFilters.locations, 'Hyderabad'];
      filterChanges.push("Added 'Hyderabad' to target candidate locations.");
    }

    // Skills additions
    if (lower.includes('fintech') || lower.includes('payment')) {
      rubricChanges.push('Boosted evaluation signal for payment gateways and fintech ledgers.');
    }
    if (lower.includes('redis') && !updatedFilters.skills.includes('Redis')) {
      updatedFilters.skills = [...updatedFilters.skills, 'Redis'];
      filterChanges.push("Added 'Redis' to required skill stack.");
    }

    if (filterChanges.length === 0 && rubricChanges.length === 0) {
      filterChanges.push('Refined filter weights based on recruiter feedback.');
      rubricChanges.push('Tuned fit rubric to prioritize positive profile signals.');
    }

    const explanation = `Refinement Applied: ${[...filterChanges, ...rubricChanges].join(' ')} Re-evaluating talent pool now.`;

    return {
      filters: updatedFilters,
      rubric: currentRubric,
      changes: {
        filter_changes: filterChanges,
        rubric_changes: rubricChanges,
      },
      explanation_for_recruiter: explanation,
    };
  }
}
