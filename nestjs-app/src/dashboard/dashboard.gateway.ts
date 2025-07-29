import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Interval } from '@nestjs/schedule';

@WebSocketGateway({
  namespace: '/dashboard',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class DashboardGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(private readonly dashboardService: DashboardService) {}

  afterInit(server: Server) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Dashboard client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Send initial dashboard data
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Dashboard client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  private async sendInitialData(client: Socket) {
    try {
      const dashboardData = await this.dashboardService.getDashboardData();
      client.emit('dashboard:initial', dashboardData);
    } catch (error) {
      this.logger.error('Error sending initial dashboard data:', error);
      client.emit('dashboard:error', { message: 'Failed to load dashboard data' });
    }
  }

  @SubscribeMessage('dashboard:subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(`Client ${client.id} subscribed to dashboard updates`);
    client.join('dashboard-updates');
    return { status: 'subscribed' };
  }

  @SubscribeMessage('dashboard:unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} unsubscribed from dashboard updates`);
    client.leave('dashboard-updates');
    return { status: 'unsubscribed' };
  }

  @SubscribeMessage('dashboard:get-stats')
  async handleGetStats(@ConnectedSocket() client: Socket) {
    try {
      const stats = await this.dashboardService.getStats();
      client.emit('dashboard:stats', stats);
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      client.emit('dashboard:error', { message: 'Failed to get stats' });
    }
  }

  @SubscribeMessage('dashboard:get-live-metrics')
  async handleGetLiveMetrics(@ConnectedSocket() client: Socket) {
    try {
      const metrics = await this.dashboardService.getLiveMetrics();
      client.emit('dashboard:live-metrics', metrics);
    } catch (error) {
      this.logger.error('Error getting live metrics:', error);
      client.emit('dashboard:error', { message: 'Failed to get live metrics' });
    }
  }

  @SubscribeMessage('dashboard:get-alerts')
  async handleGetAlerts(@ConnectedSocket() client: Socket) {
    try {
      const alerts = await this.dashboardService.getAlerts();
      client.emit('dashboard:alerts', alerts);
    } catch (error) {
      this.logger.error('Error getting alerts:', error);
      client.emit('dashboard:error', { message: 'Failed to get alerts' });
    }
  }

  @SubscribeMessage('dashboard:get-activity')
  async handleGetActivity(@ConnectedSocket() client: Socket, @MessageBody() query: any) {
    try {
      const activity = await this.dashboardService.getRecentActivity(query || { limit: 50 });
      client.emit('dashboard:activity', activity);
    } catch (error) {
      this.logger.error('Error getting recent activity:', error);
      client.emit('dashboard:error', { message: 'Failed to get activity' });
    }
  }

  // Real-time updates every 5 seconds
  @Interval(5000)
  async broadcastLiveMetrics() {
    if (this.connectedClients.size === 0) {
      return;
    }

    try {
      const metrics = await this.dashboardService.getLiveMetrics();
      this.server.to('dashboard-updates').emit('dashboard:live-metrics', metrics);
    } catch (error) {
      this.logger.error('Error broadcasting live metrics:', error);
    }
  }

  // Stats updates every 30 seconds
  @Interval(30000)
  async broadcastStats() {
    if (this.connectedClients.size === 0) {
      return;
    }

    try {
      const stats = await this.dashboardService.getStats();
      this.server.to('dashboard-updates').emit('dashboard:stats', stats);
    } catch (error) {
      this.logger.error('Error broadcasting stats:', error);
    }
  }

  // Activity updates every 10 seconds
  @Interval(10000)
  async broadcastActivity() {
    if (this.connectedClients.size === 0) {
      return;
    }

    try {
      const activity = await this.dashboardService.getRecentActivity({ limit: 10 });
      this.server.to('dashboard-updates').emit('dashboard:activity-update', activity);
    } catch (error) {
      this.logger.error('Error broadcasting activity:', error);
    }
  }

  // Alert updates every 60 seconds
  @Interval(60000)
  async broadcastAlerts() {
    if (this.connectedClients.size === 0) {
      return;
    }

    try {
      const alerts = await this.dashboardService.getAlerts();
      this.server.to('dashboard-updates').emit('dashboard:alerts', alerts);
    } catch (error) {
      this.logger.error('Error broadcasting alerts:', error);
    }
  }

  // Manual broadcast methods for external triggers
  async broadcastNewAlert(alert: any) {
    this.server.to('dashboard-updates').emit('dashboard:new-alert', alert);
  }

  async broadcastNewActivity(activity: any) {
    this.server.to('dashboard-updates').emit('dashboard:new-activity', activity);
  }

  async broadcastSystemUpdate(update: any) {
    this.server.to('dashboard-updates').emit('dashboard:system-update', update);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Send message to specific client
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Send to specific room
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
