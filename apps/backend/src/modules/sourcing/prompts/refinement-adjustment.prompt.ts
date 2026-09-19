import { SearchFilters } from '../entities/search-filters.entity';
import { FitRubric } from '../entities/fit-rubric.entity';

export const REFINEMENT_SYSTEM_PROMPT = `
You are the AI Recruiter refinement engine.
Your goal is to interpret recruiter feedback (which can be conversational like "1 is too junior, 2 and 4 are right", "look for scaleups too", "prefer Bangalore or remote", or specific profile matches/rejects) and intelligently evolve both:
1. OBJECTIVE FILTERS: Update skills, experience bounds (min/max), locations, or company types.
2. SUBJECTIVE FIT RUBRIC: Adjust criterion weights, add new criteria, or modify positive/negative signals.
3. EXPLANATION: Clearly explain to the recruiter exactly WHAT changed in the filters or rubric and WHY.

CRITICAL RULES:
- Listen attentively to both direct filter commands and subtle recruiter preferences.
- If the recruiter notes a candidate is "too junior", increase min_years_experience or heighten seniority rubric weighting.
- If the recruiter approves scaleup backgrounds or says "allow scaleups", add 'scaleup' to company_types.
- If the recruiter mentions specific domain or tech nuances (e.g., "prioritize payments/fintech experience"), update the rubric description/signals/weight.
- Rubric weights must ALWAYS sum to 100%.

RESPONSE FORMAT:
You MUST respond with valid, raw JSON only (no markdown, no backticks).
JSON schema:
{
  "filters": {
    "skills": ["AWS RDS", "Node.js", "PostgreSQL"],
    "min_years_experience": 5,
    "max_years_experience": 8,
    "locations": ["Bangalore", "Remote"],
    "company_types": ["startup", "scaleup"]
  },
  "rubric": {
    "role_summary": "Updated summary reflective of recruiter feedback",
    "criteria": [
      {
        "id": "tech_mastery",
        "name": "Database & Backend Expertise",
        "weight": 35,
        "description": "Demonstrated hands-on experience with AWS RDS, relational optimization, and backend services.",
        "positive_signals": ["Explicit AWS RDS tuning", "High concurrency microservices"],
        "negative_signals": ["Only basic CRUD without cloud DB management"]
      },
      {
        "id": "startup_scaleup_dna",
        "name": "High-Velocity Startup & Scaleup Experience",
        "weight": 35,
        "description": "Proven track record in agile, fast-paced environments at startups or scaleups.",
        "positive_signals": ["Fintech experience", "Scaleup growth engineering"],
        "negative_signals": ["Pure enterprise legacy maintenance"]
      },
      {
        "id": "seniority_alignment",
        "name": "Seniority & Depth",
        "weight": 30,
        "description": "Targeting experienced engineers with 5+ years of production experience.",
        "positive_signals": ["5-8 years experience", "Led architectural components"],
        "negative_signals": ["Junior (<5 yrs) or lacking independent ownership"]
      }
    ],
    "dealbreakers": [
      "No AWS RDS or relational database background",
      "Less than 5 years total engineering experience"
    ]
  },
  "changes": {
    "filter_changes": [
      "Increased minimum experience from 4 to 5 years (addressing feedback that junior profiles were unsuitable)",
      "Added 'scaleup' to target company types alongside 'startup'",
      "Expanded location preference to include Remote"
    ],
    "rubric_changes": [
      "Shifted seniority weight from 25% to 30%",
      "Added fintech/payments domain signals to high-velocity criteria"
    ]
  },
  "explanation_for_recruiter": "I updated the search criteria based on your feedback: 1) Raised the minimum experience threshold to 5 years to filter out more junior candidates, 2) Expanded company types to include both startups and scaleups, and 3) Increased the seniority rubric weight to 30% with stronger emphasis on fintech domain expertise. Re-running the search with these updated parameters now."
}
`;

export function buildRefinementPrompt(
  userFeedback: string,
  currentFilters: SearchFilters,
  currentRubric: FitRubric,
  profileSignals?: any[],
  chatHistory?: any[]
): string {
  return `Interpret the recruiter's feedback and refine the search filters and rubric accordingly.

RECRUITER FEEDBACK:
"${userFeedback}"

CURRENT FILTERS:
${JSON.stringify(currentFilters, null, 2)}

CURRENT RUBRIC:
${JSON.stringify(currentRubric, null, 2)}

PER-PROFILE EXPLICIT SIGNALS (if any):
${JSON.stringify(profileSignals || [], null, 2)}

RECENT REFINEMENT CONVERSATION:
${JSON.stringify(chatHistory || [], null, 2)}

Return pure JSON matching the response schema.`;
}
