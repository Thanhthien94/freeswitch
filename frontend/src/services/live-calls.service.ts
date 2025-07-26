import { api } from '@/lib/api-client';

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

export interface LiveCallsResponse {
  success: boolean;
  data: LiveCall[];
  stats: LiveCallsStats;
  timestamp: string;
  message?: string;
}

export interface CallControlAction {
  action: 'hangup' | 'transfer' | 'hold' | 'unhold' | 'park' | 'record' | 'stop_record';
  destination?: string;
  context?: string;
  cause?: string;
  metadata?: Record<string, any>;
}

export interface CallControlResponse {
  success: boolean;
  message: string;
  data?: any;
}

class LiveCallsService {
  /**
   * Get all active calls with enhanced information
   */
  async getActiveCalls(): Promise<LiveCallsResponse> {
    try {
      const response = await api.get<LiveCallsResponse>('/calls/live');
      return response;
    } catch (error) {
      console.error('Failed to get active calls:', error);
      throw error;
    }
  }

  /**
   * Get live calls statistics
   */
  async getStats(): Promise<{
    success: boolean;
    data: LiveCallsStats;
    timestamp: string;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: LiveCallsStats;
        timestamp: string;
      }>('/calls/live/stats');
      return response;
    } catch (error) {
      console.error('Failed to get live calls stats:', error);
      throw error;
    }
  }

  /**
   * Get live calls statistics history
   */
  async getStatsHistory(limit?: number): Promise<{
    success: boolean;
    data: LiveCallsStats[];
    total: number;
    timestamp: string;
  }> {
    try {
      const url = limit ? `/calls/live/stats/history?limit=${limit}` : '/calls/live/stats/history';
      const response = await api.get<{
        success: boolean;
        data: LiveCallsStats[];
        total: number;
        timestamp: string;
      }>(url);
      return response;
    } catch (error) {
      console.error('Failed to get live calls stats history:', error);
      throw error;
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
      const response = await api.get<{
        success: boolean;
        data?: LiveCall;
        message?: string;
      }>(`/calls/live/${callId}`);
      return response;
    } catch (error) {
      console.error(`Failed to get call info for ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Execute call control action
   */
  async executeCallControl(callId: string, action: CallControlAction): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/control`, action);
      return response;
    } catch (error) {
      console.error(`Failed to execute call control ${action.action}:`, error);
      throw error;
    }
  }

  /**
   * Hangup a call
   */
  async hangupCall(callId: string, cause?: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/hangup`, { cause });
      return response;
    } catch (error) {
      console.error(`Failed to hangup call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Transfer a call
   */
  async transferCall(callId: string, destination: string, context?: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/transfer`, {
        destination,
        context: context || 'default',
      });
      return response;
    } catch (error) {
      console.error(`Failed to transfer call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Put call on hold
   */
  async holdCall(callId: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/hold`);
      return response;
    } catch (error) {
      console.error(`Failed to hold call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Remove call from hold
   */
  async unholdCall(callId: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/unhold`);
      return response;
    } catch (error) {
      console.error(`Failed to unhold call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Park a call
   */
  async parkCall(callId: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/park`);
      return response;
    } catch (error) {
      console.error(`Failed to park call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Start recording a call
   */
  async startRecording(callId: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/record`);
      return response;
    } catch (error) {
      console.error(`Failed to start recording call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Stop recording a call
   */
  async stopRecording(callId: string): Promise<CallControlResponse> {
    try {
      const response = await api.post<CallControlResponse>(`/calls/live/${callId}/stop-record`);
      return response;
    } catch (error) {
      console.error(`Failed to stop recording call ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get call status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'ringing':
        return 'bg-yellow-100 text-yellow-800';
      case 'answered':
        return 'bg-green-100 text-green-800';
      case 'bridged':
        return 'bg-blue-100 text-blue-800';
      case 'hold':
        return 'bg-orange-100 text-orange-800';
      case 'transferring':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get direction badge color
   */
  getDirectionColor(direction: string): string {
    switch (direction) {
      case 'inbound':
        return 'bg-green-100 text-green-800';
      case 'outbound':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const liveCallsService = new LiveCallsService();
