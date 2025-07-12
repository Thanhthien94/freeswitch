import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection as ESLConnection } from 'modesl';

@Injectable()
export class EslService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EslService.name);
  private connection: ESLConnection;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.connection) {
      this.connection.disconnect();
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const host = this.configService.get('FREESWITCH_HOST', 'localhost');
      const port = this.configService.get('FREESWITCH_ESL_PORT', 8021);
      const password = this.configService.get('FREESWITCH_ESL_PASSWORD', 'ClueCon');

      this.logger.log(`Connecting to FreeSWITCH at ${host}:${port}`);

      this.connection = new ESLConnection(host, port, password, () => {
        this.logger.log('Connected to FreeSWITCH ESL');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.setupEventHandlers();
        this.eventEmitter.emit('esl.connected');
      });

      this.connection.on('error', (error) => {
        this.logger.error('ESL Connection error:', error);
        this.isConnecting = false;
        this.eventEmitter.emit('esl.error', error);
        this.handleReconnect();
      });

      this.connection.on('end', () => {
        this.logger.warn('ESL Connection ended');
        this.isConnecting = false;
        this.eventEmitter.emit('esl.disconnected');
        this.handleReconnect();
      });

    } catch (error) {
      this.logger.error('Failed to connect to FreeSWITCH:', error);
      this.isConnecting = false;
      this.eventEmitter.emit('esl.error', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    try {
      // Subscribe to all events
      this.connection.events('plain', 'all');
      
      // Handle events
      this.connection.on('esl::event::**', (event) => {
        this.handleEvent(event);
      });

      this.logger.log('Event handlers setup completed');
    } catch (error) {
      this.logger.error('Failed to setup event handlers:', error);
    }
  }

  private handleEvent(event: any): void {
    try {
      // Debug: log event object structure (only when debug enabled)
      // this.logger.debug('Raw event received:', {
      //   type: typeof event,
      //   hasGetHeader: typeof event?.getHeader === 'function',
      //   keys: event ? Object.keys(event) : 'null'
      // });

      // Check if event is valid and has getHeader method
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event object received - missing getHeader method');
        return;
      }

      const eventName = event.getHeader('Event-Name');

      if (!eventName) {
        // Some system events don't have Event-Name header (heartbeat, etc.)
        this.logger.debug('Event received without Event-Name header - likely system event');
        return;
      }

      switch (eventName) {
        case 'CHANNEL_CREATE':
          this.handleChannelCreate(event);
          break;
        case 'CHANNEL_ANSWER':
          this.handleChannelAnswer(event);
          break;
        case 'CHANNEL_HANGUP':
          this.handleChannelHangup(event);
          break;
        case 'DTMF':
          this.handleDtmf(event);
          break;
        case 'BACKGROUND_JOB':
          this.handleBackgroundJob(event);
          break;
        default:
          this.logger.debug(`Received event: ${eventName}`);
      }

      // Emit generic event for other modules to listen
      this.eventEmitter.emit(`freeswitch.${eventName.toLowerCase()}`, event);
    } catch (error) {
      this.logger.error('Error handling event:', {
        error: error.message,
        stack: error.stack,
        eventType: typeof event,
        eventKeys: event ? Object.keys(event) : 'null'
      });
    }
  }

  private handleChannelCreate(event: any): void {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelCreate');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const callerNumber = event.getHeader('Caller-Caller-ID-Number');
      const destinationNumber = event.getHeader('Caller-Destination-Number');

      this.logger.log(`New call: ${callerNumber} -> ${destinationNumber} (${uuid})`);

      this.eventEmitter.emit('call.created', {
        uuid,
        callerNumber,
        destinationNumber,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleChannelCreate:', error);
    }
  }

  private handleChannelAnswer(event: any): void {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelAnswer');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      this.logger.log(`Call answered: ${uuid}`);

      this.eventEmitter.emit('call.answered', {
        uuid,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleChannelAnswer:', error);
    }
  }

  private handleChannelHangup(event: any): void {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelHangup');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const cause = event.getHeader('Hangup-Cause');
      const duration = event.getHeader('variable_duration');

      this.logger.log(`Call hangup: ${uuid} (${cause})`);

      this.eventEmitter.emit('call.hangup', {
        uuid,
        cause,
        duration: duration ? parseInt(duration) : 0,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleChannelHangup:', error);
    }
  }

  private handleDtmf(event: any): void {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleDtmf');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const digit = event.getHeader('DTMF-Digit');

      this.logger.log(`DTMF: ${digit} on ${uuid}`);

      this.eventEmitter.emit('call.dtmf', {
        uuid,
        digit,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleDtmf:', error);
    }
  }

  private handleBackgroundJob(event: any): void {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleBackgroundJob');
        return;
      }

      const jobUuid = event.getHeader('Job-UUID');
      const result = event && typeof event.getBody === 'function' ? event.getBody() : null;

      this.logger.debug(`Background job completed: ${jobUuid}`);

      this.eventEmitter.emit('background.job.completed', {
        jobUuid,
        result,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Error in handleBackgroundJob:', error);
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      this.logger.warn(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.logger.error('Max reconnection attempts reached');
      this.eventEmitter.emit('esl.max_reconnect_reached');
    }
  }

  // API Methods
  async originate(destination: string, context: string = 'default', timeout: number = 30): Promise<any> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    const uuid = await this.createUuid();
    const command = `{origination_uuid=${uuid},origination_timeout=${timeout}}sofia/internal/${destination} &park()`;

    return new Promise((resolve, reject) => {
      this.connection.bgapi('originate', command, (result) => {
        try {
          if (!result || typeof result.getHeader !== 'function') {
            reject(new Error('Invalid response from originate command'));
            return;
          }

          const jobUuid = result.getHeader('Job-UUID');
          resolve({
            uuid,
            jobUuid: jobUuid || 'unknown',
            success: true
          });
        } catch (error) {
          this.logger.error('Originate failed:', error);
          reject(error);
        }
      });
    });
  }

  async hangup(uuid: string, cause: string = 'NORMAL_CLEARING'): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_kill', `${uuid} ${cause}`);
    } catch (error) {
      this.logger.error(`Failed to hangup ${uuid}:`, error);
      throw error;
    }
  }

  async transfer(uuid: string, destination: string, context: string = 'default'): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_transfer', `${uuid} ${destination} XML ${context}`);
    } catch (error) {
      this.logger.error(`Failed to transfer ${uuid}:`, error);
      throw error;
    }
  }

  async playback(uuid: string, file: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_broadcast', `${uuid} ${file} aleg`);
    } catch (error) {
      this.logger.error(`Failed to playback on ${uuid}:`, error);
      throw error;
    }
  }

  async getChannelInfo(uuid: string): Promise<any> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      const result = await this.connection.api('uuid_dump', uuid);
      if (!result || typeof result.getBody !== 'function') {
        throw new Error('Invalid response from uuid_dump API');
      }
      return this.parseChannelInfo(result.getBody());
    } catch (error) {
      this.logger.error(`Failed to get channel info for ${uuid}:`, error);
      throw error;
    }
  }

  async getActiveCalls(): Promise<any[]> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    return new Promise((resolve, reject) => {
      this.connection.api('show', 'channels as json', (result) => {
        try {
          if (!result || typeof result.getBody !== 'function') {
            this.logger.warn('Invalid response from show channels API, returning empty array');
            resolve([]);
            return;
          }
          const body = result.getBody();
          resolve(body ? JSON.parse(body) : []);
        } catch (error) {
          this.logger.error('Failed to get active calls:', error);
          reject(error);
        }
      });
    });
  }

  async getStatus(): Promise<any> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    return new Promise((resolve, reject) => {
      this.connection.api('status', (result) => {
        try {
          if (!result || typeof result.getBody !== 'function') {
            resolve({
              connected: true,
              status: 'Unknown - Invalid response',
              uptime: this.getUptime()
            });
            return;
          }
          resolve({
            connected: true,
            status: result.getBody(),
            uptime: this.getUptime()
          });
        } catch (error) {
          this.logger.error('Failed to get status:', error);
          reject(error);
        }
      });
    });
  }

  private createUuid(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.connection.api('create_uuid', (result) => {
        try {
          if (!result || typeof result.getBody !== 'function') {
            reject(new Error('Invalid response from create_uuid API'));
            return;
          }
          const uuid = result.getBody().trim();
          resolve(uuid);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private parseChannelInfo(data: string): any {
    const info = {};
    const lines = data.split('\n');

    lines.forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        info[key.trim()] = value.trim();
      }
    });

    return info;
  }

  private getUptime(): number {
    return process.uptime();
  }

  // Health check
  async isConnected(): Promise<boolean> {
    try {
      if (!this.connection) return false;

      return new Promise((resolve) => {
        this.connection.api('status', (result) => {
          try {
            if (!result || typeof result.getBody !== 'function') {
              resolve(false);
              return;
            }
            const body = result.getBody();
            // Check if FreeSWITCH is UP and ready
            resolve(body && (body.includes('UP') || body.includes('ready')));
          } catch {
            resolve(false);
          }
        });
      });
    } catch {
      return false;
    }
  }

  // Simple sync connection check
  private isConnectionActive(): boolean {
    return !!this.connection;
  }

  // Get connection status
  getConnectionStatus(): any {
    return {
      connected: this.connection ? true : false,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnecting: this.isConnecting
    };
  }
}
