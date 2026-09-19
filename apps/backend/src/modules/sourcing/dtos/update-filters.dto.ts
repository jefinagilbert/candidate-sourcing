import { SearchFilters } from '../entities/search-filters.entity';
import { FitRubric } from '../entities/fit-rubric.entity';

export class UpdateFiltersAndRubricDto {
  filters: SearchFilters;
  rubric: FitRubric;
}
