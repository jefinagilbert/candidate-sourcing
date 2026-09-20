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
  message?: string;
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
  message?: string;
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

  async executeInitialSearch(query: string, strictMatch: boolean = true): Promise<SearchResponse> {
    return fetchJson<SearchResponse>('/sourcing/search', {
      method: 'POST',
      body: JSON.stringify({ query, strictMatch }),
    });
  },

  async executeRefinement(params: {
    userFeedback: string;
    currentFilters: SearchFilters;
    currentRubric: FitRubric;
    strictMatch?: boolean;
    profileSignals?: Array<{ candidateId: string; candidateName: string; feedback: string; reason?: string }>;
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<RefineResponse> {
    return fetchJson<RefineResponse>('/sourcing/refine', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async reevaluateFilters(filters: SearchFilters, rubric: FitRubric, strictMatch: boolean = true) {
    return fetchJson<{ results: ScoredCandidate[]; filteredCount: number; message?: string }>(
      '/sourcing/reevaluate',
      {
        method: 'POST',
        body: JSON.stringify({ filters, rubric, strictMatch }),
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
