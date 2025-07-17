import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, CallEvent, ActiveCall, SystemStatus, CallControlResponse } from '@/services/websocket.service';
import { useAuth } from './useAuth';

interface ConnectionStatus {
  connected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  error?: string;
  reason?: string;
}

interface UseWebSocketReturn {
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Real-time data
  activeCalls: ActiveCall[];
  systemStatus: SystemStatus | null;
  
  // Call control methods
  hangupCall: (callId: string) => void;
  transferCall: (callId: string, destination: string) => void;
  holdCall: (callId: string) => void;
  unholdCall: (callId: string) => void;
  
  // Data refresh methods
  refreshActiveCalls: () => void;
  refreshSystemStatus: () => void;
  
  // Event subscription
  onCallEvent: (callback: (event: CallEvent) => void) => () => void;
  onCallControlResponse: (callback: (response: CallControlResponse) => void) => () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { token, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  });
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  // Use refs to store latest callback references
  const callEventCallbacks = useRef<Set<(event: CallEvent) => void>>(new Set());
  const callControlCallbacks = useRef<Set<(response: CallControlResponse) => void>>(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) {
      websocketService.disconnect();
      return;
    }

    const connect = async () => {
      try {
        await websocketService.connect(token);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated, token]);

  // Set up event listeners
  useEffect(() => {
    // Connection status listener
    const handleConnectionStatus = (status: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        connected: status.connected,
        error: status.error,
        reason: status.reason,
        ...websocketService.connectionState,
      }));
    };

    // Active calls listener
    const handleActiveCalls = (calls: ActiveCall[]) => {
      setActiveCalls(calls);
    };

    // System status listener
    const handleSystemStatus = (status: SystemStatus) => {
      setSystemStatus(status);
    };

    // Call event listener
    const handleCallEvent = (event: CallEvent) => {
      // Notify all subscribed callbacks
      callEventCallbacks.current.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in call event callback:', error);
        }
      });

      // Update active calls based on call events
      setActiveCalls(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(call => call.callId === event.callId);

        switch (event.eventType) {
          case 'CHANNEL_CREATE':
            if (existingIndex === -1) {
              updated.push({
                callId: event.callId,
                callerNumber: event.callerNumber,
                calleeNumber: event.calleeNumber,
                status: 'ringing',
                direction: event.direction,
                startTime: new Date(event.timestamp),
                duration: 0,
              });
            }
            break;

          case 'CHANNEL_ANSWER':
            if (existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: 'answered',
                answerTime: new Date(event.timestamp),
              };
            }
            break;

          case 'CHANNEL_BRIDGE':
            if (existingIndex !== -1) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: 'bridged',
              };
            }
            break;

          case 'CHANNEL_HANGUP':
            return updated.filter(call => call.callId !== event.callId);

          default:
            break;
        }

        return updated;
      });
    };

    // Call control response listener
    const handleCallControlResponse = (response: CallControlResponse) => {
      // Notify all subscribed callbacks
      callControlCallbacks.current.forEach(callback => {
        try {
          callback(response);
        } catch (error) {
          console.error('Error in call control response callback:', error);
        }
      });
    };

    // Error listener
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: error.message || 'WebSocket error',
      }));
    };

    // Subscribe to events
    websocketService.on('connection-status', handleConnectionStatus);
    websocketService.on('active-calls', handleActiveCalls);
    websocketService.on('system-status', handleSystemStatus);
    websocketService.on('call-event', handleCallEvent);
    websocketService.on('call-control-response', handleCallControlResponse);
    websocketService.on('error', handleError);

    // Cleanup listeners
    return () => {
      websocketService.off('connection-status', handleConnectionStatus);
      websocketService.off('active-calls', handleActiveCalls);
      websocketService.off('system-status', handleSystemStatus);
      websocketService.off('call-event', handleCallEvent);
      websocketService.off('call-control-response', handleCallControlResponse);
      websocketService.off('error', handleError);
    };
  }, []);

  // Call control methods
  const hangupCall = useCallback((callId: string) => {
    websocketService.hangupCall(callId);
  }, []);

  const transferCall = useCallback((callId: string, destination: string) => {
    websocketService.transferCall(callId, destination);
  }, []);

  const holdCall = useCallback((callId: string) => {
    websocketService.holdCall(callId);
  }, []);

  const unholdCall = useCallback((callId: string) => {
    websocketService.unholdCall(callId);
  }, []);

  // Data refresh methods
  const refreshActiveCalls = useCallback(() => {
    websocketService.requestActiveCalls();
  }, []);

  const refreshSystemStatus = useCallback(() => {
    websocketService.requestSystemStatus();
  }, []);

  // Event subscription methods
  const onCallEvent = useCallback((callback: (event: CallEvent) => void) => {
    callEventCallbacks.current.add(callback);
    
    // Return cleanup function
    return () => {
      callEventCallbacks.current.delete(callback);
    };
  }, []);

  const onCallControlResponse = useCallback((callback: (response: CallControlResponse) => void) => {
    callControlCallbacks.current.add(callback);
    
    // Return cleanup function
    return () => {
      callControlCallbacks.current.delete(callback);
    };
  }, []);

  return {
    connectionStatus,
    activeCalls,
    systemStatus,
    hangupCall,
    transferCall,
    holdCall,
    unholdCall,
    refreshActiveCalls,
    refreshSystemStatus,
    onCallEvent,
    onCallControlResponse,
  };
};
