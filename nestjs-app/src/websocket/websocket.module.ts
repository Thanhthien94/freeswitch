import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './websocket.gateway';
import { AuthModule } from '../auth/auth.module';
import { EslModule } from '../esl/esl.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => EslModule),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class WebSocketModule {}
