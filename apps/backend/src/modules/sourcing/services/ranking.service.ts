import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';
import { CandidateProfile } from '../entities/candidate-profile.entity';
import { FitRubric, ScoredCandidate } from '../entities/fit-rubric.entity';
import { FilterResultItem } from './filter-engine.service';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Scores and ranks candidates against the subjective fit rubric.
   * Ensures top 4-5 profiles are returned with rich, cited explanations.
   */
  async rankFilteredCandidates(
    filterResults: FilterResultItem[],
    rubric: FitRubric
  ): Promise<ScoredCandidate[]> {
    if (filterResults.length === 0) {
      return [];
    }

    // Pick top matching pool for in-depth LLM scoring
    const candidatesToScore: CandidateProfile[] = filterResults
      .slice(0, 12)
      .map((item) => item.profile);

    const scoredCandidates = await this.llmService.scoreCandidates(candidatesToScore, rubric);

    // Attach accurate filter pass status to each scored candidate
    const resultMap = new Map<string, FilterResultItem>();
    filterResults.forEach((fr) => resultMap.set(fr.profile.id.toLowerCase(), fr));

    const finalRanked = scoredCandidates.map((sc) => {
      const matchStatus = resultMap.get(sc.profile.id.toLowerCase());
      if (matchStatus) {
        sc.passed_filters = matchStatus.filterPassStatus;
      }
      return sc;
    });

    return finalRanked.sort((a, b) => b.match_score - a.match_score);
  }
}
