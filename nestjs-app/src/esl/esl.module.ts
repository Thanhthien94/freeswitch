import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EslService } from './esl.service';
import { CdrModule } from '../cdr/cdr.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    CdrModule,
    forwardRef(() => WebSocketModule),
  ],
  providers: [EslService],
  exports: [EslService],
})
export class EslModule {}
