import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './websocket.gateway';
import { AuthModule } from '../auth/auth.module';
import { EslModule } from '../esl/esl.module';
import { AuthWsMiddleware } from './middleware/auth-ws.middleware';
import { HybridAuthWsMiddleware } from './middleware/hybrid-auth-ws.middleware';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => EslModule),
  ],
  providers: [RealtimeGateway, AuthWsMiddleware, HybridAuthWsMiddleware],
  exports: [RealtimeGateway, AuthWsMiddleware, HybridAuthWsMiddleware],
})
export class WebSocketModule {}
