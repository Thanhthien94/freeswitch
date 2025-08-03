import { apiClient } from '@/lib/api-client';

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    free: number;
    available: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
    free: number;
    path: string;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    interfaces: any[];
  };
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  lastCheck: string;
  description: string;
  port?: number;
  version?: string;
  pid?: number;
  memoryUsage?: number;
}

export interface FreeSwitchStatus {
  activeCalls: number;
  registeredExtensions: number;
  totalCalls: number;
  callsPerSecond: number;
  uptime: number;
  version: string;
  sessionCount: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: ServiceStatus[];
  metrics: SystemMetrics;
  freeswitch: FreeSwitchStatus;
  uptime: number;
  hostname: string;
  platform: string;
  nodeVersion: string;
}

export interface SystemStatusResponse {
  success: boolean;
  data: SystemHealth;
  timestamp: string;
  message: string;
}

export interface SystemMetricsResponse {
  success: boolean;
  data: SystemMetrics;
  timestamp: string;
  message: string;
}

export interface ServicesStatusResponse {
  success: boolean;
  data: ServiceStatus[];
  timestamp: string;
  message: string;
}

export interface FreeSwitchStatusResponse {
  success: boolean;
  data: FreeSwitchStatus;
  timestamp: string;
  message: string;
}

class SystemStatusService {
  private readonly baseUrl = '/system/status';

  /**
   * Get comprehensive system status including metrics, services, and FreeSWITCH data
   */
  async getSystemStatus(): Promise<SystemHealth> {
    console.log('🔍 SystemStatus Service: Fetching comprehensive system status');

    const response = await apiClient.get<SystemStatusResponse>(this.baseUrl);

    console.log('✅ SystemStatus Service: System status received:', response);
    return response.data; // response.data contains the SystemHealth object
  }

  /**
   * Get system metrics only (CPU, memory, disk, network)
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    console.log('🔍 SystemStatus Service: Fetching system metrics');

    const response = await apiClient.get<SystemMetricsResponse>(`${this.baseUrl}/metrics`);

    console.log('✅ SystemStatus Service: System metrics received:', response);
    return response.data;
  }

  /**
   * Get services status only
   */
  async getServicesStatus(): Promise<ServiceStatus[]> {
    console.log('🔍 SystemStatus Service: Fetching services status');

    const response = await apiClient.get<ServicesStatusResponse>(`${this.baseUrl}/services`);

    console.log('✅ SystemStatus Service: Services status received:', response);
    return response.data;
  }

  /**
   * Get FreeSWITCH specific status
   */
  async getFreeSwitchStatus(): Promise<FreeSwitchStatus> {
    console.log('🔍 SystemStatus Service: Fetching FreeSWITCH status');

    const response = await apiClient.get<FreeSwitchStatusResponse>(`${this.baseUrl}/freeswitch`);

    console.log('✅ SystemStatus Service: FreeSWITCH status received:', response);
    return response.data;
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Format bytes in human readable format
   */
  formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get status color based on service status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      case 'offline':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Get status badge variant
   */
  getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      case 'offline':
        return 'outline';
      default:
        return 'outline';
    }
  }

  /**
   * Get status label in Vietnamese
   */
  getStatusLabel(status: string): string {
    const labels = {
      'healthy': 'Hoạt động tốt',
      'warning': 'Cảnh báo',
      'critical': 'Nghiêm trọng',
      'offline': 'Offline'
    };
    return labels[status as keyof typeof labels] || 'Không xác định';
  }

  /**
   * Determine if metrics indicate warning or critical status
   */
  getMetricsHealthStatus(metrics: SystemMetrics): 'healthy' | 'warning' | 'critical' {
    if (metrics.cpu.usage > 90 || metrics.memory.usage > 95 || metrics.disk.usage > 95) {
      return 'critical';
    } else if (metrics.cpu.usage > 80 || metrics.memory.usage > 85 || metrics.disk.usage > 85) {
      return 'warning';
    }
    return 'healthy';
  }
}

export const systemStatusService = new SystemStatusService();
