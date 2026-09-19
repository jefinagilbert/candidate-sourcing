export interface RubricCriterion {
  id: string;
  name: string;
  weight: number; // percentage, e.g. 35 for 35%
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
  score: number; // 0 - 100
  reason: string;
}

export interface ScoredCandidate {
  profile: any;
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
}
