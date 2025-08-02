'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AdminGate,
  ManagerGate,
  HighSecurityGate,

  CDRGate,
  RecordingGate,
  BillingGate,
  SystemGate
} from '@/components/auth/PermissionGate';
import { FreeSwitchDashboard } from '@/components/freeswitch/FreeSwitchDashboard';
import { LiveStatsCard } from '@/components/dashboard/LiveStatsCard';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import {
  Shield,
  Users,
  Phone,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Monitor,
  FileText,
  Headphones,
  Activity
} from 'lucide-react';

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions();

  if (!user) {
    return null;
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    if (hour >= 18) greeting = 'Good evening';

    return `${greeting}, ${user.displayName}!`;
  };

  const getSecurityStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isBusinessHours = day >= 1 && day <= 5 && hour >= 9 && hour < 18;
    const riskScore = 20; // This would come from actual risk calculation
    
    return {
      isBusinessHours,
      riskScore,
      clearance: permissions.securityClearance,
    };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold">{getWelcomeMessage()}</h1>
        <p className="text-blue-100 mt-1">
          Welcome to your {user.primaryRole} dashboard
        </p>
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {user.domain?.displayName}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white">
            <Shield className="w-3 h-3 mr-1" />
            {permissions.securityClearance} Clearance
          </Badge>
          <Badge 
            variant="secondary" 
            className={`${securityStatus.isBusinessHours ? 'bg-green-500/20' : 'bg-orange-500/20'} text-white`}
          >
            <Clock className="w-3 h-3 mr-1" />
            {securityStatus.isBusinessHours ? 'Business Hours' : 'After Hours'}
          </Badge>
        </div>
      </div>

      {/* Security Alerts */}
      {!securityStatus.isBusinessHours && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You are accessing the system outside business hours. Some features may be restricted.
          </AlertDescription>
        </Alert>
      )}

      {securityStatus.riskScore > 50 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High risk session detected (Risk Score: {securityStatus.riskScore}). 
            Enhanced security measures are in effect.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Dashboard Stats */}
      <LiveStatsCard />

      {/* Role-Specific Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Section */}
        <AdminGate>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>System Administration</span>
              </CardTitle>
              <CardDescription>
                Administrative tools and system management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SystemGate action="read">
                <Button variant="outline" className="w-full justify-start">
                  <Monitor className="mr-2 h-4 w-4" />
                  System Status
                </Button>
              </SystemGate>
              
              <SystemGate action="manage">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  System Configuration
                </Button>
              </SystemGate>

              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Button>
            </CardContent>
          </Card>
        </AdminGate>

        {/* Manager Section */}
        <ManagerGate>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Management</span>
              </CardTitle>
              <CardDescription>
                Manage your team and department operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Team Overview
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Performance Reports
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </ManagerGate>

        {/* Call Center Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Call Center</span>
            </CardTitle>
            <CardDescription>
              Call handling and customer service tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Phone className="mr-2 h-4 w-4" />
              Active Calls
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Headphones className="mr-2 h-4 w-4" />
              Queue Status
            </Button>

            <CDRGate>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Call History
              </Button>
            </CDRGate>
          </CardContent>
        </Card>

        {/* High Security Section */}
        <HighSecurityGate>
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <span>High Security Access</span>
              </CardTitle>
              <CardDescription>
                Restricted access features requiring high clearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <RecordingGate>
                <Button variant="outline" className="w-full justify-start">
                  <Headphones className="mr-2 h-4 w-4" />
                  Call Recordings
                </Button>
              </RecordingGate>

              <BillingGate>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Financial Data
                </Button>
              </BillingGate>

              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Security Logs
              </Button>
            </CardContent>
          </Card>
        </HighSecurityGate>
      </div>

      {/* Activity and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed />
        <AlertsPanel />
      </div>

      {/* FreeSWITCH Management Section */}
      <SystemGate action="read">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-indigo-600" />
              <span>FreeSWITCH Management</span>
            </CardTitle>
            <CardDescription>
              Enterprise PBX system management and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FreeSwitchDashboard />
          </CardContent>
        </Card>
      </SystemGate>

      {/* Current Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Access Summary</CardTitle>
          <CardDescription>
            Current permissions and access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Roles</h4>
              <div className="space-y-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Access Level</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Security Clearance: {permissions.securityClearance}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Domain: {user.domain?.displayName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {securityStatus.isBusinessHours ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">
                    {securityStatus.isBusinessHours ? 'Business Hours Access' : 'After Hours Access'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Key Capabilities</h4>
              <div className="space-y-1 text-sm">
                {permissions.canReadUsers && <div className="text-green-600">✓ User Management</div>}
                {permissions.canReadCDR && <div className="text-green-600">✓ Call Data Access</div>}
                {permissions.canReadRecordings && <div className="text-green-600">✓ Recording Access</div>}
                {permissions.canReadBilling && <div className="text-green-600">✓ Billing Access</div>}
                {permissions.canReadSystem && <div className="text-green-600">✓ System Access</div>}
                {permissions.canManageSubordinates && <div className="text-green-600">✓ Team Management</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
