import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { EslModule } from '../esl/esl.module';

@Module({
  imports: [EslModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
