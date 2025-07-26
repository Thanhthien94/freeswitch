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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Phone,
  Users,
  Search,
  Link,
  Plus,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { SipProfile } from '@/services/sip-profile.service';
import { extensionService, Extension } from '@/services/extension.service';
import { ExtensionProfileCard } from './ExtensionProfileCard';
import { ExtensionProfileAssociation } from './ExtensionProfileAssociation';

interface ProfileExtensionsViewProps {
  profile: SipProfile;
  onEditExtension?: (extension: Extension) => void;
  onViewExtension?: (extension: Extension) => void;
}

export const ProfileExtensionsView: React.FC<ProfileExtensionsViewProps> = ({
  profile,
  onEditExtension,
  onViewExtension,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch extensions assigned to this profile
  const { data: extensionsData, isLoading } = useQuery({
    queryKey: ['extensions', 'by-profile', profile.id],
    queryFn: () => extensionService.getExtensions({ 
      profileId: profile.id,
      limit: 100 
    }),
  });

  const extensions = extensionsData?.data || [];
  const filteredExtensions = extensions.filter(ext =>
    ext.extensionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfileStatusInfo = () => {
    const extensionCount = extensions.length;
    const activeExtensions = extensions.filter(ext => ext.isActive).length;
    
    return {
      total: extensionCount,
      active: activeExtensions,
      inactive: extensionCount - activeExtensions,
      utilization: extensionCount > 0 ? (activeExtensions / extensionCount) * 100 : 0,
    };
  };

  const statusInfo = getProfileStatusInfo();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{profile.name}</span>
                {profile.displayName && (
                  <span className="text-muted-foreground font-normal">
                    - {profile.displayName}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {profile.description || 'No description provided'}
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{profile.type}</Badge>
              {profile.isActive ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statusInfo.total}</div>
              <div className="text-sm text-muted-foreground">Total Extensions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statusInfo.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statusInfo.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statusInfo.utilization.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Utilization</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Port: {profile.bindPort}</span>
            {profile.bindIp && <span>IP: {profile.bindIp}</span>}
            {profile.tlsPort && <span>TLS: {profile.tlsPort}</span>}
            <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Extensions Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Assigned Extensions</span>
                <Badge variant="secondary">{filteredExtensions.length}</Badge>
              </CardTitle>
              <CardDescription>
                Extensions currently assigned to this SIP profile
              </CardDescription>
            </div>
            
            <div className="flex space-x-2">
              <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Profile Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Profile Configuration</DialogTitle>
                    <DialogDescription>
                      Detailed configuration for {profile.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Basic Settings</h4>
                        <div className="space-y-1 text-sm">
                          <div>Name: {profile.name}</div>
                          <div>Type: {profile.type}</div>
                          <div>Bind Port: {profile.bindPort}</div>
                          {profile.bindIp && <div>Bind IP: {profile.bindIp}</div>}
                          {profile.tlsPort && <div>TLS Port: {profile.tlsPort}</div>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <div className="space-y-1 text-sm">
                          <div>Active: {profile.isActive ? 'Yes' : 'No'}</div>
                          <div>Default: {profile.isDefault ? 'Yes' : 'No'}</div>
                          <div>Extensions: {statusInfo.total}</div>
                          <div>Order: {profile.order}</div>
                        </div>
                      </div>
                    </div>
                    
                    {profile.settings && Object.keys(profile.settings).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">SIP Settings</h4>
                        <div className="bg-muted p-3 rounded text-sm">
                          <pre>{JSON.stringify(profile.settings, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                size="sm"
                onClick={() => setShowAssociationDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Extensions
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search extensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              <span>Loading extensions...</span>
            </div>
          ) : filteredExtensions.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Extensions Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No extensions match your search criteria.'
                  : 'No extensions are currently assigned to this profile.'
                }
              </p>
              <Button onClick={() => setShowAssociationDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Extensions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table View */}
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Extension</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Registration</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExtensions.map((extension) => (
                      <TableRow key={extension.id}>
                        <TableCell className="font-medium">
                          {extension.extensionNumber}
                        </TableCell>
                        <TableCell>
                          {extension.displayName || '-'}
                        </TableCell>
                        <TableCell>
                          {extension.user ? (
                            <div>
                              <div>{extension.user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {extension.user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {extension.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {extension.lastRegistration ? (
                            <div>
                              <div className="text-sm">
                                {new Date(extension.lastRegistration).toLocaleString()}
                              </div>
                              {extension.registrationIp && (
                                <div className="text-xs text-muted-foreground">
                                  {extension.registrationIp}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {onViewExtension && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewExtension(extension)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEditExtension && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditExtension(extension)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Association Dialog */}
      <ExtensionProfileAssociation
        open={showAssociationDialog}
        onOpenChange={setShowAssociationDialog}
        initialProfileId={profile.id}
      />
    </div>
  );
};
