'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Link,
  Unlink,
  MoreVertical,
  Phone,
  Settings,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Extension, extensionService } from '@/services/extension.service';
import { SipProfile, sipProfileService } from '@/services/sip-profile.service';
import { ExtensionProfileAssociation } from './ExtensionProfileAssociation';

interface ExtensionProfileCardProps {
  extension: Extension;
  onEdit?: (extension: Extension) => void;
  onView?: (extension: Extension) => void;
  compact?: boolean;
}

export const ExtensionProfileCard: React.FC<ExtensionProfileCardProps> = ({
  extension,
  onEdit,
  onView,
  compact = false,
}) => {
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch the associated SIP profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['sip-profile', extension.profileId],
    queryFn: () => extension.profileId ? sipProfileService.getSipProfile(extension.profileId) : null,
    enabled: !!extension.profileId,
  });

  // Quick unassign mutation
  const unassignMutation = useMutation({
    mutationFn: () => extensionService.updateExtension(extension.id, { profileId: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      queryClient.invalidateQueries({ queryKey: ['sip-profiles'] });
      toast.success('Profile unassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unassign profile');
    },
  });

  const getAssociationStatus = () => {
    if (!extension.profileId) {
      return {
        status: 'unassigned',
        color: 'secondary',
        icon: AlertCircle,
        text: 'No Profile',
        description: 'Extension is not assigned to any SIP profile',
      };
    }

    if (profileLoading) {
      return {
        status: 'loading',
        color: 'secondary',
        icon: RefreshCw,
        text: 'Loading...',
        description: 'Loading profile information',
      };
    }

    if (!profile) {
      return {
        status: 'invalid',
        color: 'destructive',
        icon: AlertCircle,
        text: 'Invalid Profile',
        description: 'Assigned profile no longer exists',
      };
    }

    return {
      status: 'assigned',
      color: 'default',
      icon: CheckCircle,
      text: profile.name,
      description: `Assigned to ${profile.displayName || profile.name} (${profile.type})`,
    };
  };

  const associationStatus = getAssociationStatus();
  const StatusIcon = associationStatus.icon;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{extension.extensionNumber}</span>
            {extension.displayName && (
              <span className="text-sm text-muted-foreground">
                ({extension.displayName})
              </span>
            )}
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  variant={associationStatus.color as any}
                  className="flex items-center space-x-1"
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{associationStatus.text}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{associationStatus.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowAssociationDialog(true)}>
              <Link className="mr-2 h-4 w-4" />
              Manage Association
            </DropdownMenuItem>
            {extension.profileId && (
              <DropdownMenuItem 
                onClick={() => unassignMutation.mutate()}
                disabled={unassignMutation.isPending}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Unassign Profile
              </DropdownMenuItem>
            )}
            {onView && (
              <DropdownMenuItem onClick={() => onView(extension)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(extension)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Extension
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ExtensionProfileAssociation
          open={showAssociationDialog}
          onOpenChange={setShowAssociationDialog}
          initialExtensionId={extension.id}
          initialProfileId={extension.profileId}
        />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>{extension.extensionNumber}</span>
                {extension.displayName && (
                  <span className="text-muted-foreground font-normal">
                    - {extension.displayName}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {extension.description || 'No description provided'}
              </CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAssociationDialog(true)}>
                  <Link className="mr-2 h-4 w-4" />
                  Manage Association
                </DropdownMenuItem>
                {extension.profileId && (
                  <DropdownMenuItem 
                    onClick={() => unassignMutation.mutate()}
                    disabled={unassignMutation.isPending}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Unassign Profile
                  </DropdownMenuItem>
                )}
                {onView && (
                  <DropdownMenuItem onClick={() => onView(extension)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(extension)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Extension
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Association Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SIP Profile:</span>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant={associationStatus.color as any}
                      className="flex items-center space-x-1"
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{associationStatus.text}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{associationStatus.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Profile Details */}
            {profile && (
              <div className="bg-muted/50 p-3 rounded-lg">
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
                    {profile.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
                
                {profile.description && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {profile.description}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <span>Port: {profile.bindPort}</span>
                  {profile.bindIp && <span>IP: {profile.bindIp}</span>}
                  {profile.extensionCount !== undefined && (
                    <span>{profile.extensionCount} extensions</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssociationDialog(true)}
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-2" />
                {extension.profileId ? 'Change Profile' : 'Assign Profile'}
              </Button>
              
              {extension.profileId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unassignMutation.mutate()}
                  disabled={unassignMutation.isPending}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unassign
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ExtensionProfileAssociation
        open={showAssociationDialog}
        onOpenChange={setShowAssociationDialog}
        initialExtensionId={extension.id}
        initialProfileId={extension.profileId}
      />
    </>
  );
};
