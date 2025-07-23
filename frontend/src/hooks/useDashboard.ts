import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService, DashboardData, DashboardStats, CallCenterStats, SystemStatus, RecentActivity, Alert, LiveMetrics } from '@/services/dashboard.service';
import { useAuth } from './useAuth';

export interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  enableNotifications?: boolean;
}

export interface UseDashboardResult {
  // Data
  dashboardData: DashboardData | null;
  stats: DashboardStats | null;
  callCenterStats: CallCenterStats | null;
  systemStatus: SystemStatus | null;
  recentActivity: RecentActivity[];
  alerts: Alert[];
  liveMetrics: LiveMetrics | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshCallCenter: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;

  // Real-time controls
  startRealTime: () => void;
  stopRealTime: () => void;
  isRealTimeActive: boolean;

  // Metrics
  getHistoricalMetrics: (metric: string, timeRange: string, interval?: string) => Promise<any>;
  exportData: (format: string, timeRange: string) => Promise<void>;
}

export const useDashboard = (options: UseDashboardOptions = {}): UseDashboardResult => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealTime = true,
    enableNotifications = true
  } = options;

  const { user } = useAuth();

  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [callCenterStats, setCallCenterStats] = useState<CallCenterStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Safe state update
  const safeSetState = useCallback((setter: () => void) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  // Error handler
  const handleError = useCallback((err: any) => {
    console.error('Dashboard error:', err);
    safeSetState(() => setError(err.message || 'An error occurred'));
  }, [safeSetState]);

  // Refresh functions
  const refreshStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      safeSetState(() => setStats(data));
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, handleError]);

  const refreshCallCenter = useCallback(async () => {
    try {
      const data = await dashboardService.getCallCenterStats();
      safeSetState(() => setCallCenterStats(data));
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, handleError]);

  const refreshSystemStatus = useCallback(async () => {
    try {
      const data = await dashboardService.getSystemStatus();
      safeSetState(() => setSystemStatus(data));
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, handleError]);

  const refreshActivity = useCallback(async () => {
    try {
      const data = await dashboardService.getRecentActivity(50);
      safeSetState(() => setRecentActivity(data));
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, handleError]);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await dashboardService.getAlerts();
      safeSetState(() => setAlerts(data));
    } catch (err) {
      handleError(err);
    }
  }, [safeSetState, handleError]);

  const refresh = useCallback(async () => {
    if (!user) return;

    safeSetState(() => {
      setIsRefreshing(true);
      setError(null);
    });

    try {
      // For now, use mock data until backend is ready
      const mockStats: DashboardStats = {
        activeCalls: 24,
        todaysCalls: 1247,
        teamMembers: 12,
        monthlyCost: 2450,
        callQuality: 95,
        systemHealth: 98,
        avgCallDuration: 180,
        callsPerHour: 52,
        peakHours: '10:00-12:00',
        busyExtensions: 8
      };

      const mockCallCenterStats: CallCenterStats = {
        queuedCalls: 3,
        averageWaitTime: 45,
        agentsOnline: 12,
        agentsAvailable: 8,
        agentsBusy: 4,
        callsAnswered: 156,
        callsAbandoned: 8,
        serviceLevel: 87,
        avgHandleTime: 240
      };

      const mockSystemStatus: SystemStatus = {
        freeswitchStatus: 'online',
        databaseStatus: 'online',
        redisStatus: 'online',
        rabbitmqStatus: 'online',
        cpuUsage: 45,
        memoryUsage: 62,
        diskUsage: 78,
        networkLatency: 12,
        uptime: 86400
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'call',
          message: 'Incoming call from +1234567890 to extension 1001',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          severity: 'info',
          userName: 'John Doe'
        },
        {
          id: '2',
          type: 'registration',
          message: 'Extension 1002 registered successfully',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          severity: 'success',
          userName: 'Jane Smith'
        },
        {
          id: '3',
          type: 'system',
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'success'
        }
      ];

      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'performance',
          severity: 'medium',
          title: 'High CPU Usage',
          message: 'CPU usage has exceeded 80% for the last 5 minutes',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          acknowledged: false
        },
        {
          id: '2',
          type: 'system',
          severity: 'low',
          title: 'Disk Space Warning',
          message: 'Disk usage is at 78% capacity',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          acknowledged: true
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      safeSetState(() => {
        setStats(mockStats);
        setCallCenterStats(mockCallCenterStats);
        setSystemStatus(mockSystemStatus);
        setRecentActivity(mockActivity);
        setAlerts(mockAlerts);
        setIsLoading(false);
      });
    } catch (err) {
      handleError(err);
      safeSetState(() => setIsLoading(false));
    } finally {
      safeSetState(() => setIsRefreshing(false));
    }
  }, [user, safeSetState, handleError]);

  // Alert actions
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await dashboardService.acknowledgeAlert(alertId);
      await refreshAlerts();
    } catch (err) {
      handleError(err);
    }
  }, [refreshAlerts, handleError]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await dashboardService.resolveAlert(alertId);
      await refreshAlerts();
    } catch (err) {
      handleError(err);
    }
  }, [refreshAlerts, handleError]);

  // Real-time controls (simplified for now)
  const startRealTime = useCallback(() => {
    setIsRealTimeActive(true);
    // TODO: Implement WebSocket integration
  }, []);

  const stopRealTime = useCallback(() => {
    setIsRealTimeActive(false);
    // TODO: Implement WebSocket integration
  }, []);

  // Utility functions
  const getHistoricalMetrics = useCallback(async (metric: string, timeRange: string, interval?: string) => {
    try {
      return await dashboardService.getHistoricalMetrics(metric, timeRange as any, interval as any);
    } catch (err) {
      handleError(err);
      return [];
    }
  }, [handleError]);

  const exportData = useCallback(async (format: string, timeRange: string) => {
    try {
      const blob = await dashboardService.exportDashboardData(format as any, timeRange as any);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // Initial load
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && user && !isRealTimeActive) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, user, isRealTimeActive, refresh, refreshInterval]);

  // Real-time connection management (simplified)
  useEffect(() => {
    if (enableRealTime && user) {
      startRealTime();
    } else {
      stopRealTime();
    }

    return () => stopRealTime();
  }, [enableRealTime, user, startRealTime, stopRealTime]);

  return {
    // Data
    dashboardData,
    stats,
    callCenterStats,
    systemStatus,
    recentActivity,
    alerts,
    liveMetrics,

    // Loading states
    isLoading,
    isRefreshing,
    error,

    // Actions
    refresh,
    refreshStats,
    refreshCallCenter,
    refreshSystemStatus,
    refreshActivity,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,

    // Real-time controls
    startRealTime,
    stopRealTime,
    isRealTimeActive,

    // Metrics
    getHistoricalMetrics,
    exportData
  };
};
