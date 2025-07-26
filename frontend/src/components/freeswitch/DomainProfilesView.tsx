'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Settings, 
  Link, 
  Unlink, 
  Search, 
  Filter,
  Plus,
  Edit,
  MoreHorizontal,
  Network,
  Shield,
  Globe,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Domain } from '@/services/domain.service';
import { sipProfileService, SipProfile } from '@/services/sip-profile.service';

interface DomainProfilesViewProps {
  domains: Domain[];
  onRefresh: () => void;
}

export function DomainProfilesView({ domains, onRefresh }: DomainProfilesViewProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch SIP profiles
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ['sip-profiles'],
    queryFn: () => sipProfileService.getSipProfiles({ limit: 100 }),
  });

  const profiles = Array.isArray(profilesData?.data) ? profilesData.data : [];

  // Associate profiles with domain mutation
  const associateMutation = useMutation({
    mutationFn: async ({ domainId, profileIds }: { domainId: string; profileIds: string[] }) => {
      const promises = profileIds.map(profileId =>
        sipProfileService.updateSipProfile(profileId, { domainId })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Profiles associated with domain successfully');
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSelectedProfiles([]);
      onRefresh();
    },
    onError: (error: any) => {
      console.error('Error associating profiles:', error);
      toast.error(error.message || 'Failed to associate profiles');
    },
  });

  // Disassociate profiles mutation
  const disassociateMutation = useMutation({
    mutationFn: async (profileIds: string[]) => {
      const promises = profileIds.map(profileId =>
        sipProfileService.updateSipProfile(profileId, { domainId: undefined })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Profiles disassociated successfully');
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSelectedProfiles([]);
      onRefresh();
    },
    onError: (error: any) => {
      console.error('Error disassociating profiles:', error);
      toast.error(error.message || 'Failed to disassociate profiles');
    },
  });

  // Filter profiles based on search, domain, and type
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomain = 
      selectedDomain === 'all' ||
      (selectedDomain === 'unassigned' && !profile.domainId) ||
      profile.domainId === selectedDomain;

    const matchesType = 
      filterType === 'all' ||
      filterType === profile.type;

    return matchesSearch && matchesDomain && matchesType;
  });

  // Get domain name by ID
  const getDomainName = (domainId: string | null) => {
    if (!domainId) return 'Unassigned';
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.displayName : 'Unknown Domain';
  };

  // Handle profile selection
  const handleProfileSelect = (profileId: string, checked: boolean) => {
    if (checked) {
      setSelectedProfiles(prev => [...prev, profileId]);
    } else {
      setSelectedProfiles(prev => prev.filter(id => id !== profileId));
    }
  };

  // Handle select all profiles
  const handleSelectAllProfiles = (checked: boolean) => {
    if (checked) {
      setSelectedProfiles(filteredProfiles.map(p => p.id));
    } else {
      setSelectedProfiles([]);
    }
  };

  // Handle associate action
  const handleAssociate = (domainId: string) => {
    if (selectedProfiles.length === 0) {
      toast.error('Please select at least one profile');
      return;
    }

    associateMutation.mutate({ domainId, profileIds: selectedProfiles });
  };

  // Handle disassociate action
  const handleDisassociate = () => {
    if (selectedProfiles.length === 0) {
      toast.error('Please select at least one profile to disassociate');
      return;
    }

    disassociateMutation.mutate(selectedProfiles);
  };

  // Calculate statistics
  const getStatistics = () => {
    const totalProfiles = profiles.length;
    const assignedProfiles = profiles.filter(p => p.domainId).length;
    const unassignedProfiles = totalProfiles - assignedProfiles;
    
    // Group by domain
    const profilesByDomain = domains.map(domain => ({
      domain,
      count: profiles.filter(p => p.domainId === domain.id).length,
    }));

    return {
      totalProfiles,
      assignedProfiles,
      unassignedProfiles,
      profilesByDomain,
    };
  };

  const statistics = getStatistics();
  const isMutating = associateMutation.isPending || disassociateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalProfiles}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.assignedProfiles} assigned, {statistics.unassignedProfiles} unassigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Profiles</CardTitle>
            <Link className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.assignedProfiles}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalProfiles > 0 ? ((statistics.assignedProfiles / statistics.totalProfiles) * 100).toFixed(1) : 0}% assignment rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Profiles</CardTitle>
            <Unlink className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.unassignedProfiles}</div>
            <p className="text-xs text-muted-foreground">
              Need domain assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains.filter(d => d.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="w-5 h-5" />
            Domain-Profile Associations
            {selectedProfiles.length > 0 && (
              <Badge variant="secondary">
                {selectedProfiles.length} selected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage SIP profile assignments to domains for organized FreeSWITCH configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <Separator />
                {domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedProfiles.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedProfiles.length} profile(s) selected:
              </span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isMutating}>
                      <Link className="w-4 h-4 mr-2" />
                      Assign to Domain
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {domains.filter(d => d.isActive).map((domain) => (
                      <DropdownMenuItem 
                        key={domain.id}
                        onClick={() => handleAssociate(domain.id)}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        {domain.displayName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisassociate}
                  disabled={isMutating}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unassign
                </Button>
              </div>
            </div>
          )}

          {/* Profiles Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0}
                      onCheckedChange={handleSelectAllProfiles}
                    />
                  </TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Extensions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProfiles.includes(profile.id)}
                          onCheckedChange={(checked) => handleProfileSelect(profile.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{profile.displayName || profile.name}</div>
                          <div className="text-sm text-muted-foreground">{profile.name}</div>
                          {profile.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {profile.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {profile.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {profile.domainId ? (
                            <>
                              <Building2 className="w-4 h-4 text-green-600" />
                              <span>{getDomainName(profile.domainId)}</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Unassigned</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.isActive ? "default" : "secondary"}>
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{profile.bindPort}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{profile.extensionCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {profile.domainId ? (
                              <DropdownMenuItem 
                                onClick={() => disassociateMutation.mutate([profile.id])}
                              >
                                <Unlink className="w-4 h-4 mr-2" />
                                Unassign Domain
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <DropdownMenuItem>
                                    <Link className="w-4 h-4 mr-2" />
                                    Assign to Domain
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="left">
                                  {domains.filter(d => d.isActive).map((domain) => (
                                    <DropdownMenuItem 
                                      key={domain.id}
                                      onClick={() => associateMutation.mutate({ 
                                        domainId: domain.id, 
                                        profileIds: [profile.id] 
                                      })}
                                    >
                                      <Building2 className="w-4 h-4 mr-2" />
                                      {domain.displayName}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Settings className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {searchTerm || selectedDomain !== 'all' || filterType !== 'all'
                            ? 'No profiles match your current filters.'
                            : 'No SIP profiles found.'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
