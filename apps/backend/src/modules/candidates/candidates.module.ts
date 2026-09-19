import { Module } from '@nestjs/common';
import { CandidatesService } from './services/candidates.service';
import { CandidatesController } from './controllers/candidates.controller';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
