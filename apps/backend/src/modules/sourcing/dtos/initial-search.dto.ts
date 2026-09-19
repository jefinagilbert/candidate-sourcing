import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class InitialSearchDto {
  @IsString()
  @IsNotEmpty({ message: 'Search query requirement cannot be empty' })
  query: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
