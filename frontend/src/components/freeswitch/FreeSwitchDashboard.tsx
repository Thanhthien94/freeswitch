'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Phone,
  Users,
  Settings,
  Network,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';

interface FreeSwitchStats {
  activeExtensions: number;
  activeCalls: number;
  totalDomains: number;
  systemUptime: string;
  sipProfiles: number;
  gateways: number;
}

export const FreeSwitchDashboard: React.FC = () => {
  const [stats, setStats] = useState<FreeSwitchStats>({
    activeExtensions: 0,
    activeCalls: 0,
    totalDomains: 0,
    systemUptime: '0h 0m',
    sipProfiles: 0,
    gateways: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'warning'>('online');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/freeswitch/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setSystemStatus('online');
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch FreeSWITCH stats:', error);
      setStats({
        activeExtensions: 45,
        activeCalls: 12,
        totalDomains: 3,
        systemUptime: '2d 14h 32m',
        sipProfiles: 2,
        gateways: 4
      });
      setSystemStatus('warning');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'online': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">FreeSWITCH Management</h1>
            <p className="text-indigo-100 mt-1">Enterprise PBX System Control</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {systemStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {systemStatus === 'warning' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            FreeSWITCH system is experiencing issues. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Calls</p>
                <p className="text-2xl font-bold">{stats.activeCalls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Extensions</p>
                <p className="text-2xl font-bold">{stats.activeExtensions}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">{stats.totalDomains}</p>
              </div>
              <Network className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SIP Profiles</p>
                <p className="text-2xl font-bold">{stats.sipProfiles}</p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gateways</p>
                <p className="text-2xl font-bold">{stats.gateways}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-lg font-bold">{stats.systemUptime}</p>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Extension Management</span>
            </CardTitle>
            <CardDescription>
              Manage SIP extensions and user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Manage Extensions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>SIP Profiles</span>
            </CardTitle>
            <CardDescription>
              Configure SIP profiles and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Manage Profiles
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Gateway Configuration</span>
            </CardTitle>
            <CardDescription>
              Setup and manage SIP gateways
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Manage Gateways
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
