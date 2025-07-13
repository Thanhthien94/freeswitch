import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdrController } from './cdr.controller';
import { CdrService } from './cdr.service';
import { CallDetailRecord } from './cdr.entity';
import { CallEvent } from './call-event.entity';
import { CallParticipant } from './call-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CallDetailRecord,
      CallEvent,
      CallParticipant,
    ]),
  ],
  controllers: [CdrController],
  providers: [CdrService],
  exports: [CdrService], // Export for use in other modules
})
export class CdrModule {}
