import { io, Socket } from 'socket.io-client';
import { 
  DashboardStats, 
  CallCenterStats, 
  SystemStatus, 
  RecentActivity, 
  Alert, 
  LiveMetrics 
} from './dashboard.service';

export interface DashboardData {
  stats: DashboardStats;
  callCenterStats: CallCenterStats;
  systemStatus: SystemStatus;
  recentActivity: RecentActivity[];
  alerts: Alert[];
}

class DashboardWebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Dashboard WebSocket connected');
      this.emit('connected', { status: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Dashboard WebSocket disconnected');
      this.emit('disconnected', { status: true });
    });

    this.socket.on('dashboard:initial', (data: DashboardData) => {
      this.emit('initial-data', data);
    });

    this.socket.on('dashboard:stats', (stats: DashboardStats) => {
      this.emit('stats-update', stats);
    });

    this.socket.on('dashboard:live-metrics', (metrics: LiveMetrics) => {
      this.emit('metrics-update', metrics);
    });

    this.socket.on('dashboard:alerts', (alerts: Alert[]) => {
      this.emit('alerts-update', alerts);
    });

    this.socket.on('dashboard:activity', (activity: RecentActivity[]) => {
      this.emit('activity-update', activity);
    });

    this.socket.on('dashboard:activity-update', (activity: RecentActivity[]) => {
      this.emit('new-activity', activity);
    });

    this.socket.on('dashboard:new-alert', (alert: Alert) => {
      this.emit('new-alert', alert);
    });

    this.socket.on('dashboard:new-activity', (activity: RecentActivity) => {
      this.emit('single-activity', activity);
    });

    this.socket.on('dashboard:system-update', (update: Record<string, any>) => {
      this.emit('system-update', update);
    });

    this.socket.on('dashboard:error', (error: { message: string }) => {
      this.emit('error', error);
    });
  }

  subscribe() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:subscribe');
    }
  }

  unsubscribe() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:unsubscribe');
    }
  }

  requestStats() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:get-stats');
    }
  }

  requestLiveMetrics() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:get-live-metrics');
    }
  }

  requestAlerts() {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:get-alerts');
    }
  }

  requestActivity(query?: { limit?: number; type?: string; severity?: string }) {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:get-activity', query);
    }
  }

  // Event listener management
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  private emit(event: string, data: Record<string, any>) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in dashboard websocket callback for ${event}:`, error);
      }
    });
  }

  // Connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Reconnect
  reconnect() {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

// Export singleton instance
export const dashboardWebSocket = new DashboardWebSocketService();

// React hook for dashboard WebSocket
export function useDashboardWebSocket() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [liveMetrics, setLiveMetrics] = React.useState<LiveMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Connection status
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    };

    // Initial data
    const handleInitialData = (data: DashboardData) => {
      setDashboardData(data);
      setStats(data.stats);
      setAlerts(data.alerts);
      setRecentActivity(data.recentActivity);
    };

    // Stats updates
    const handleStatsUpdate = (newStats: DashboardStats) => {
      setStats(newStats);
    };

    // Metrics updates
    const handleMetricsUpdate = (metrics: LiveMetrics) => {
      setLiveMetrics(metrics);
    };

    // Alerts updates
    const handleAlertsUpdate = (newAlerts: Alert[]) => {
      setAlerts(newAlerts);
    };

    // Activity updates
    const handleActivityUpdate = (activity: RecentActivity[]) => {
      setRecentActivity(activity);
    };

    // New activity
    const handleNewActivity = (activity: RecentActivity[]) => {
      setRecentActivity(prev => [...activity, ...prev].slice(0, 50));
    };

    // Single new activity
    const handleSingleActivity = (activity: RecentActivity) => {
      setRecentActivity(prev => [activity, ...prev].slice(0, 50));
    };

    // New alert
    const handleNewAlert = (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    // Error handling
    const handleError = (err: { message: string }) => {
      setError(err.message);
    };

    // Register listeners
    dashboardWebSocket.on('connected', handleConnection);
    dashboardWebSocket.on('initial-data', handleInitialData);
    dashboardWebSocket.on('stats-update', handleStatsUpdate);
    dashboardWebSocket.on('metrics-update', handleMetricsUpdate);
    dashboardWebSocket.on('alerts-update', handleAlertsUpdate);
    dashboardWebSocket.on('activity-update', handleActivityUpdate);
    dashboardWebSocket.on('new-activity', handleNewActivity);
    dashboardWebSocket.on('single-activity', handleSingleActivity);
    dashboardWebSocket.on('new-alert', handleNewAlert);
    dashboardWebSocket.on('error', handleError);

    // Connect and subscribe
    dashboardWebSocket.connect();
    dashboardWebSocket.subscribe();

    return () => {
      // Cleanup listeners
      dashboardWebSocket.off('connected', handleConnection);
      dashboardWebSocket.off('initial-data', handleInitialData);
      dashboardWebSocket.off('stats-update', handleStatsUpdate);
      dashboardWebSocket.off('metrics-update', handleMetricsUpdate);
      dashboardWebSocket.off('alerts-update', handleAlertsUpdate);
      dashboardWebSocket.off('activity-update', handleActivityUpdate);
      dashboardWebSocket.off('new-activity', handleNewActivity);
      dashboardWebSocket.off('single-activity', handleSingleActivity);
      dashboardWebSocket.off('new-alert', handleNewAlert);
      dashboardWebSocket.off('error', handleError);

      dashboardWebSocket.unsubscribe();
    };
  }, []);

  const refreshStats = React.useCallback(() => {
    dashboardWebSocket.requestStats();
  }, []);

  const refreshMetrics = React.useCallback(() => {
    dashboardWebSocket.requestLiveMetrics();
  }, []);

  const refreshAlerts = React.useCallback(() => {
    dashboardWebSocket.requestAlerts();
  }, []);

  const refreshActivity = React.useCallback((query?: { limit?: number; type?: string; severity?: string }) => {
    dashboardWebSocket.requestActivity(query);
  }, []);

  return {
    isConnected,
    dashboardData,
    stats,
    liveMetrics,
    alerts,
    recentActivity,
    error,
    refreshStats,
    refreshMetrics,
    refreshAlerts,
    refreshActivity,
    reconnect: dashboardWebSocket.reconnect.bind(dashboardWebSocket),
  };
}

// Add React import for the hook
import React from 'react';
