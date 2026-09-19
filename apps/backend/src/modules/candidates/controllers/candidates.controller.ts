import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CandidatesService } from '../services/candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  getAllCandidates() {
    return {
      total: this.candidatesService.getAll().length,
      candidates: this.candidatesService.getAll(),
    };
  }

  @Get('stats')
  getStats() {
    return this.candidatesService.getDatasetStats();
  }

  @Get(':id')
  getCandidateById(@Param('id') id: string) {
    const candidate = this.candidatesService.getById(id);
    if (!candidate) {
      throw new NotFoundException(`Candidate profile with ID ${id} not found.`);
    }
    return candidate;
  }
}
