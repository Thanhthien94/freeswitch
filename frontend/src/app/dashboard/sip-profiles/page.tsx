'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, Search, Filter, Download, Upload, Settings, Trash2, Edit, 
  Eye, Power, PowerOff, Copy, RefreshCw, FileText, Globe, 
  Network, Server, Activity, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { sipProfileService, SipProfile, SipProfileQueryParams } from '@/services/sip-profile.service';
import { domainService } from '@/services/domain.service';
import { CreateSipProfileDialog } from '@/components/dialogs/CreateSipProfileDialog';

export default function SipProfilesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SipProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Query parameters
  const queryParams: SipProfileQueryParams = {
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
    domainId: selectedDomain === 'all' ? undefined : selectedDomain,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    sortBy: 'name',
    sortOrder: 'ASC',
  };

  // Fetch SIP profiles
  const { data: profilesResponse, isLoading, error } = useQuery({
    queryKey: ['sip-profiles', queryParams],
    queryFn: () => sipProfileService.getSipProfiles(queryParams),
  });

  // Fetch domains for filter
  const { data: domainsResponse } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains(),
  });

  // Fetch SIP profile statistics
  const { data: stats } = useQuery({
    queryKey: ['sip-profile-stats'],
    queryFn: () => sipProfileService.getSipProfileStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: sipProfileService.deleteSipProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['sip-profile-stats'] });
      toast.success('SIP Profile deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete SIP profile');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      sipProfileService.toggleSipProfileStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['sip-profile-stats'] });
      toast.success('SIP Profile status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update SIP profile status');
    },
  });

  // Test profile mutation
  const testProfileMutation = useMutation({
    mutationFn: sipProfileService.testSipProfile,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to test SIP profile');
    },
  });

  // Reload profile mutation
  const reloadProfileMutation = useMutation({
    mutationFn: sipProfileService.reloadSipProfile,
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reload SIP profile');
    },
  });

  const handleDelete = (profile: SipProfile) => {
    if (confirm(`Are you sure you want to delete SIP profile "${profile.name}"?`)) {
      deleteMutation.mutate(profile.id);
    }
  };

  const handleToggleStatus = (profile: SipProfile) => {
    toggleStatusMutation.mutate({
      id: profile.id,
      isActive: !profile.isActive,
    });
  };

  const handleEdit = (profile: SipProfile) => {
    setSelectedProfile(profile);
    setIsEditDialogOpen(true);
  };

  const handleTest = (profile: SipProfile) => {
    testProfileMutation.mutate(profile.id);
  };

  const handleReload = (profile: SipProfile) => {
    reloadProfileMutation.mutate(profile.id);
  };

  const handleExport = async () => {
    try {
      const blob = await sipProfileService.exportSipProfiles(queryParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'sip-profiles.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('SIP profiles exported successfully');
    } catch (error) {
      toast.error('Failed to export SIP profiles');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const profiles = profilesResponse?.data || [];
  const domains = domainsResponse?.data || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading SIP Profiles</h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load SIP profiles'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['sip-profiles'] })}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SIP Profiles</h1>
          <p className="text-muted-foreground">
            Manage SIP profiles and their configurations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add SIP Profile
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProfiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeProfiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gateways</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGateways}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExtensions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SIP profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {Array.isArray(domains) && domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SIP Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            SIP Profiles ({profilesResponse?.total || 0})
          </CardTitle>
          <CardDescription>
            List of all SIP profiles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>SIP Port</TableHead>
                  <TableHead>RTP Range</TableHead>
                  <TableHead>Gateways</TableHead>
                  <TableHead>Extensions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(profiles) && profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.displayName}</div>
                        <div className="text-sm text-muted-foreground">{profile.name}</div>
                        {profile.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {profile.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.domain ? (
                        <div>
                          <div className="font-medium">{profile.domain.displayName}</div>
                          <div className="text-sm text-muted-foreground">{profile.domain.name}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No domain</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Network className="w-4 h-4 mr-1 text-muted-foreground" />
                        {profile.bindPort}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {(profile as any).rtpPortStart && (profile as any).rtpPortEnd
                          ? `${(profile as any).rtpPortStart}-${(profile as any).rtpPortEnd}`
                          : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {profile.gatewayCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {profile.extensionCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(profile.isActive ?? true)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(profile)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(profile)}>
                            {profile.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleTest(profile)}>
                            <Activity className="mr-2 h-4 w-4" />
                            Test
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReload(profile)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reload
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(profile)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No SIP profiles found
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create SIP Profile Dialog */}
      <CreateSipProfileDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['sip-profile-stats'] });
        }}
      />


    </div>
  );
}
