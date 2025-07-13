'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, Mic, Play } from 'lucide-react';
import { cdrService, CdrListParams, CallDetailRecord } from '@/services/cdr.service';
import { AudioPlayerDialog } from '@/components/ui/audio-player-dialog';
import { format } from 'date-fns';

export default function CdrPage() {
  const [filters, setFilters] = useState<CdrListParams>({
    page: 1,
    limit: 20,
  });

  // Audio player state
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallDetailRecord | null>(null);

  const { data: cdrData, isLoading } = useQuery({
    queryKey: ['cdr-list', filters],
    queryFn: () => cdrService.getCdrList(filters),
  });

  const handleFilterChange = (key: keyof CdrListParams, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleExport = async () => {
    try {
      await cdrService.exportCdr(filters, 'csv');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      answered: 'default',
      failed: 'destructive',
      busy: 'secondary',
      no_answer: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  const handlePlayRecording = (call: CallDetailRecord) => {
    if (call.recordingEnabled && call.recordingFilePath) {
      setSelectedCall(call);
      setAudioPlayerOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Detail Records</h1>
          <p className="text-muted-foreground">
            View and analyze call history
          </p>
        </div>
        <Button onClick={handleExport} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Search caller number..."
                value={filters.callerNumber || ''}
                onChange={(e) => handleFilterChange('callerNumber', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Search destination..."
                value={filters.destinationNumber || ''}
                onChange={(e) => handleFilterChange('destinationNumber', e.target.value)}
              />
            </div>
            <div>
              <Select
                value={filters.callStatus || 'all'}
                onValueChange={(value) => handleFilterChange('callStatus', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Call Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.direction || 'all'}
                onValueChange={(value) => handleFilterChange('direction', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CDR Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call Records</CardTitle>
          <CardDescription>
            {cdrData?.pagination?.total || 0} total records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cdrData?.data?.map((call: CallDetailRecord) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      {format(new Date(call.callCreatedAt), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.callerIdNumber}</div>
                        {call.callerIdName && (
                          <div className="text-sm text-muted-foreground">
                            {call.callerIdName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{call.destinationNumber}</div>
                        {call.destinationName && (
                          <div className="text-sm text-muted-foreground">
                            {call.destinationName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {call.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.talkDuration ? `${Math.floor(call.talkDuration / 60)}:${(call.talkDuration % 60).toString().padStart(2, '0')}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(call.callStatus)}>
                        {call.callStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.recordingEnabled && call.recordingFilePath ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayRecording(call)}
                          className="h-8 gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Play
                        </Button>
                      ) : call.recordingEnabled ? (
                        <Badge variant="secondary">
                          <Mic className="mr-1 h-3 w-3" />
                          Processing
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {cdrData?.pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((cdrData.pagination.page - 1) * cdrData.pagination.limit) + 1} to{' '}
                {Math.min(cdrData.pagination.page * cdrData.pagination.limit, cdrData.pagination.total)} of{' '}
                {cdrData.pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cdrData.pagination.page <= 1}
                  onClick={() => handleFilterChange('page', cdrData.pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cdrData.pagination.page >= cdrData.pagination.totalPages}
                  onClick={() => handleFilterChange('page', cdrData.pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Player Dialog */}
      {selectedCall && (
        <AudioPlayerDialog
          isOpen={audioPlayerOpen}
          onClose={() => {
            setAudioPlayerOpen(false);
            setSelectedCall(null);
          }}
          callUuid={selectedCall.callUuid}
          callInfo={{
            caller: selectedCall.callerIdNumber,
            destination: selectedCall.destinationNumber,
            duration: selectedCall.talkDuration
              ? `${Math.floor(selectedCall.talkDuration / 60)}:${(selectedCall.talkDuration % 60).toString().padStart(2, '0')}`
              : '0:00',
            timestamp: format(new Date(selectedCall.callCreatedAt), 'MMM dd, yyyy HH:mm:ss'),
            callUuid: selectedCall.callUuid,
          }}
        />
      )}
    </div>
  );
}
