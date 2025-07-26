'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Link,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Plus,
} from 'lucide-react';
import { extensionService } from '@/services/extension.service';
import { sipProfileService } from '@/services/sip-profile.service';
import { ExtensionProfileCard } from '@/components/freeswitch/ExtensionProfileCard';
import { ProfileExtensionsView } from '@/components/freeswitch/ProfileExtensionsView';
import { ExtensionProfileAssociation } from '@/components/freeswitch/ExtensionProfileAssociation';

export default function ExtensionProfilesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('extensions');

  // Fetch extensions
  const { data: extensionsData, isLoading: extensionsLoading, refetch: refetchExtensions } = useQuery({
    queryKey: ['extensions', { search: searchTerm }],
    queryFn: () => extensionService.getExtensions({ 
      search: searchTerm,
      limit: 100 
    }),
  });

  // Fetch SIP profiles
  const { data: profilesData, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ['sip-profiles'],
    queryFn: () => sipProfileService.getSipProfiles({ limit: 100 }),
  });

  const extensions = Array.isArray(extensionsData?.data) ? extensionsData.data : [];
  const profiles = Array.isArray(profilesData?.data) ? profilesData.data : [];

  // Filter extensions based on criteria
  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = 
      ext.extensionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'assigned' && ext.profileId) ||
      (filterStatus === 'unassigned' && !ext.profileId);
    
    const matchesProfile =
      !selectedProfileId || selectedProfileId === '__all__' || ext.profileId === selectedProfileId;
    
    return matchesSearch && matchesStatus && matchesProfile;
  });

  // Calculate statistics
  const getStatistics = () => {
    const totalExtensions = extensions.length;
    const assignedExtensions = extensions.filter(ext => ext.profileId).length;
    const unassignedExtensions = totalExtensions - assignedExtensions;
    const activeProfiles = profiles.filter(profile => profile.isActive).length;
    
    const profileStats = profiles.map(profile => {
      const profileExtensions = extensions.filter(ext => ext.profileId === profile.id);
      return {
        profile,
        extensionCount: profileExtensions.length,
        activeExtensions: profileExtensions.filter(ext => ext.isActive).length,
      };
    });

    return {
      totalExtensions,
      assignedExtensions,
      unassignedExtensions,
      totalProfiles: profiles.length,
      activeProfiles,
      profileStats,
      assignmentRate: totalExtensions > 0 ? (assignedExtensions / totalExtensions) * 100 : 0,
    };
  };

  const stats = getStatistics();

  const handleRefresh = () => {
    refetchExtensions();
    refetchProfiles();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Extension-Profile Management</h1>
          <p className="text-muted-foreground">
            Manage associations between extensions and SIP profiles
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAssociationDialog(true)}>
            <Link className="w-4 h-4 mr-2" />
            Manage Associations
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExtensions}</div>
            <p className="text-xs text-muted-foreground">
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Extensions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.assignedExtensions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.assignmentRate.toFixed(1)}% assignment rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Extensions</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unassignedExtensions}</div>
            <p className="text-xs text-muted-foreground">
              Need profile assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProfiles}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalProfiles} total profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="extensions">Extensions View</TabsTrigger>
          <TabsTrigger value="profiles">Profiles View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Extensions</CardTitle>
              <CardDescription>
                Filter and search extensions by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search extensions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Extensions</SelectItem>
                    <SelectItem value="assigned">Assigned Only</SelectItem>
                    <SelectItem value="unassigned">Unassigned Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Profiles</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Extensions List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {extensionsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading extensions...</span>
              </div>
            ) : filteredExtensions.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Extensions Found</h3>
                <p className="text-muted-foreground">
                  No extensions match your current filter criteria.
                </p>
              </div>
            ) : (
              filteredExtensions.map((extension) => (
                <ExtensionProfileCard
                  key={extension.id}
                  extension={extension}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          {profilesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading profiles...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SIP Profiles Found</h3>
              <p className="text-muted-foreground">
                Create SIP profiles to assign extensions to them.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {profiles.map((profile) => (
                <ProfileExtensionsView
                  key={profile.id}
                  profile={profile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Profile Distribution</span>
                </CardTitle>
                <CardDescription>
                  Extension distribution across SIP profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.profileStats.map(({ profile, extensionCount, activeExtensions }) => (
                    <div key={profile.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.displayName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{extensionCount} extensions</div>
                        <div className="text-sm text-muted-foreground">
                          {activeExtensions} active
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {stats.unassignedExtensions > 0 && (
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <div className="font-medium text-orange-600">Unassigned</div>
                        <div className="text-sm text-muted-foreground">
                          No profile assigned
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-orange-600">
                          {stats.unassignedExtensions} extensions
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Assignment Summary</span>
                </CardTitle>
                <CardDescription>
                  Overall assignment statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Assignment Rate</span>
                    <span className="font-medium">{stats.assignmentRate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.assignmentRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Assigned</div>
                      <div className="font-medium text-green-600">
                        {stats.assignedExtensions}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Unassigned</div>
                      <div className="font-medium text-orange-600">
                        {stats.unassignedExtensions}
                      </div>
                    </div>
                  </div>
                  
                  {stats.unassignedExtensions > 0 && (
                    <Button 
                      className="w-full mt-4"
                      onClick={() => setShowAssociationDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Unassigned Extensions
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Association Dialog */}
      <ExtensionProfileAssociation
        open={showAssociationDialog}
        onOpenChange={setShowAssociationDialog}
      />
    </div>
  );
}
