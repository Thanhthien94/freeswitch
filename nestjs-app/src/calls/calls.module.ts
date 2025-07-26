import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { LiveCallsController } from './live-calls.controller';
import { LiveCallsService } from './live-calls.service';
import { EslModule } from '../esl/esl.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [EslModule, WebSocketModule],
  controllers: [LiveCallsController, CallsController],
  providers: [CallsService, LiveCallsService],
  exports: [CallsService, LiveCallsService],
})
export class CallsModule {}
