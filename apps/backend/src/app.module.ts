import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { SourcingModule } from './modules/sourcing/sourcing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    CandidatesModule,
    SourcingModule,
  ],
})
export class AppModule {}
