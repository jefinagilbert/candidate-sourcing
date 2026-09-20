import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchFilters } from '../entities/search-filters.entity';
import { FitRubric } from '../entities/fit-rubric.entity';

export class ProfileFeedbackItem {
  @IsString()
  candidateId: string;

  @IsString()
  candidateName: string;

  @IsString()
  feedback: 'match' | 'reject' | 'neutral';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefineSearchDto {
  @IsString()
  @IsNotEmpty()
  userFeedback: string;

  @IsOptional()
  currentFilters?: SearchFilters;

  @IsOptional()
  currentRubric?: FitRubric;

  @IsOptional()
  @IsBoolean()
  strictMatch?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileFeedbackItem)
  profileSignals?: ProfileFeedbackItem[];

  @IsOptional()
  @IsArray()
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}
