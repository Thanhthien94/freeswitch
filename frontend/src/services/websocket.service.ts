import { io, Socket } from 'socket.io-client';

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
  status: 'ringing' | 'answered' | 'bridged' | 'hold';
  direction: 'inbound' | 'outbound';
  startTime: Date;
  answerTime?: Date;
  duration: number;
  recording?: boolean;
}

export interface SystemStatus {
  freeswitchStatus: 'online' | 'offline' | 'error';
  databaseStatus: 'connected' | 'disconnected' | 'error';
  totalActiveCalls: number;
  timestamp: Date;
}

export interface CallControlResponse {
  success: boolean;
  action: string;
  callId: string;
  error?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Initialize event listener sets
    this.eventListeners.set('call-event', new Set());
    this.eventListeners.set('active-calls', new Set());
    this.eventListeners.set('system-status', new Set());
    this.eventListeners.set('call-control-response', new Set());
    this.eventListeners.set('connection-status', new Set());
    this.eventListeners.set('error', new Set());
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const wsUrl = apiUrl.replace('/api/v1', '').replace('http', 'ws');

        this.socket = io(`${wsUrl}/realtime`, {
          auth: token ? { token } : undefined,
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connection-status', { connected: true });
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.emit('connection-status', { connected: false, reason });
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          this.emit('connection-status', { connected: false, error: error.message });
          this.handleReconnect();
          reject(error);
        });

        // Set up event handlers
        this.setupEventHandlers();

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Call events
    this.socket.on('call-event', (event: CallEvent) => {
      this.emit('call-event', event);
    });

    // Active calls updates
    this.socket.on('active-calls', (calls: ActiveCall[]) => {
      this.emit('active-calls', calls);
    });

    // System status updates
    this.socket.on('system-status', (status: SystemStatus) => {
      this.emit('system-status', status);
    });

    // Call control responses
    this.socket.on('call-control-response', (response: CallControlResponse) => {
      this.emit('call-control-response', response);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.emit('connection-status', { connected: false });
    }
  }

  // Event subscription methods
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Call control methods
  hangupCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call-control', { action: 'hangup', callId });
    }
  }

  transferCall(callId: string, destination: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call-control', { action: 'transfer', callId, params: { destination } });
    }
  }

  holdCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call-control', { action: 'hold', callId });
    }
  }

  unholdCall(callId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('call-control', { action: 'unhold', callId });
    }
  }

  // Data request methods
  requestActiveCalls() {
    if (this.socket && this.isConnected) {
      this.socket.emit('get-active-calls');
    }
  }

  requestSystemStatus() {
    if (this.socket && this.isConnected) {
      this.socket.emit('get-system-status');
    }
  }

  // Getters
  get connected() {
    return this.isConnected;
  }

  get connectionState() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
