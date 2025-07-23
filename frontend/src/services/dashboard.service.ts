import { api } from '@/lib/api-client';

export interface DashboardStats {
  activeCalls: number;
  todaysCalls: number;
  teamMembers: number;
  monthlyCost: number;
  callQuality: number;
  systemHealth: number;
  avgCallDuration: number;
  callsPerHour: number;
  peakHours: string;
  busyExtensions: number;
}

export interface CallCenterStats {
  queuedCalls: number;
  averageWaitTime: number;
  agentsOnline: number;
  agentsAvailable: number;
  agentsBusy: number;
  callsAnswered: number;
  callsAbandoned: number;
  serviceLevel: number;
  avgHandleTime: number;
}

export interface SystemStatus {
  freeswitchStatus: 'online' | 'offline' | 'degraded';
  databaseStatus: 'online' | 'offline' | 'degraded';
  redisStatus: 'online' | 'offline' | 'degraded';
  rabbitmqStatus: 'online' | 'offline' | 'degraded';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
}

export interface RecentActivity {
  id: string;
  type: 'call' | 'registration' | 'system' | 'user' | 'error';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  userName?: string;
  details?: Record<string, any>;
}

export interface DashboardData {
  stats: DashboardStats;
  callCenterStats: CallCenterStats;
  systemStatus: SystemStatus;
  recentActivity: RecentActivity[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  details?: Record<string, any>;
}

export interface LiveMetrics {
  timestamp: Date;
  activeCalls: number;
  callsPerMinute: number;
  systemLoad: number;
  memoryUsage: number;
  networkLatency: number;
}

export const dashboardService = {
  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  /**
   * Get real-time statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  /**
   * Get call center specific statistics
   */
  async getCallCenterStats(): Promise<CallCenterStats> {
    const response = await api.get<CallCenterStats>('/dashboard/call-center');
    return response.data;
  },

  /**
   * Get system status and health metrics
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get<SystemStatus>('/dashboard/system-status');
    return response.data;
  },

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
    const response = await api.get<RecentActivity[]>(`/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<Alert[]> {
    const response = await api.get<Alert[]>('/dashboard/alerts');
    return response.data;
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await api.patch(`/dashboard/alerts/${alertId}/acknowledge`);
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await api.patch(`/dashboard/alerts/${alertId}/resolve`);
  },

  /**
   * Get live metrics for real-time charts
   */
  async getLiveMetrics(): Promise<LiveMetrics> {
    const response = await api.get<LiveMetrics>('/dashboard/live-metrics');
    return response.data;
  },

  /**
   * Get historical metrics for charts
   */
  async getHistoricalMetrics(
    metric: string,
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d',
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
  ): Promise<{ timestamp: Date; value: number }[]> {
    const response = await api.get<{ timestamp: Date; value: number }[]>(
      `/dashboard/metrics/${metric}?range=${timeRange}&interval=${interval}`
    );
    return response.data;
  },

  /**
   * Get domain-specific dashboard data
   */
  async getDomainDashboard(domainId: string): Promise<DashboardData> {
    const response = await api.get<DashboardData>(`/dashboard/domain/${domainId}`);
    return response.data;
  },

  /**
   * Get user-specific dashboard data
   */
  async getUserDashboard(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard/user');
    return response.data;
  },

  /**
   * Export dashboard data
   */
  async exportDashboardData(
    format: 'json' | 'csv' | 'pdf',
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d'
  ): Promise<Blob> {
    const response = await api.get(
      `/dashboard/export?format=${format}&range=${timeRange}`
    );
    // Convert response to blob if needed
    return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  },

  /**
   * Get dashboard configuration
   */
  async getDashboardConfig(): Promise<any> {
    const response = await api.get<any>('/dashboard/config');
    return response.data;
  },

  /**
   * Update dashboard configuration
   */
  async updateDashboardConfig(config: any): Promise<void> {
    await api.put('/dashboard/config', config);
  },

  /**
   * Get performance insights
   */
  async getPerformanceInsights(): Promise<any> {
    const response = await api.get<any>('/dashboard/insights');
    return response.data;
  },

  /**
   * Get trending data
   */
  async getTrendingData(metric: string, period: '24h' | '7d' | '30d'): Promise<any> {
    const response = await api.get<any>(`/dashboard/trending/${metric}?period=${period}`);
    return response.data;
  }
};
