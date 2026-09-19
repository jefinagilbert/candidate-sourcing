import { fetchJson } from './api.service';
import {
  SearchFilters,
  FitRubric,
  ScoredCandidate,
} from '../types/sourcing.types';

export interface SearchResponse {
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

export interface RefineResponse {
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

export const SourcingApiService = {
  async getStatus() {
    return fetchJson<{ status: string; activeLlmProvider: string; supportedProviders: string[] }>(
      '/sourcing/status'
    );
  },

  async executeInitialSearch(query: string): Promise<SearchResponse> {
    return fetchJson<SearchResponse>('/sourcing/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  async executeRefinement(params: {
    userFeedback: string;
    currentFilters: SearchFilters;
    currentRubric: FitRubric;
    profileSignals?: Array<{ candidateId: string; candidateName: string; feedback: string; reason?: string }>;
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<RefineResponse> {
    return fetchJson<RefineResponse>('/sourcing/refine', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async reevaluateFilters(filters: SearchFilters, rubric: FitRubric) {
    return fetchJson<{ results: ScoredCandidate[]; filteredCount: number }>(
      '/sourcing/reevaluate',
      {
        method: 'POST',
        body: JSON.stringify({ filters, rubric }),
      }
    );
  },

  async freezeSearch(filters: SearchFilters, rubric: FitRubric, shortlist: ScoredCandidate[]) {
    return fetchJson<any>('/sourcing/freeze', {
      method: 'POST',
      body: JSON.stringify({ filters, rubric, shortlist }),
    });
  },
};
