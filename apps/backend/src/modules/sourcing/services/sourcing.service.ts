import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';
import { FilterEngineService } from './filter-engine.service';
import { RankingService } from './ranking.service';
import { CandidatesService } from '../../candidates/services/candidates.service';
import { InitialSearchDto } from '../dtos/initial-search.dto';
import { RefineSearchDto } from '../dtos/refine-search.dto';
import { SearchFilters } from '../entities/search-filters.entity';
import { FitRubric, ScoredCandidate } from '../entities/fit-rubric.entity';

export interface SourcingSearchResult {
  query: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
  suggestedClarifications?: string[];
  filters: SearchFilters;
  rubric: FitRubric;
  results: ScoredCandidate[];
  totalPoolCount: number;
  filteredCount: number;
  exactMatchCount: number;
  activeLlmProvider: string;
}

export interface RefinementResponse {
  filters: SearchFilters;
  rubric: FitRubric;
  changes: {
    filter_changes: string[];
    rubric_changes: string[];
  };
  explanation: string;
  results: ScoredCandidate[];
  totalPoolCount: number;
  filteredCount: number;
  activeLlmProvider: string;
}

@Injectable()
export class SourcingService {
  private readonly logger = new Logger(SourcingService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly filterEngine: FilterEngineService,
    private readonly rankingService: RankingService,
    private readonly candidatesService: CandidatesService
  ) {}

  /**
   * Step 1-3: Free text to filters and rubric -> Filter locally -> Score and rank candidates.
   * Handles edge cases and misleading queries with friendly user clarification.
   */
  async executeInitialSearch(dto: InitialSearchDto): Promise<SourcingSearchResult> {
    this.logger.log(`Executing initial sourcing search for query: "${dto.query}"`);

    // 1. LLM Extraction: Free text -> Structured Filters + Fit Rubric (or Clarification request)
    const extracted = await this.llmService.extractFiltersAndRubric(dto.query);

    // If misleading or ambiguous, prompt user for more details
    if (extracted.needs_clarification) {
      return {
        query: dto.query,
        needsClarification: true,
        clarificationMessage: extracted.clarification_message,
        suggestedClarifications: extracted.suggested_clarifications,
        filters: extracted.filters,
        rubric: extracted.rubric,
        results: [],
        totalPoolCount: this.candidatesService.getAll().length,
        filteredCount: 0,
        exactMatchCount: 0,
        activeLlmProvider: this.llmService.getActiveProvider(),
      };
    }

    const { filters, rubric } = extracted;

    // 2. Filter local 48-profile dataset
    const allProfiles = this.candidatesService.getAll();
    const filterResults = this.filterEngine.filterCandidates(allProfiles, filters);
    const exactMatches = filterResults.filter((f) => f.isExactMatch).length;

    // 3. LLM Scoring and Ranking against Rubric
    const rankedCandidates = await this.rankingService.rankFilteredCandidates(
      filterResults,
      rubric
    );

    return {
      query: dto.query,
      needsClarification: false,
      filters,
      rubric,
      results: rankedCandidates.slice(0, 5),
      totalPoolCount: allProfiles.length,
      filteredCount: filterResults.length,
      exactMatchCount: exactMatches,
      activeLlmProvider: this.llmService.getActiveProvider(),
    };
  }

  /**
   * Step 4: Refine in conversation.
   * Adjusts filters and rubric based on recruiter feedback, re-runs search, and returns updated results.
   */
  async executeRefinement(dto: RefineSearchDto): Promise<RefinementResponse> {
    this.logger.log(`Executing refinement loop for feedback: "${dto.userFeedback}"`);

    const currentFilters: SearchFilters = dto.currentFilters || {
      skills: ['AWS RDS', 'Node.js'],
      min_years_experience: 3,
      max_years_experience: 8,
      locations: ['Bangalore'],
      company_types: ['startup'],
    };

    const currentRubric: FitRubric =
      dto.currentRubric && dto.currentRubric.criteria?.length > 0
        ? dto.currentRubric
        : {
            role_summary: 'Target Sourcing Candidate Requirements',
            criteria: [
              {
                id: 'cloud_db_backend',
                name: 'Cloud DB & Backend Proficiency',
                weight: 40,
                description: 'Hands-on experience with cloud databases (AWS RDS) and backend engineering.',
                positive_signals: ['AWS RDS tuning', 'High concurrency services'],
                negative_signals: ['No relational database depth'],
              },
              {
                id: 'company_culture_fit',
                name: 'High-Velocity Background',
                weight: 35,
                description: 'Experience shipping products at agile startups and scaleups.',
                positive_signals: ['Startup product building', 'Fast-paced execution'],
                negative_signals: ['Only legacy maintenance'],
              },
              {
                id: 'seniority_fit',
                name: 'Experience Alignment',
                weight: 25,
                description: 'Target experience level fit.',
                positive_signals: ['Production engineering depth'],
                negative_signals: ['Out of scope seniority'],
              },
            ],
            dealbreakers: ['No database experience'],
          };

    // 1. LLM adjusts filters and rubric based on conversational feedback & profile signals
    const refinement = await this.llmService.refineCriteria(
      dto.userFeedback,
      currentFilters,
      currentRubric,
      dto.profileSignals,
      dto.chatHistory
    );

    // 2. Re-filter local dataset with updated parameters
    const allProfiles = this.candidatesService.getAll();
    const filterResults = this.filterEngine.filterCandidates(allProfiles, refinement.filters);

    // 3. Re-score and rank candidates with updated rubric
    const rankedCandidates = await this.rankingService.rankFilteredCandidates(
      filterResults,
      refinement.rubric
    );

    return {
      filters: refinement.filters,
      rubric: refinement.rubric,
      changes: refinement.changes,
      explanation: refinement.explanation_for_recruiter,
      results: rankedCandidates.slice(0, 5),
      totalPoolCount: allProfiles.length,
      filteredCount: filterResults.length,
      activeLlmProvider: this.llmService.getActiveProvider(),
    };
  }

  /**
   * Step 2/3 direct manual update: Recruiter modifies filter chips/sliders or rubric directly on UI.
   */
  async reevaluateWithManualFilters(
    filters: SearchFilters,
    rubric: FitRubric
  ): Promise<{ results: ScoredCandidate[]; filteredCount: number }> {
    const allProfiles = this.candidatesService.getAll();
    const filterResults = this.filterEngine.filterCandidates(allProfiles, filters);
    const rankedCandidates = await this.rankingService.rankFilteredCandidates(
      filterResults,
      rubric
    );

    return {
      results: rankedCandidates.slice(0, 5),
      filteredCount: filterResults.length,
    };
  }

  /**
   * Step 5: Freeze search summary snapshot generation.
   */
  generateFreezeSummary(
    filters: SearchFilters,
    rubric: FitRubric,
    shortlist: ScoredCandidate[]
  ) {
    return {
      frozenAt: new Date().toISOString(),
      finalFilters: filters,
      finalRubric: rubric,
      shortlistCount: shortlist.length,
      shortlistCandidates: shortlist.map((c, index) => ({
        rank: index + 1,
        id: c.profile.id,
        name: c.profile.name,
        current_title: c.profile.current_title,
        current_company: c.profile.current_company,
        company_type: c.profile.current_company_type,
        years_experience: c.profile.years_experience,
        location: c.profile.location,
        match_score: c.match_score,
        fit_level: c.fit_level,
        key_skills: c.profile.skills,
        match_explanation: c.explanation,
        cited_facts: c.cited_facts,
      })),
    };
  }
}
