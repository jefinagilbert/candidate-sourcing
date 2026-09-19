export type CompanyType = 'startup' | 'scaleup' | 'enterprise' | 'agency';

export interface PastCompany {
  company: string;
  company_type: CompanyType;
  title: string;
  years: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  current_title: string;
  years_experience: number;
  location: string;
  current_company: string;
  current_company_type: CompanyType;
  skills: string[];
  past_companies: PastCompany[];
  education: string;
  summary: string;
}

export interface SearchFilters {
  skills: string[];
  min_years_experience: number;
  max_years_experience: number;
  locations: string[];
  company_types: CompanyType[];
  target_companies?: string[];
  keywords?: string[];
}

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  positive_signals: string[];
  negative_signals: string[];
}

export interface FitRubric {
  role_summary: string;
  criteria: RubricCriterion[];
  dealbreakers: string[];
}

export interface CandidateFactCitation {
  field: string;
  value: string;
  relevance: string;
}

export interface CriterionScore {
  criterion_id: string;
  criterion_name: string;
  score: number;
  reason: string;
}

export interface ScoredCandidate {
  profile: CandidateProfile;
  match_score: number;
  fit_level: 'Strong Match' | 'Good Match' | 'Moderate Fit' | 'Borderline';
  explanation: string;
  cited_facts: CandidateFactCitation[];
  criteria_scores: CriterionScore[];
  passed_filters: {
    skills: boolean;
    experience: boolean;
    location: boolean;
    company_type: boolean;
    notes?: string;
  };
  feedback?: 'match' | 'reject' | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  changes?: {
    filter_changes: string[];
    rubric_changes: string[];
  };
}

export interface SourcingState {
  currentQuery: string;
  needsClarification: boolean;
  clarificationMessage: string | null;
  suggestedClarifications: string[];
  filters: SearchFilters;
  rubric: FitRubric;
  candidates: ScoredCandidate[];
  totalPoolCount: number;
  filteredCount: number;
  exactMatchCount: number;
  activeLlmProvider: string;
  status: 'idle' | 'searching' | 'refining' | 'frozen' | 'error';
  errorMessage: string | null;
  refinementCount: number;
  freezeData: any | null;
}
