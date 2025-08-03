'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Users,
  Phone,
  Network
} from 'lucide-react';
import { systemStatusService, SystemHealth } from '@/services/system-status.service';

// Interfaces are now imported from the service

export function SystemStatusPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load real system status data
  useEffect(() => {
    const loadSystemStatus = async () => {
      setIsLoading(true);

      try {
        console.log('🔍 SystemStatusPage: Loading system status...');
        const systemStatus = await systemStatusService.getSystemStatus();

        console.log('✅ SystemStatusPage: System status loaded:', systemStatus);
        setSystemHealth(systemStatus);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('❌ SystemStatusPage: Failed to load system status:', error);
        setSystemHealth(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSystemStatus();

    // Auto refresh every 30 seconds
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use helper functions from service
  const formatUptime = systemStatusService.formatUptime;
  const formatBytes = systemStatusService.formatBytes;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={systemStatusService.getStatusBadgeVariant(status)}>
        {systemStatusService.getStatusLabel(status)}
      </Badge>
    );
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 SystemStatusPage: Manual refresh triggered');
      const systemStatus = await systemStatusService.getSystemStatus();
      setSystemHealth(systemStatus);
      setLastUpdate(new Date());
      console.log('✅ SystemStatusPage: Manual refresh completed');
    } catch (error) {
      console.error('❌ SystemStatusPage: Manual refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Đang tải trạng thái hệ thống...</span>
        </div>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Không thể kết nối</h3>
          <p className="text-muted-foreground">Không thể lấy thông tin trạng thái hệ thống.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">
            Giám sát trạng thái và hiệu suất hệ thống thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
          </div>
          <Button variant="outline" size="sm" onClick={refreshStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemHealth.overall)}
              <CardTitle>Tổng quan hệ thống</CardTitle>
            </div>
            {getStatusBadge(systemHealth.overall)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-medium">{formatUptime(systemHealth.uptime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cuộc gọi đang hoạt động</p>
                <p className="font-medium">{systemHealth.freeswitch.activeCalls}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Extensions đã đăng ký</p>
                <p className="font-medium">{systemHealth.freeswitch.registeredExtensions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Services hoạt động</p>
                <p className="font-medium">
                  {systemHealth.services.filter(s => s.status === 'healthy').length}/
                  {systemHealth.services.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.metrics.cpu.usage}%</div>
            <Progress value={systemHealth.metrics.cpu.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {systemHealth.metrics.cpu.cores} cores
              {systemHealth.metrics.cpu.temperature && ` • ${systemHealth.metrics.cpu.temperature}°C`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.metrics.memory.usage}%</div>
            <Progress value={systemHealth.metrics.memory.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {systemHealth.metrics.memory.used}GB / {systemHealth.metrics.memory.total}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.metrics.disk.usage}%</div>
            <Progress value={systemHealth.metrics.disk.usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {systemHealth.metrics.disk.used}GB / {systemHealth.metrics.disk.total}GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>In:</span>
                <span>{formatBytes(systemHealth.metrics.network.bytesIn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Out:</span>
                <span>{formatBytes(systemHealth.metrics.network.bytesOut)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {systemHealth.metrics.network.packetsIn.toLocaleString()} packets in
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Services Status
          </CardTitle>
          <CardDescription>
            Trạng thái chi tiết của các dịch vụ hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Uptime: {formatUptime(service.uptime)}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.port && `Port: ${service.port}`}
                      {service.version && ` • v${service.version}`}
                    </p>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
