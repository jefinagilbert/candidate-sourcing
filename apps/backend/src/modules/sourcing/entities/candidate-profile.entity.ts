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
