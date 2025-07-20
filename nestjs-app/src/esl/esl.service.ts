import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection as ESLConnection } from 'modesl';
import { CdrService } from '../cdr/cdr.service';
import { RealtimeGateway, CallEvent, ActiveCall } from '../websocket/websocket.gateway';

@Injectable()
export class EslService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EslService.name);
  private connection: ESLConnection;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  // Active calls tracking
  private activeCalls = new Map<string, ActiveCall>();

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private cdrService: CdrService,
    @Inject(forwardRef(() => RealtimeGateway))
    private realtimeGateway: RealtimeGateway,
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
        case 'CHANNEL_HANGUP_COMPLETE':
          this.handleChannelHangupComplete(event);
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

  private async handleChannelCreate(event: any): Promise<void> {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelCreate');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const callerNumber = event.getHeader('Caller-Caller-ID-Number');
      const destinationNumber = event.getHeader('Caller-Destination-Number');
      const direction = event.getHeader('Call-Direction') || 'inbound';

      // B-leg focused approach: Identify billing leg using FreeSWITCH variables
      // Check if this is the destination channel (B-leg) for billing
      const channelName = event.getHeader('Channel-Name') || '';
      const origination = event.getHeader('variable_origination_uuid') || '';
      const bridgedTo = event.getHeader('variable_bridge_to') || '';

      // B-leg is the channel that receives the call (has origination_uuid)
      const isBLeg = !!origination || channelName.includes('sofia/internal/' + destinationNumber);

      this.logger.log(`Channel created: ${callerNumber} -> ${destinationNumber} (${uuid}) [${direction}] ${isBLeg ? '[B-LEG-BILLING]' : '[A-LEG-TRACKING]'}`);

      // Create CDR record with B-leg billing flag
      const eventData = {
        uuid,
        caller_id_number: callerNumber,
        destination_number: destinationNumber,
        context: event.getHeader('Caller-Context'),
        domain_name: event.getHeader('variable_domain_name'),
        caller_ip: event.getHeader('Caller-Network-Addr'),
        user_agent: event.getHeader('variable_sip_user_agent'),
        created_time: event.getHeader('Caller-Channel-Created-Time'),
        direction,
        is_billing_leg: isBLeg, // B-leg is billing leg for agent
      };

      await this.cdrService.createCdrFromEvent(eventData);

      // Create active call entry
      const activeCall: ActiveCall = {
        callId: uuid,
        callerNumber,
        calleeNumber: destinationNumber,
        status: 'ringing',
        direction,
        startTime: new Date(),
        duration: 0,
        recording: false, // TODO: Check if recording is enabled
      };

      this.activeCalls.set(uuid, activeCall);

      // Broadcast real-time call event
      const callEvent: CallEvent = {
        eventType: 'CHANNEL_CREATE',
        callId: uuid,
        callerNumber,
        calleeNumber: destinationNumber,
        timestamp: new Date(),
        status: 'ringing',
        direction,
        metadata: {
          context: event.getHeader('Caller-Context'),
          domainName: event.getHeader('variable_domain_name'),
          callerIp: event.getHeader('Caller-Network-Addr'),
          userAgent: event.getHeader('variable_sip_user_agent'),
        },
      };

      this.realtimeGateway.broadcastCallEvent(callEvent);
      this.realtimeGateway.broadcastActiveCallsUpdate(Array.from(this.activeCalls.values()));

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

  private async handleChannelAnswer(event: any): Promise<void> {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelAnswer');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      this.logger.log(`Call answered: ${uuid}`);

      // Update CDR record
      const eventData = {
        answered_time: event.getHeader('Caller-Channel-Answered-Time'),
        answer_disposition: 'answered',
      };

      await this.cdrService.updateCdrOnAnswer(uuid, eventData);

      // Update active call
      const activeCall = this.activeCalls.get(uuid);
      if (activeCall) {
        activeCall.status = 'answered';
        activeCall.answerTime = new Date();
        this.activeCalls.set(uuid, activeCall);

        // Broadcast real-time call event
        const callEvent: CallEvent = {
          eventType: 'CHANNEL_ANSWER',
          callId: uuid,
          callerNumber: activeCall.callerNumber,
          calleeNumber: activeCall.calleeNumber,
          timestamp: new Date(),
          status: 'answered',
          direction: activeCall.direction,
          metadata: {
            answeredTime: event.getHeader('Caller-Channel-Answered-Time'),
          },
        };

        this.realtimeGateway.broadcastCallEvent(callEvent);
        this.realtimeGateway.broadcastActiveCallsUpdate(Array.from(this.activeCalls.values()));
      }

      this.eventEmitter.emit('call.answered', {
        uuid,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleChannelAnswer:', error);
    }
  }

  private async handleChannelHangup(event: any): Promise<void> {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelHangup');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const cause = event.getHeader('Hangup-Cause');
      const duration = event.getHeader('variable_duration');

      this.logger.log(`Call hangup: ${uuid} (${cause})`);

      // Get active call before removing
      const activeCall = this.activeCalls.get(uuid);
      if (activeCall) {
        // Calculate final duration
        const finalDuration = duration ? parseInt(duration) :
          Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000);

        // Broadcast real-time call event
        const callEvent: CallEvent = {
          eventType: 'CHANNEL_HANGUP',
          callId: uuid,
          callerNumber: activeCall.callerNumber,
          calleeNumber: activeCall.calleeNumber,
          timestamp: new Date(),
          duration: finalDuration,
          status: 'hangup',
          direction: activeCall.direction,
          metadata: {
            hangupCause: cause,
            duration: finalDuration,
          },
        };

        this.realtimeGateway.broadcastCallEvent(callEvent);

        // Remove from active calls
        this.activeCalls.delete(uuid);
        this.realtimeGateway.broadcastActiveCallsUpdate(Array.from(this.activeCalls.values()));
      }

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

  private async handleChannelHangupComplete(event: any): Promise<void> {
    try {
      if (!event || typeof event.getHeader !== 'function') {
        this.logger.warn('Invalid event in handleChannelHangupComplete');
        return;
      }

      const uuid = event.getHeader('Unique-ID');
      const cause = event.getHeader('Hangup-Cause');

      this.logger.log(`Call hangup complete: ${uuid} (${cause}) - Processing CDR`);

      // Complete CDR record with all final data
      const eventData = {
        hangup_time: event.getHeader('Caller-Channel-Hangup-Time'),
        hangup_cause: cause,
        hangup_disposition: event.getHeader('variable_hangup_disposition'),
        recording_enabled: event.getHeader('variable_record_session') === 'true',
        recording_file_path: event.getHeader('variable_recording_file_path'),
        audio_quality_score: event.getHeader('variable_rtp_audio_in_quality_percentage'),
        packet_loss: event.getHeader('variable_rtp_audio_in_packet_loss_percent'),
        jitter: event.getHeader('variable_rtp_audio_in_jitter_min_variance'),
        latency: event.getHeader('variable_rtp_audio_in_mean_interval'),
        duration: event.getHeader('variable_duration'),
        billsec: event.getHeader('variable_billsec'),
        progresssec: event.getHeader('variable_progresssec'),
        answersec: event.getHeader('variable_answersec'),
        waitsec: event.getHeader('variable_waitsec'),
        progress_mediasec: event.getHeader('variable_progress_mediasec'),
        flow_billsec: event.getHeader('variable_flow_billsec'),
        mduration: event.getHeader('variable_mduration'),
        billusec: event.getHeader('variable_billusec'),
        progressusec: event.getHeader('variable_progressusec'),
        answerusec: event.getHeader('variable_answerusec'),
        waitusec: event.getHeader('variable_waitusec'),
        progress_mediausec: event.getHeader('variable_progress_mediausec'),
        flow_billusec: event.getHeader('variable_flow_billusec'),
        uduration: event.getHeader('variable_uduration'),
      };

      await this.cdrService.updateCdrOnHangup(uuid, eventData);

      this.eventEmitter.emit('call.hangup.complete', {
        uuid,
        cause,
        timestamp: new Date(),
        event: typeof event.serialize === 'function' ? event.serialize('json') : null
      });
    } catch (error) {
      this.logger.error('Error in handleChannelHangupComplete:', error);
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

  async getActiveCallsFromFreeSWITCH(): Promise<any[]> {
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

  // Active calls management
  getActiveCalls(): ActiveCall[] {
    // Update durations for active calls
    const now = new Date();
    const activeCallsArray = Array.from(this.activeCalls.values()).map(call => ({
      ...call,
      duration: Math.floor((now.getTime() - call.startTime.getTime()) / 1000),
    }));

    return activeCallsArray;
  }

  getActiveCallsCount(): number {
    return this.activeCalls.size;
  }

  // Call control methods
  async hangupCall(callId: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_kill', callId);
      this.logger.log(`Hangup call initiated: ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to hangup call ${callId}:`, error);
      throw error;
    }
  }

  async transferCall(callId: string, destination: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_transfer', `${callId} ${destination}`);
      this.logger.log(`Transfer call initiated: ${callId} -> ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to transfer call ${callId}:`, error);
      throw error;
    }
  }

  async holdCall(callId: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_hold', callId);

      // Update active call status
      const activeCall = this.activeCalls.get(callId);
      if (activeCall) {
        activeCall.status = 'hold';
        this.activeCalls.set(callId, activeCall);
        this.realtimeGateway.broadcastActiveCallsUpdate(Array.from(this.activeCalls.values()));
      }

      this.logger.log(`Hold call initiated: ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to hold call ${callId}:`, error);
      throw error;
    }
  }

  async unholdCall(callId: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    try {
      await this.connection.api('uuid_hold', `${callId} off`);

      // Update active call status
      const activeCall = this.activeCalls.get(callId);
      if (activeCall) {
        activeCall.status = activeCall.answerTime ? 'answered' : 'ringing';
        this.activeCalls.set(callId, activeCall);
        this.realtimeGateway.broadcastActiveCallsUpdate(Array.from(this.activeCalls.values()));
      }

      this.logger.log(`Unhold call initiated: ${callId}`);
    } catch (error) {
      this.logger.error(`Failed to unhold call ${callId}:`, error);
      throw error;
    }
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

  /**
   * Reload FreeSWITCH configuration
   */
  async reloadConfiguration(): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    return new Promise((resolve, reject) => {
      this.connection.api('reloadxml', (result) => {
        try {
          if (result && result.getBody) {
            const response = result.getBody();
            this.logger.log(`FreeSWITCH reloadxml response: ${response}`);
          } else {
            this.logger.log('FreeSWITCH reloadxml completed');
          }
          resolve();
        } catch (error) {
          this.logger.error('Failed to reload FreeSWITCH configuration:', error);
          reject(error);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('FreeSWITCH reload timeout'));
      }, 10000);
    });
  }

  /**
   * Execute FreeSWITCH API command
   */
  async executeCommand(command: string, args?: string): Promise<string> {
    if (!this.isConnectionActive()) {
      throw new Error('ESL not connected to FreeSWITCH');
    }

    return new Promise((resolve, reject) => {
      this.connection.api(command, args || '', (result) => {
        try {
          if (!result || typeof result.getBody !== 'function') {
            reject(new Error(`Invalid response from ${command} command`));
            return;
          }

          const response = result.getBody();
          resolve(response);
        } catch (error) {
          this.logger.error(`Failed to execute command ${command}:`, error);
          reject(error);
        }
      });
    });
  }
}
