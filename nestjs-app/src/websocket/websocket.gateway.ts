import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { ProfessionalAuthGuard } from '../auth/guards/professional-auth.guard';
import { EslService } from '../esl/esl.service';
import { AuthWsMiddleware } from './middleware/auth-ws.middleware';

export interface CallEvent {
  eventType: 'CHANNEL_CREATE' | 'CHANNEL_ANSWER' | 'CHANNEL_HANGUP' | 'CHANNEL_BRIDGE' | 'CHANNEL_UNBRIDGE';
  callId: string;
  callerNumber: string;
  calleeNumber: string;
  timestamp: Date;
  duration?: number;
  status: 'ringing' | 'answered' | 'hangup' | 'bridged';
  direction: 'inbound' | 'outbound';
  metadata?: Record<string, any>;
}

export interface ActiveCall {
  callId: string;
  callerNumber: string;
  calleeNumber: string;
  status: 'ringing' | 'answered' | 'bridged' | 'hold' | 'transferring';
  direction: 'inbound' | 'outbound';
  startTime: Date;
  answerTime?: Date;
  duration: number;
  recording?: boolean;
}

@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [process.env.FRONTEND_URL || 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(
    @Inject(forwardRef(() => EslService))
    private eslService: EslService,
    private authWsMiddleware: AuthWsMiddleware,
  ) {}

  afterInit(server: Server) {
    // Apply authentication middleware to all connections
    server.use(this.authWsMiddleware.createMiddleware());
    this.logger.log('WebSocket Gateway initialized with authentication middleware');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Send initial data to newly connected client
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  private async sendInitialData(client: Socket) {
    try {
      // Send current active calls
      const activeCalls = this.eslService.getActiveCalls();
      client.emit('active-calls', activeCalls);

      // Send system status
      const isConnected = await this.eslService.isConnected();
      client.emit('system-status', {
        freeswitchStatus: isConnected ? 'online' : 'offline',
        databaseStatus: 'connected', // TODO: Check database connection
        totalActiveCalls: activeCalls.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error sending initial data:', error);
    }
  }

  // Broadcast call events to all connected clients
  broadcastCallEvent(event: CallEvent) {
    this.logger.debug(`Broadcasting call event: ${event.eventType} for call ${event.callId}`);
    this.server.emit('call-event', event);
  }

  // Broadcast active calls update
  broadcastActiveCallsUpdate(activeCalls: ActiveCall[]) {
    this.server.emit('active-calls', activeCalls);
  }

  // Broadcast system status update
  broadcastSystemStatus(status: any) {
    this.server.emit('system-status', status);
  }

  // Handle call control commands from clients
  @SubscribeMessage('call-control')
  @UseGuards(ProfessionalAuthGuard)
  async handleCallControl(
    @MessageBody() data: { action: string; callId: string; params?: any },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Call control command: ${data.action} for call ${data.callId}`);
    
    try {
      // Implement call control via ESL service
      switch (data.action) {
        case 'hangup':
          await this.eslService.hangupCall(data.callId);
          break;
        case 'transfer':
          if (!data.params?.destination) {
            throw new Error('Transfer destination is required');
          }
          await this.eslService.transferCall(data.callId, data.params.destination);
          break;
        case 'hold':
          await this.eslService.holdCall(data.callId);
          break;
        case 'unhold':
          await this.eslService.unholdCall(data.callId);
          break;
        default:
          throw new Error(`Unknown call control action: ${data.action}`);
      }

      client.emit('call-control-response', {
        success: true,
        action: data.action,
        callId: data.callId,
      });
    } catch (error) {
      this.logger.error(`Call control error:`, error);
      client.emit('call-control-response', {
        success: false,
        action: data.action,
        callId: data.callId,
        error: error.message,
      });
    }
  }

  // Handle client requesting active calls refresh
  @SubscribeMessage('get-active-calls')
  async handleGetActiveCalls(@ConnectedSocket() client: Socket) {
    try {
      const activeCalls = this.eslService.getActiveCalls();
      client.emit('active-calls', activeCalls);
    } catch (error) {
      this.logger.error('Error getting active calls:', error);
      client.emit('error', { message: 'Failed to get active calls' });
    }
  }

  // Handle client requesting system status
  @SubscribeMessage('get-system-status')
  async handleGetSystemStatus(@ConnectedSocket() client: Socket) {
    try {
      const isConnected = await this.eslService.isConnected();
      const activeCallsCount = this.eslService.getActiveCallsCount();

      const status = {
        freeswitchStatus: isConnected ? 'online' : 'offline',
        databaseStatus: 'connected', // TODO: Check database connection
        totalActiveCalls: activeCallsCount,
        timestamp: new Date(),
      };
      client.emit('system-status', status);
    } catch (error) {
      this.logger.error('Error getting system status:', error);
      client.emit('error', { message: 'Failed to get system status' });
    }
  }
}
