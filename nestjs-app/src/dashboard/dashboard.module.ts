import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { CallDetailRecord } from '../cdr/cdr.entity';
import { FreeSwitchExtension } from '../freeswitch/entities/freeswitch-extension.entity';
import { Domain } from '../freeswitch/entities/domain.entity';
import { FreeSwitchModule } from '../freeswitch/freeswitch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallDetailRecord, FreeSwitchExtension, Domain]),
    ScheduleModule.forRoot(),
    FreeSwitchModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
