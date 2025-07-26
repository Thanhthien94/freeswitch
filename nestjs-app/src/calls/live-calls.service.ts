import { Injectable, Logger } from '@nestjs/common';
import { EslService } from '../esl/esl.service';
import { RealtimeGateway } from '../websocket/websocket.gateway';

export interface LiveCall {
  uuid: string;
  direction: 'inbound' | 'outbound';
  callerNumber: string;
  callerName?: string;
  calleeNumber: string;
  calleeName?: string;
  status: 'ringing' | 'answered' | 'bridged' | 'hold' | 'transferring';
  startTime: Date;
  answerTime?: Date;
  duration: number;
  recording?: boolean;
  domain?: string;
  context?: string;
  sipProfile?: string;
  codec?: string;
  readCodec?: string;
  writeCodec?: string;
  localMediaIp?: string;
  remoteMediaIp?: string;
  userAgent?: string;
  hangupCause?: string;
  metadata?: Record<string, any>;
}

export interface LiveCallsStats {
  totalActiveCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  ringingCalls: number;
  bridgedCalls: number;
  holdCalls: number;
  averageDuration: number;
  longestCall: number;
  shortestCall: number;
  callsPerMinute: number;
  answerRate: number;
}

export interface CallControlAction {
  action: 'hangup' | 'transfer' | 'hold' | 'unhold' | 'park' | 'record' | 'stop_record';
  callId: string;
  destination?: string;
  context?: string;
  cause?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LiveCallsService {
  private readonly logger = new Logger(LiveCallsService.name);
  private callsCache: Map<string, LiveCall> = new Map();
  private lastUpdateTime: Date = new Date();
  private statsHistory: LiveCallsStats[] = [];

  constructor(
    private readonly eslService: EslService,
    private readonly websocketGateway: RealtimeGateway,
  ) {
    // Update calls cache every 2 seconds
    setInterval(() => {
      this.updateCallsCache();
    }, 2000);

    // Update stats every 10 seconds
    setInterval(() => {
      this.updateStats();
    }, 10000);
  }

  /**
   * Get all active calls with enhanced information
   */
  async getActiveCalls(): Promise<{
    success: boolean;
    data: LiveCall[];
    stats: LiveCallsStats;
    timestamp: string;
    message?: string;
  }> {
    try {
      this.logger.debug('Getting active calls with enhanced information');

      // Get calls from FreeSWITCH
      const freeswitchResponse: any = await this.eslService.getActiveCallsFromFreeSWITCH();

      // Handle case when no calls are active (FreeSWITCH returns {"row_count": 0})
      let liveCalls: LiveCall[] = [];

      // Check if response has rows array with data
      if (freeswitchResponse &&
          typeof freeswitchResponse === 'object' &&
          freeswitchResponse.rows &&
          Array.isArray(freeswitchResponse.rows) &&
          freeswitchResponse.rows.length > 0) {

        this.logger.debug(`Found ${freeswitchResponse.rows.length} active calls`);

        // Transform to LiveCall format
        liveCalls = await Promise.all(
          freeswitchResponse.rows.map((call: any) => this.transformToLiveCall(call))
        );
      } else {
        this.logger.debug('No active calls found or invalid response format');
      }

      // Update cache
      this.updateCache(liveCalls);

      // Calculate stats
      const stats = this.calculateStats(liveCalls);

      return {
        success: true,
        data: liveCalls,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get active calls:', error);
      return {
        success: false,
        data: [],
        stats: this.getEmptyStats(),
        timestamp: new Date().toISOString(),
        message: error.message,
      };
    }
  }

  /**
   * Get specific call information
   */
  async getCallInfo(callId: string): Promise<{
    success: boolean;
    data?: LiveCall;
    message?: string;
  }> {
    try {
      // Check cache first
      if (this.callsCache.has(callId)) {
        return {
          success: true,
          data: this.callsCache.get(callId),
        };
      }

      // Get from FreeSWITCH
      const channelInfo = await this.eslService.getChannelInfo(callId);
      const liveCall = await this.transformChannelInfoToLiveCall(channelInfo, callId);

      return {
        success: true,
        data: liveCall,
      };
    } catch (error) {
      this.logger.error(`Failed to get call info for ${callId}:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Execute call control action
   */
  async executeCallControl(action: CallControlAction): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      this.logger.log(`Executing call control: ${action.action} for call ${action.callId}`);

      let result: any;

      switch (action.action) {
        case 'hangup':
          await this.eslService.hangupCall(action.callId);
          result = { action: 'hangup', callId: action.callId, cause: action.cause };
          break;

        case 'transfer':
          if (!action.destination) {
            throw new Error('Destination is required for transfer');
          }
          await this.eslService.transfer(action.callId, action.destination, action.context || 'default');
          result = { action: 'transfer', callId: action.callId, destination: action.destination };
          break;

        case 'hold':
          await this.eslService.executeCommand('uuid_hold', action.callId);
          result = { action: 'hold', callId: action.callId };
          break;

        case 'unhold':
          await this.eslService.executeCommand('uuid_hold', `${action.callId} off`);
          result = { action: 'unhold', callId: action.callId };
          break;

        case 'park':
          await this.eslService.executeCommand('uuid_park', action.callId);
          result = { action: 'park', callId: action.callId };
          break;

        case 'record':
          const recordPath = `/recordings/${action.callId}_${Date.now()}.wav`;
          await this.eslService.executeCommand('uuid_record', `${action.callId} start ${recordPath}`);
          result = { action: 'record', callId: action.callId, recordPath };
          break;

        case 'stop_record':
          await this.eslService.executeCommand('uuid_record', `${action.callId} stop`);
          result = { action: 'stop_record', callId: action.callId };
          break;

        default:
          throw new Error(`Unsupported action: ${action.action}`);
      }

      // Broadcast to WebSocket clients
      this.websocketGateway.broadcastCallEvent({
        eventType: 'CHANNEL_BRIDGE', // Generic event for call control
        callId: action.callId,
        callerNumber: '',
        calleeNumber: '',
        timestamp: new Date(),
        status: 'answered',
        direction: 'inbound',
        metadata: { controlAction: action.action, result },
      });

      return {
        success: true,
        message: `${action.action} executed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to execute call control ${action.action}:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get live calls statistics
   */
  getStats(): LiveCallsStats {
    const activeCalls = Array.from(this.callsCache.values());
    return this.calculateStats(activeCalls);
  }

  /**
   * Get calls history for analytics
   */
  getStatsHistory(): LiveCallsStats[] {
    return this.statsHistory.slice(-100); // Last 100 stats entries
  }

  /**
   * Private methods
   */
  private async updateCallsCache(): Promise<void> {
    try {
      const result = await this.getActiveCalls();
      if (result.success) {
        this.lastUpdateTime = new Date();
        
        // Broadcast to WebSocket clients
        this.websocketGateway.broadcastActiveCallsUpdate(
          result.data.map(call => ({
            callId: call.uuid,
            callerNumber: call.callerNumber,
            calleeNumber: call.calleeNumber,
            status: call.status,
            direction: call.direction,
            startTime: call.startTime,
            answerTime: call.answerTime,
            duration: call.duration,
            recording: call.recording,
          }))
        );
      }
    } catch (error) {
      this.logger.error('Failed to update calls cache:', error);
    }
  }

  private updateStats(): void {
    const stats = this.getStats();
    this.statsHistory.push(stats);
    
    // Keep only last 1000 entries (about 2.7 hours of data)
    if (this.statsHistory.length > 1000) {
      this.statsHistory = this.statsHistory.slice(-1000);
    }
  }

  private updateCache(calls: LiveCall[]): void {
    // Clear cache
    this.callsCache.clear();
    
    // Update with new calls
    calls.forEach(call => {
      this.callsCache.set(call.uuid, call);
    });
  }

  private async transformToLiveCall(freeswitchCall: any): Promise<LiveCall> {
    const now = new Date();
    const startTime = freeswitchCall.created_time ? new Date(freeswitchCall.created_time * 1000) : now;
    const answerTime = freeswitchCall.answered_time ? new Date(freeswitchCall.answered_time * 1000) : undefined;

    return {
      uuid: freeswitchCall.uuid || freeswitchCall.call_uuid,
      direction: freeswitchCall.direction === 'outbound' ? 'outbound' : 'inbound',
      callerNumber: freeswitchCall.caller_id_number || freeswitchCall.cid_num || 'Unknown',
      callerName: freeswitchCall.caller_id_name || freeswitchCall.cid_name,
      calleeNumber: freeswitchCall.destination_number || freeswitchCall.dest || 'Unknown',
      calleeName: freeswitchCall.destination_name,
      status: this.determineCallStatus(freeswitchCall),
      startTime,
      answerTime,
      duration: Math.floor((now.getTime() - startTime.getTime()) / 1000),
      recording: freeswitchCall.record_session === 'true',
      domain: freeswitchCall.domain_name,
      context: freeswitchCall.context,
      sipProfile: freeswitchCall.sip_profile_name,
      codec: freeswitchCall.read_codec,
      readCodec: freeswitchCall.read_codec,
      writeCodec: freeswitchCall.write_codec,
      localMediaIp: freeswitchCall.local_media_ip,
      remoteMediaIp: freeswitchCall.remote_media_ip,
      userAgent: freeswitchCall.sip_user_agent,
      hangupCause: freeswitchCall.hangup_cause,
      metadata: {
        callState: freeswitchCall.callstate,
        sipCallId: freeswitchCall.sip_call_id,
        presence: freeswitchCall.presence_id,
      },
    };
  }

  private async transformChannelInfoToLiveCall(channelInfo: any, callId: string): Promise<LiveCall> {
    // Similar transformation but for detailed channel info
    const now = new Date();
    
    return {
      uuid: callId,
      direction: channelInfo.direction === 'outbound' ? 'outbound' : 'inbound',
      callerNumber: channelInfo.caller_id_number || 'Unknown',
      callerName: channelInfo.caller_id_name,
      calleeNumber: channelInfo.destination_number || 'Unknown',
      calleeName: channelInfo.destination_name,
      status: this.determineCallStatus(channelInfo),
      startTime: channelInfo.created_time ? new Date(channelInfo.created_time * 1000) : now,
      answerTime: channelInfo.answered_time ? new Date(channelInfo.answered_time * 1000) : undefined,
      duration: parseInt(channelInfo.duration) || 0,
      recording: channelInfo.record_session === 'true',
      domain: channelInfo.domain_name,
      context: channelInfo.context,
      sipProfile: channelInfo.sip_profile_name,
      codec: channelInfo.read_codec,
      readCodec: channelInfo.read_codec,
      writeCodec: channelInfo.write_codec,
      localMediaIp: channelInfo.local_media_ip,
      remoteMediaIp: channelInfo.remote_media_ip,
      userAgent: channelInfo.sip_user_agent,
      hangupCause: channelInfo.hangup_cause,
      metadata: channelInfo,
    };
  }

  private determineCallStatus(callData: any): 'ringing' | 'answered' | 'bridged' | 'hold' | 'transferring' {
    const callState = callData.callstate || callData.state;
    
    if (callState === 'ACTIVE') return 'answered';
    if (callState === 'RINGING') return 'ringing';
    if (callState === 'EARLY') return 'ringing';
    if (callState === 'HELD') return 'hold';
    if (callData.bridge_channel) return 'bridged';
    
    return 'answered'; // Default
  }

  private calculateStats(calls: LiveCall[]): LiveCallsStats {
    const totalActiveCalls = calls.length;
    const inboundCalls = calls.filter(c => c.direction === 'inbound').length;
    const outboundCalls = calls.filter(c => c.direction === 'outbound').length;
    const answeredCalls = calls.filter(c => c.status === 'answered' || c.status === 'bridged').length;
    const ringingCalls = calls.filter(c => c.status === 'ringing').length;
    const bridgedCalls = calls.filter(c => c.status === 'bridged').length;
    const holdCalls = calls.filter(c => c.status === 'hold').length;

    const durations = calls.map(c => c.duration).filter(d => d > 0);
    const averageDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const longestCall = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestCall = durations.length > 0 ? Math.min(...durations) : 0;

    // Calculate calls per minute (simplified)
    const callsPerMinute = totalActiveCalls; // This would need more sophisticated calculation

    // Calculate answer rate
    const answerRate = totalActiveCalls > 0 ? Math.round((answeredCalls / totalActiveCalls) * 100) : 0;

    return {
      totalActiveCalls,
      inboundCalls,
      outboundCalls,
      answeredCalls,
      ringingCalls,
      bridgedCalls,
      holdCalls,
      averageDuration,
      longestCall,
      shortestCall,
      callsPerMinute,
      answerRate,
    };
  }

  private getEmptyStats(): LiveCallsStats {
    return {
      totalActiveCalls: 0,
      inboundCalls: 0,
      outboundCalls: 0,
      answeredCalls: 0,
      ringingCalls: 0,
      bridgedCalls: 0,
      holdCalls: 0,
      averageDuration: 0,
      longestCall: 0,
      shortestCall: 0,
      callsPerMinute: 0,
      answerRate: 0,
    };
  }
}
