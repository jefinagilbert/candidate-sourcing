import { CompanyType } from './candidate-profile.entity';

export interface SearchFilters {
  skills: string[];
  min_years_experience: number;
  max_years_experience: number;
  locations: string[];
  company_types: CompanyType[];
  target_companies?: string[];
  keywords?: string[];
}
