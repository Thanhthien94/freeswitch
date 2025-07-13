import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EslService } from './esl.service';
import { CdrModule } from '../cdr/cdr.module';

@Module({
  imports: [ConfigModule, CdrModule],
  providers: [EslService],
  exports: [EslService],
})
export class EslModule {}
