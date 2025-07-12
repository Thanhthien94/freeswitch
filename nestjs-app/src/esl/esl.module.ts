import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EslService } from './esl.service';

@Module({
  imports: [ConfigModule],
  providers: [EslService],
  exports: [EslService],
})
export class EslModule {}
