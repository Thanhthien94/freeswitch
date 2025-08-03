import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemStatusController } from './controllers/system-status.controller';
import { SystemStatusService } from './services/system-status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
  ],
  controllers: [
    SystemStatusController,
  ],
  providers: [
    SystemStatusService,
  ],
  exports: [
    SystemStatusService,
  ],
})
export class SystemModule {}
