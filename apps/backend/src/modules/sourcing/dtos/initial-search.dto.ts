import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class InitialSearchDto {
  @IsString()
  @IsNotEmpty({ message: 'Search query requirement cannot be empty' })
  query: string;

  @IsOptional()
  @IsBoolean()
  strictMatch?: boolean;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
