import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { SourcingService } from '../services/sourcing.service';
import { InitialSearchDto } from '../dtos/initial-search.dto';
import { RefineSearchDto } from '../dtos/refine-search.dto';
import { UpdateFiltersAndRubricDto } from '../dtos/update-filters.dto';
import { LlmService } from '../services/llm.service';

@Controller('sourcing')
export class SourcingController {
  constructor(
    private readonly sourcingService: SourcingService,
    private readonly llmService: LlmService
  ) {}

  @Get('status')
  getStatus() {
    return {
      status: 'operational',
      activeLlmProvider: this.llmService.getActiveProvider(),
      supportedProviders: ['gemini', 'groq', 'openai', 'openrouter', 'heuristic'],
    };
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async initialSearch(@Body() dto: InitialSearchDto) {
    return await this.sourcingService.executeInitialSearch(dto);
  }

  @Post('refine')
  @HttpCode(HttpStatus.OK)
  async refineSearch(@Body() dto: RefineSearchDto) {
    return await this.sourcingService.executeRefinement(dto);
  }

  @Post('reevaluate')
  @HttpCode(HttpStatus.OK)
  async reevaluateManually(@Body() dto: UpdateFiltersAndRubricDto) {
    return await this.sourcingService.reevaluateWithManualFilters(dto.filters, dto.rubric);
  }

  @Post('freeze')
  @HttpCode(HttpStatus.OK)
  freezeSearch(@Body() body: { filters: any; rubric: any; shortlist: any[] }) {
    return this.sourcingService.generateFreezeSummary(
      body.filters,
      body.rubric,
      body.shortlist
    );
  }
}
