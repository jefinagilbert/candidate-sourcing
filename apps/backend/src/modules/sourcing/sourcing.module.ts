import { Module } from '@nestjs/common';
import { SourcingController } from './controllers/sourcing.controller';
import { SourcingService } from './services/sourcing.service';
import { LlmService } from './services/llm.service';
import { FilterEngineService } from './services/filter-engine.service';
import { RankingService } from './services/ranking.service';
import { CandidatesModule } from '../candidates/candidates.module';

@Module({
  imports: [CandidatesModule],
  controllers: [SourcingController],
  providers: [
    SourcingService,
    LlmService,
    FilterEngineService,
    RankingService,
  ],
  exports: [SourcingService, LlmService],
})
export class SourcingModule {}
