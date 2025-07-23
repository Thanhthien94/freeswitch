'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { RecentActivity } from '@/services/dashboard.service';
import {
  Phone,
  User,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  RefreshCw,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilter?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  className,
  maxItems = 50,
  showFilter = true
}) => {
  const {
    recentActivity,
    isLoading,
    refreshActivity,
    isRealTimeActive
  } = useDashboard();

  const [filter, setFilter] = React.useState<string>('all');
  const [filteredActivity, setFilteredActivity] = React.useState<RecentActivity[]>([]);

  // Filter activity based on selected filter
  React.useEffect(() => {
    if (!recentActivity) return;

    let filtered = recentActivity;
    
    if (filter !== 'all') {
      filtered = recentActivity.filter(activity => activity.type === filter);
    }

    setFilteredActivity(filtered.slice(0, maxItems));
  }, [recentActivity, filter, maxItems]);

  const getActivityIcon = (type: string, severity: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'registration':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'info':
      default:
        return 'outline';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'call':
        return 'Call';
      case 'registration':
        return 'Registration';
      case 'system':
        return 'System';
      case 'user':
        return 'User';
      case 'error':
        return 'Error';
      default:
        return 'Activity';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'call', label: 'Calls' },
    { value: 'registration', label: 'Registrations' },
    { value: 'system', label: 'System' },
    { value: 'user', label: 'Users' },
    { value: 'error', label: 'Errors' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
              {isRealTimeActive && (
                <Badge variant="default" className="ml-2">
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Latest system events and user activities
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {showFilter && (
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
            )}
            <Button variant="outline" size="sm" onClick={refreshActivity}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity found</p>
              {filter !== 'all' && (
                <Button
                  variant="link"
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  Show all activity
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                      {getActivityIcon(activity.type, activity.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityBadgeVariant(activity.severity)}>
                            {getTypeDisplayName(activity.type)}
                          </Badge>
                          {activity.userName && (
                            <span className="text-sm text-muted-foreground">
                              by {activity.userName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-foreground">
                        {activity.message}
                      </p>
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <details className="cursor-pointer">
                            <summary className="hover:text-foreground">
                              View details
                            </summary>
                            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                              {Object.entries(activity.details).map(([key, value]) => (
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
