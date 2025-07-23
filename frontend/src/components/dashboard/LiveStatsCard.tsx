'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import {
  Phone,
  Users,
  BarChart3,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface LiveStatsCardProps {
  className?: string;
}

export const LiveStatsCard: React.FC<LiveStatsCardProps> = ({ className }) => {
  const {
    stats,
    callCenterStats,
    systemStatus,
    isLoading,
    isRefreshing,
    error,
    refresh,
    isRealTimeActive,
    startRealTime,
    stopRealTime,
    exportData
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    enableRealTime: true
  });

  const handleExport = async () => {
    await exportData('csv', '24h');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load dashboard data</span>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Dashboard</h2>
          <p className="text-muted-foreground">Real-time system statistics and metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRealTimeActive ? "default" : "secondary"} className="flex items-center space-x-1">
            {isRealTimeActive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isRealTimeActive ? 'Live' : 'Offline'}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={isRealTimeActive ? stopRealTime : startRealTime}
          >
            {isRealTimeActive ? 'Stop Live' : 'Start Live'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Calls */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Calls</p>
                  <p className="text-2xl font-bold">{stats?.activeCalls || 0}</p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>+12% from yesterday</span>
                  </div>
                </div>
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Calls */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Calls</p>
                  <p className="text-2xl font-bold">{stats?.todaysCalls || 0}</p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>+8% from yesterday</span>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Online</p>
                  <p className="text-2xl font-bold">{callCenterStats?.agentsOnline || 0}</p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <span>{callCenterStats?.agentsAvailable || 0} available</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Cost */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">${stats?.monthlyCost || 0}</p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span>-5% from last month</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Center Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Call Center Performance</span>
            </CardTitle>
            <CardDescription>Real-time call center metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Queued Calls</span>
                  <Badge variant={callCenterStats?.queuedCalls === 0 ? "default" : "destructive"}>
                    {callCenterStats?.queuedCalls || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Wait Time</span>
                  <span className="text-sm">{callCenterStats?.averageWaitTime || 0}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Service Level</span>
                  <Badge variant={(callCenterStats?.serviceLevel ?? 0) >= 80 ? "default" : "destructive"}>
                    {callCenterStats?.serviceLevel || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Calls Answered</span>
                  <span className="text-sm">{callCenterStats?.callsAnswered || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Calls Abandoned</span>
                  <span className="text-sm text-red-600">{callCenterStats?.callsAbandoned || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Infrastructure health monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">FreeSWITCH</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus?.freeswitchStatus || 'offline')}
                    <Badge className={getStatusColor(systemStatus?.freeswitchStatus || 'offline')}>
                      {systemStatus?.freeswitchStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemStatus?.databaseStatus || 'offline')}
                    <Badge className={getStatusColor(systemStatus?.databaseStatus || 'offline')}>
                      {systemStatus?.databaseStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <Badge variant={(systemStatus?.cpuUsage ?? 0) > 80 ? "destructive" : "default"}>
                    {systemStatus?.cpuUsage || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <Badge variant={(systemStatus?.memoryUsage ?? 0) > 80 ? "destructive" : "default"}>
                    {systemStatus?.memoryUsage || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm">{Math.floor((systemStatus?.uptime || 0) / 3600)}h</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
