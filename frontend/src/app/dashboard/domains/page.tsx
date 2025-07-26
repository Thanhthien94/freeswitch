'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, MoreHorizontal, Building2, Users, Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { domainService, Domain } from '@/services/domain.service';
import { DomainDialog } from '@/components/freeswitch/DomainDialog';
import { DomainCard } from '@/components/freeswitch/DomainCard';
import { DomainHierarchy } from '@/components/freeswitch/DomainHierarchy';

export default function DomainsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');

  // Fetch domains
  const { data: domainsData, isLoading, refetch } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains({ limit: 100 }),
  });

  // Fetch domain statistics
  const { data: statsData } = useQuery({
    queryKey: ['domain-stats'],
    queryFn: () => domainService.getAllDomainStats(),
  });

  const domains = Array.isArray(domainsData?.data) ? domainsData.data : [];

  // Filter domains based on criteria
  const filteredDomains = domains.filter(domain => {
    const matchesSearch =
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === '__all__' ||
      (statusFilter === 'active' && domain.isActive) ||
      (statusFilter === 'inactive' && !domain.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const getStatistics = () => {
    const totalDomains = domains.length;
    const activeDomains = domains.filter(domain => domain.isActive).length;
    const inactiveDomains = totalDomains - activeDomains;
    const totalUsers = domains.reduce((sum, domain) => sum + (domain.users?.length || 0), 0);
    const totalExtensions = domains.reduce((sum, domain) => sum + (domain.maxExtensions || 0), 0);

    return {
      totalDomains,
      activeDomains,
      inactiveDomains,
      totalUsers,
      totalExtensions,
      utilizationRate: totalDomains > 0 ? (activeDomains / totalDomains) * 100 : 0,
    };
  };

  const statistics = getStatistics();

  const handleCreateDomain = () => {
    setSelectedDomain(null);
    setIsDialogOpen(true);
  };

  const handleEditDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDomain(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
          <p className="text-muted-foreground">
            Manage multi-tenant domains with hierarchical structure and enterprise features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <Settings className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateDomain}>
            <Plus className="w-4 h-4 mr-2" />
            Create Domain
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalDomains}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.utilizationRate.toFixed(1)}% utilization rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeDomains}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.inactiveDomains} inactive domains
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalExtensions}</div>
            <p className="text-xs text-muted-foreground">Maximum capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Domains</CardTitle>
              <CardDescription>Search and filter domains by various criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Domains</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Domains Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredDomains.length > 0 ? (
              filteredDomains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  onEdit={handleEditDomain}
                  onRefresh={refetch}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No domains found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchTerm || statusFilter !== '__all__'
                        ? 'No domains match your current filters.'
                        : 'Create your first domain to get started.'}
                    </p>
                    {!searchTerm && statusFilter === '__all__' && (
                      <Button onClick={handleCreateDomain}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Domain
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hierarchy">
          <DomainHierarchy domains={filteredDomains} onEditDomain={handleEditDomain} />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Domain Distribution</CardTitle>
                <CardDescription>Status breakdown of all domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">{statistics.activeDomains} domains</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm">Inactive</span>
                    </div>
                    <span className="text-sm font-medium">{statistics.inactiveDomains} domains</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Summary</CardTitle>
                <CardDescription>Overall resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Users</span>
                    <span className="text-sm font-medium">{statistics.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Extensions</span>
                    <span className="text-sm font-medium">{statistics.totalExtensions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilization Rate</span>
                    <span className="text-sm font-medium">{statistics.utilizationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Domain Dialog */}
      <DomainDialog
        domain={selectedDomain}
        open={isDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}
