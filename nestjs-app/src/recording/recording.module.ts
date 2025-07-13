import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { CallDetailRecord } from '../cdr/cdr.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CallDetailRecord])],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
