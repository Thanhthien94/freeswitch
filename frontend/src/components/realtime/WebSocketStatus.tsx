'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react';

export const WebSocketStatus = () => {
  const {
    connectionStatus,
    activeCalls,
    systemStatus,
    refreshActiveCalls,
    refreshSystemStatus,
  } = useWebSocket();

  const getConnectionBadge = () => {
    if (connectionStatus.connected) {
      return (
        <Badge variant="default" className="bg-green-500">
          <Wifi className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const getSystemStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case 'offline':
      case 'disconnected':
        return <Badge variant="destructive">{status}</Badge>;
      case 'error':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            WebSocket Connection
            {getConnectionBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span>{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reconnect Attempts:</span>
              <span>{connectionStatus.reconnectAttempts}/{connectionStatus.maxReconnectAttempts}</span>
            </div>
            {connectionStatus.error && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error:</span>
                <span className="text-red-500 text-xs">{connectionStatus.error}</span>
              </div>
            )}
            {connectionStatus.reason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason:</span>
                <span className="text-xs">{connectionStatus.reason}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            System Status
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSystemStatus}
              disabled={!connectionStatus.connected}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {systemStatus ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">FreeSWITCH:</span>
                {getSystemStatusBadge(systemStatus.freeswitchStatus)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Database:</span>
                {getSystemStatusBadge(systemStatus.databaseStatus)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Calls:</span>
                <span className="font-medium">{systemStatus.totalActiveCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="text-xs">
                  {new Date(systemStatus.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No system status data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Calls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Active Calls ({activeCalls.length})
            <Button
              variant="outline"
              size="sm"
              onClick={refreshActiveCalls}
              disabled={!connectionStatus.connected}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeCalls.length > 0 ? (
            <div className="space-y-3">
              {activeCalls.map((call) => (
                <div
                  key={call.callId}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-medium text-sm">
                        {call.callerNumber} → {call.calleeNumber}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {call.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Direction: {call.direction}</div>
                    <div>Duration: {call.duration}s</div>
                    <div>Started: {new Date(call.startTime).toLocaleTimeString()}</div>
                    {call.answerTime && (
                      <div>Answered: {new Date(call.answerTime).toLocaleTimeString()}</div>
                    )}
                  </div>
                  {call.recording && (
                    <Badge variant="secondary" className="text-xs">
                      Recording
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active calls
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
