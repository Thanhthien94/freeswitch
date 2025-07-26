'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Link,
  Unlink,
  Search,
  Filter,
  RefreshCw,
  Users,
  Settings,
  Phone,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { extensionService, Extension } from '@/services/extension.service';
import { sipProfileService, SipProfile } from '@/services/sip-profile.service';

interface ExtensionProfileAssociationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialExtensionId?: string;
  initialProfileId?: string;
}

interface AssociationData {
  extensionId: string;
  profileId: string | null;
}

export const ExtensionProfileAssociation: React.FC<ExtensionProfileAssociationProps> = ({
  open,
  onOpenChange,
  initialExtensionId,
  initialProfileId,
}) => {
  const [searchExtensions, setSearchExtensions] = useState('');
  const [searchProfiles, setSearchProfiles] = useState('');
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(initialProfileId || null);
  const [mode, setMode] = useState<'assign' | 'unassign' | 'bulk'>('assign');

  const queryClient = useQueryClient();

  // Fetch extensions
  const { data: extensionsData, isLoading: extensionsLoading } = useQuery({
    queryKey: ['extensions', { search: searchExtensions }],
    queryFn: () => extensionService.getExtensions({ 
      search: searchExtensions,
      limit: 100 
    }),
    enabled: open,
  });

  // Fetch SIP profiles
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['sip-profiles', { search: searchProfiles }],
    queryFn: () => sipProfileService.getSipProfiles({ 
      search: searchProfiles,
      limit: 100 
    }),
    enabled: open,
  });

  // Update extension profile association
  const updateAssociationMutation = useMutation({
    mutationFn: async (data: AssociationData) => {
      return extensionService.updateExtension(data.extensionId, {
        profileId: data.profileId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      toast.success('Extension-Profile association updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update association');
    },
  });

  // Bulk update associations
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: AssociationData[]) => {
      const promises = updates.map(update =>
        extensionService.updateExtension(update.extensionId, {
          profileId: update.profileId || undefined,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      toast.success(`${selectedExtensions.length} extensions updated successfully`);
      setSelectedExtensions([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update associations');
    },
  });

  useEffect(() => {
    if (initialExtensionId) {
      setSelectedExtensions([initialExtensionId]);
    }
  }, [initialExtensionId]);

  const extensions = Array.isArray(extensionsData?.data) ? extensionsData.data : [];
  const profiles = Array.isArray(profilesData?.data) ? profilesData.data : [];

  const filteredExtensions = extensions.filter(ext =>
    ext.extensionNumber.toLowerCase().includes(searchExtensions.toLowerCase()) ||
    ext.displayName?.toLowerCase().includes(searchExtensions.toLowerCase())
  );

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchProfiles.toLowerCase()) ||
    profile.displayName?.toLowerCase().includes(searchProfiles.toLowerCase())
  );

  const handleAssignProfile = () => {
    if (selectedExtensions.length === 0) {
      toast.error('Please select at least one extension');
      return;
    }

    const profileIdToAssign = selectedProfile === '__unassign__' ? null : selectedProfile;

    if (selectedExtensions.length === 1) {
      updateAssociationMutation.mutate({
        extensionId: selectedExtensions[0],
        profileId: profileIdToAssign,
      });
    } else {
      const updates = selectedExtensions.map(extensionId => ({
        extensionId,
        profileId: profileIdToAssign,
      }));
      bulkUpdateMutation.mutate(updates);
    }
  };

  const handleUnassignProfile = () => {
    if (selectedExtensions.length === 0) {
      toast.error('Please select at least one extension');
      return;
    }

    if (selectedExtensions.length === 1) {
      updateAssociationMutation.mutate({
        extensionId: selectedExtensions[0],
        profileId: null,
      });
    } else {
      const updates = selectedExtensions.map(extensionId => ({
        extensionId,
        profileId: null,
      }));
      bulkUpdateMutation.mutate(updates);
    }
  };

  const toggleExtensionSelection = (extensionId: string) => {
    setSelectedExtensions(prev =>
      prev.includes(extensionId)
        ? prev.filter(id => id !== extensionId)
        : [...prev, extensionId]
    );
  };

  const getExtensionProfileInfo = (extension: Extension) => {
    if (!extension.profileId) {
      return { profile: null, status: 'unassigned' };
    }
    
    const profile = profiles.find(p => p.id === extension.profileId);
    return { 
      profile, 
      status: profile ? 'assigned' : 'invalid' 
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Extension-Profile Association</span>
          </DialogTitle>
          <DialogDescription>
            Manage the association between extensions and SIP profiles. 
            Extensions must be assigned to a profile to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Extensions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Extensions</span>
                <Badge variant="secondary">{selectedExtensions.length} selected</Badge>
              </CardTitle>
              <CardDescription>
                Select extensions to assign or unassign profiles
              </CardDescription>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search extensions..."
                    value={searchExtensions}
                    onChange={(e) => setSearchExtensions(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExtensions([])}
                  disabled={selectedExtensions.length === 0}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Extension</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExtensions.map((extension) => {
                      const { profile, status } = getExtensionProfileInfo(extension);
                      const isSelected = selectedExtensions.includes(extension.id);
                      
                      return (
                        <TableRow 
                          key={extension.id}
                          className={isSelected ? 'bg-muted/50' : ''}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleExtensionSelection(extension.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{extension.extensionNumber}</div>
                              {extension.displayName && (
                                <div className="text-sm text-muted-foreground">
                                  {extension.displayName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile ? (
                              <div>
                                <div className="font-medium">{profile.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {profile.displayName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {status === 'assigned' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                            {status === 'unassigned' && (
                              <Badge variant="secondary">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Unassigned
                              </Badge>
                            )}
                            {status === 'invalid' && (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* SIP Profiles Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>SIP Profiles</span>
              </CardTitle>
              <CardDescription>
                Select a profile to assign to the selected extensions
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search profiles..."
                  value={searchProfiles}
                  onChange={(e) => setSearchProfiles(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Selected Profile</Label>
                <Select value={selectedProfile || ''} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a SIP profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassign__">No Profile (Unassign)</SelectItem>
                    {filteredProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center space-x-2">
                          <span>{profile.name}</span>
                          {profile.displayName && (
                            <span className="text-muted-foreground">
                              ({profile.displayName})
                            </span>
                          )}
                          <Badge variant="outline" className="ml-auto">
                            {profile.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <Card 
                      key={profile.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedProfile === profile.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedProfile(profile.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{profile.name}</div>
                            {profile.displayName && (
                              <div className="text-sm text-muted-foreground">
                                {profile.displayName}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{profile.type}</Badge>
                            {profile.extensionCount !== undefined && (
                              <Badge variant="secondary">
                                {profile.extensionCount} ext
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{selectedExtensions.length} extension(s) selected</span>
            {selectedProfile && (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>
                  {profiles.find(p => p.id === selectedProfile)?.name || 'Unknown Profile'}
                </span>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleUnassignProfile}
              disabled={
                selectedExtensions.length === 0 ||
                updateAssociationMutation.isPending ||
                bulkUpdateMutation.isPending
              }
            >
              <Unlink className="w-4 h-4 mr-2" />
              Unassign
            </Button>
            <Button
              onClick={handleAssignProfile}
              disabled={
                selectedExtensions.length === 0 ||
                !selectedProfile ||
                updateAssociationMutation.isPending ||
                bulkUpdateMutation.isPending
              }
            >
              <Link className="w-4 h-4 mr-2" />
              {selectedProfile === '__unassign__' ? 'Unassign Profile' : 'Assign Profile'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
