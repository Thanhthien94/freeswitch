'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDashboard } from '@/hooks/useDashboard';
import { Alert as AlertType } from '@/services/dashboard.service';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Activity,
  DollarSign,
  Settings,
  Clock,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertsPanelProps {
  className?: string;
  maxItems?: number;
  showResolved?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  className,
  maxItems = 20,
  showResolved = false
}) => {
  const {
    alerts,
    isLoading,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,
    isRealTimeActive
  } = useDashboard();

  const [filter, setFilter] = React.useState<string>('active');
  const [filteredAlerts, setFilteredAlerts] = React.useState<AlertType[]>([]);

  // Filter alerts based on selected filter
  React.useEffect(() => {
    if (!alerts) return;

    let filtered = alerts;
    
    switch (filter) {
      case 'active':
        filtered = alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt);
        break;
      case 'acknowledged':
        filtered = alerts.filter(alert => alert.acknowledged && !alert.resolvedAt);
        break;
      case 'resolved':
        filtered = alerts.filter(alert => alert.resolvedAt);
        break;
      case 'critical':
        filtered = alerts.filter(alert => alert.severity === 'critical');
        break;
      case 'high':
        filtered = alerts.filter(alert => alert.severity === 'high');
        break;
      default:
        break;
    }

    setFilteredAlerts(filtered.slice(0, maxItems));
  }, [alerts, filter, maxItems]);

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'performance':
        return <Activity className="h-4 w-4" />;
      case 'business':
        return <DollarSign className="h-4 w-4" />;
      default:
        return severity === 'critical' || severity === 'high' 
          ? <AlertTriangle className="h-4 w-4" />
          : <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'system':
        return 'System';
      case 'security':
        return 'Security';
      case 'performance':
        return 'Performance';
      case 'business':
        return 'Business';
      default:
        return 'Alert';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const filterOptions = [
    { value: 'active', label: 'Active' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High Priority' },
    { value: 'all', label: 'All Alerts' }
  ];

  const activeAlertsCount = alerts?.filter(alert => !alert.acknowledged && !alert.resolvedAt).length || 0;
  const criticalAlertsCount = alerts?.filter(alert => alert.severity === 'critical' && !alert.resolvedAt).length || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>System Alerts</span>
              {isRealTimeActive && (
                <Badge variant="default" className="ml-2">
                  Live
                </Badge>
              )}
              {activeAlertsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeAlertsCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              System notifications and alerts requiring attention
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={refreshAlerts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {criticalAlertsCount > 0 && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {criticalAlertsCount} critical alert{criticalAlertsCount > 1 ? 's' : ''} requiring immediate attention.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No alerts found</p>
              <p className="text-sm mt-1">
                {filter === 'active' ? 'All systems are operating normally' : `No ${filter} alerts`}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)} ${
                    alert.resolvedAt ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getAlertIcon(alert.type, alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeDisplayName(alert.type)}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="secondary">
                              Acknowledged
                            </Badge>
                          )}
                          {alert.resolvedAt && (
                            <Badge variant="default">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-foreground mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </span>
                          {alert.resolvedAt && (
                            <span>
                              Resolved {formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {alert.details && Object.keys(alert.details).length > 0 && (
                          <div className="mt-2">
                            <details className="cursor-pointer">
                              <summary className="text-xs hover:text-foreground">
                                View details
                              </summary>
                              <div className="mt-1 p-2 bg-background/50 rounded text-xs font-mono">
                                {Object.entries(alert.details).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    {!alert.resolvedAt && (
                      <div className="flex flex-col space-y-2 ml-4">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
