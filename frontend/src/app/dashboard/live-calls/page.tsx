'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  PhoneOff, 
  PhoneForwarded, 
  Pause, 
  Play, 
  Square,
  MoreHorizontal,
  RefreshCw,
  Users,
  Clock,
  TrendingUp,
  Activity,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { liveCallsService, LiveCall, LiveCallsStats } from '@/services/live-calls.service';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function LiveCallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { activeCalls, connectionStatus } = useWebSocket();

  // Fetch active calls
  const { data: liveCallsData, isLoading, error, refetch } = useQuery({
    queryKey: ['live-calls'],
    queryFn: () => liveCallsService.getActiveCalls(),
    refetchInterval: 2000, // Refresh every 2 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['live-calls-stats'],
    queryFn: () => liveCallsService.getStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const calls = liveCallsData?.data || [];
  const stats = liveCallsData?.stats || statsData?.data || getEmptyStats();

  // Filter calls
  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.callerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.calleeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.calleeName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    const matchesDirection = directionFilter === 'all' || call.direction === directionFilter;

    return matchesSearch && matchesStatus && matchesDirection;
  });

  // Handle call control actions
  const handleCallControl = async (callId: string, action: string, destination?: string) => {
    try {
      let result;
      
      switch (action) {
        case 'hangup':
          result = await liveCallsService.hangupCall(callId);
          break;
        case 'hold':
          result = await liveCallsService.holdCall(callId);
          break;
        case 'unhold':
          result = await liveCallsService.unholdCall(callId);
          break;
        case 'park':
          result = await liveCallsService.parkCall(callId);
          break;
        case 'record':
          result = await liveCallsService.startRecording(callId);
          break;
        case 'stop_record':
          result = await liveCallsService.stopRecording(callId);
          break;
        case 'transfer':
          if (!destination) {
            toast({
              title: "Error",
              description: "Destination is required for transfer",
              variant: "destructive",
            });
            return;
          }
          result = await liveCallsService.transferCall(callId, destination);
          break;
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['live-calls'] });
        queryClient.invalidateQueries({ queryKey: ['live-calls-stats'] });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} call`,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    return liveCallsService.formatDuration(seconds);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = liveCallsService.getStatusColor(status);
    return (
      <Badge className={colorClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDirectionBadge = (direction: string) => {
    const colorClass = liveCallsService.getDirectionColor(direction);
    const icon = direction === 'inbound' ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />;
    
    return (
      <Badge className={`${colorClass} flex items-center gap-1`}>
        {icon}
        {direction.charAt(0).toUpperCase() + direction.slice(1)}
      </Badge>
    );
  };

  function getEmptyStats(): LiveCallsStats {
    return {
      totalActiveCalls: 0,
      inboundCalls: 0,
      outboundCalls: 0,
      answeredCalls: 0,
      ringingCalls: 0,
      bridgedCalls: 0,
      holdCalls: 0,
      averageDuration: 0,
      longestCall: 0,
      shortestCall: 0,
      callsPerMinute: 0,
      answerRate: 0,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Calls</h1>
          <p className="text-muted-foreground">
            Monitor and manage active calls in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connectionStatus.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveCalls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inboundCalls} inbound, {stats.outboundCalls} outbound
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Call Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.answeredCalls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ringingCalls} ringing, {stats.holdCalls} on hold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Longest: {formatDuration(stats.longestCall)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.answerRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.callsPerMinute} calls/min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Active Calls</CardTitle>
          <CardDescription>
            {filteredCalls.length} of {calls.length} calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by caller, callee, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ringing">Ringing</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="bridged">Bridged</SelectItem>
                <SelectItem value="hold">On Hold</SelectItem>
                <SelectItem value="transferring">Transferring</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calls Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call Info</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Loading active calls...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Phone className="w-8 h-8 mb-2" />
                        <p>No active calls found</p>
                        {calls.length > 0 && filteredCalls.length === 0 && (
                          <p className="text-sm">Try adjusting your filters</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(filteredCalls) && filteredCalls.map((call: LiveCall) => (
                    <TableRow key={call.uuid}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {call.callerNumber} → {call.calleeNumber}
                          </div>
                          {(call.callerName || call.calleeName) && (
                            <div className="text-sm text-muted-foreground">
                              {call.callerName} → {call.calleeName}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {call.uuid.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getDirectionBadge(call.direction)}</TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatDuration(call.duration)}</div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(call.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {call.recording ? (
                          <Badge className="bg-red-100 text-red-800">
                            <Square className="w-3 h-3 mr-1" />
                            Recording
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Recording</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCallControl(call.uuid, 'hangup')}
                              className="text-red-600"
                            >
                              <PhoneOff className="w-4 h-4 mr-2" />
                              Hangup
                            </DropdownMenuItem>
                            {call.status === 'hold' ? (
                              <DropdownMenuItem
                                onClick={() => handleCallControl(call.uuid, 'unhold')}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Unhold
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleCallControl(call.uuid, 'hold')}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Hold
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleCallControl(call.uuid, 'park')}
                            >
                              <PhoneForwarded className="w-4 h-4 mr-2" />
                              Park
                            </DropdownMenuItem>
                            {call.recording ? (
                              <DropdownMenuItem
                                onClick={() => handleCallControl(call.uuid, 'stop_record')}
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Stop Recording
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleCallControl(call.uuid, 'record')}
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Start Recording
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
