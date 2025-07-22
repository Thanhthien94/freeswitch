import { Module } from '@nestjs/common';
import { MinimalFreeSwitchService } from './services/minimal.service';
import { MinimalFreeSwitchController } from './controllers/minimal.controller';

@Module({
  imports: [],
  controllers: [MinimalFreeSwitchController],
  providers: [MinimalFreeSwitchService],
  exports: [MinimalFreeSwitchService],
})
export class MinimalFreeSwitchModule {}
