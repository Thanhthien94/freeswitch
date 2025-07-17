'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneCall, Mic, Activity, TrendingUp } from 'lucide-react';
import { cdrService, CallDetailRecord } from '@/services/cdr.service';
import { recordingService } from '@/services/recording.service';
import { WebSocketStatus } from '@/components/realtime/WebSocketStatus';

export default function DashboardPage() {
  // Fetch CDR stats
  const { data: cdrStats, isLoading: cdrLoading } = useQuery({
    queryKey: ['cdr-stats'],
    queryFn: () => cdrService.getCdrStats(),
  });

  // Fetch recording stats
  const { data: recordingStats, isLoading: recordingLoading } = useQuery({
    queryKey: ['recording-stats'],
    queryFn: () => recordingService.getRecordingStats(),
  });

  // Fetch recent calls
  const { data: recentCalls, isLoading: callsLoading } = useQuery({
    queryKey: ['recent-calls'],
    queryFn: () => cdrService.getCdrList({ limit: 5 }),
  });

  const stats = [
    {
      title: 'Total Calls',
      value: cdrStats?.totalCalls || 0,
      description: 'All time calls',
      icon: Phone,
      trend: '+12%',
      loading: cdrLoading,
    },
    {
      title: 'Active Calls',
      value: 0, // TODO: Get from real-time API
      description: 'Currently active',
      icon: PhoneCall,
      trend: '0',
      loading: false,
    },
    {
      title: 'Recordings',
      value: recordingStats?.totalRecordings || 0,
      description: 'Total recordings',
      icon: Mic,
      trend: '+5%',
      loading: recordingLoading,
    },
    {
      title: 'Answer Rate',
      value: `${Math.round((cdrStats?.answerSeizureRatio || 0) * 100)}%`,
      description: 'Success rate',
      icon: TrendingUp,
      trend: '+2%',
      loading: cdrLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your PBX system performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              {stat.trend && (
                <Badge variant="secondary" className="mt-1">
                  {stat.trend}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>
              Latest call activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalls?.data?.slice(0, 5).map((call: CallDetailRecord) => (
                  <div key={call.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">
                          {call.callerIdNumber} → {call.destinationNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(call.callCreatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={call.callStatus === 'completed' ? 'default' : 'secondary'}
                    >
                      {call.callStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time WebSocket Status */}
        <div>
          <WebSocketStatus />
        </div>
      </div>
    </div>
  );
}
