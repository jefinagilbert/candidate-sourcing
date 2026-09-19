import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CandidateProfile } from '../../sourcing/entities/candidate-profile.entity';

@Injectable()
export class CandidatesService implements OnModuleInit {
  private readonly logger = new Logger(CandidatesService.name);
  private candidates: CandidateProfile[] = [];

  onModuleInit() {
    this.loadDataset();
  }

  private loadDataset() {
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'src/common/data/profiles.json'),
        path.join(process.cwd(), 'dist/common/data/profiles.json'),
        path.join(__dirname, '../data/profiles.json'),
        path.join(process.cwd(), 'src/modules/candidates/data/profiles.json'),
        path.join(process.cwd(), 'dist/modules/candidates/data/profiles.json'),
        path.join(__dirname, '../../../../src/modules/candidates/data/profiles.json'),
        path.join(process.cwd(), 'src/common/data/profiles.json - Flexiple Engineering Challenge sample data'),
      ];

      let loaded = false;
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          this.candidates = JSON.parse(rawData);
          this.logger.log(`Successfully loaded ${this.candidates.length} candidate profiles from ${filePath}`);
          loaded = true;
          break;
        }
      }

      if (!loaded) {
        this.logger.error('Could not find profiles.json in standard paths.');
      }
    } catch (error) {
      this.logger.error('Failed to load candidate dataset:', error);
    }
  }

  getAll(): CandidateProfile[] {
    return this.candidates;
  }

  getById(id: string): CandidateProfile | undefined {
    return this.candidates.find((c) => c.id.toLowerCase() === id.toLowerCase());
  }

  getDatasetStats() {
    const total = this.candidates.length;
    const companyTypes = this.candidates.reduce((acc, c) => {
      acc[c.current_company_type] = (acc[c.current_company_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locations = this.candidates.reduce((acc, c) => {
      acc[c.location] = (acc[c.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      companyTypes,
      locations,
    };
  }
}
