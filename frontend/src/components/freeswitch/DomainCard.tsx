'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  Phone, 
  Settings, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Power, 
  PowerOff,
  Eye,
  CreditCard,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { domainService, Domain } from '@/services/domain.service';

interface DomainCardProps {
  domain: Domain;
  onEdit: (domain: Domain) => void;
  onRefresh: () => void;
}

export function DomainCard({ domain, onEdit, onRefresh }: DomainCardProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainService.deleteDomain(id),
    onSuccess: () => {
      toast.success('Domain deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      onRefresh();
    },
    onError: (error: any) => {
      console.error('Error deleting domain:', error);
      toast.error(error.message || 'Failed to delete domain');
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => 
      domain.isActive 
        ? domainService.deactivateDomain(id)
        : domainService.activateDomain(id),
    onSuccess: () => {
      toast.success(`Domain ${domain.isActive ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      onRefresh();
    },
    onError: (error: any) => {
      console.error('Error toggling domain status:', error);
      toast.error(error.message || 'Failed to update domain status');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(domain.id);
    setShowDeleteDialog(false);
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate(domain.id);
  };

  // Calculate utilization percentages
  const userUtilization = domain.maxUsers > 0 ? ((domain.users?.length || 0) / domain.maxUsers) * 100 : 0;
  const extensionUtilization = 0; // TODO: Get actual extension count
  
  // Get status color
  const getStatusColor = (): "default" | "destructive" | "outline" | "secondary" => {
    if (!domain.isActive) return 'secondary';
    if (userUtilization > 90) return 'destructive';
    if (userUtilization > 75) return 'secondary'; // Changed from 'warning' to 'secondary'
    return 'default';
  };

  // Get billing plan color
  const getBillingPlanColor = () => {
    switch (domain.billingPlan?.toLowerCase()) {
      case 'enterprise': return 'default';
      case 'professional': return 'secondary';
      case 'basic': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${!domain.isActive ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {domain.displayName}
              </CardTitle>
              <CardDescription className="text-sm">
                {domain.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor()}>
                {domain.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(domain)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Domain
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleActive}>
                    {domain.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Domain
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {domain.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {domain.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resource Utilization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Users</span>
              </div>
              <span className="font-medium">
                {domain.users?.length || 0} / {domain.maxUsers}
              </span>
            </div>
            <Progress value={userUtilization} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>Extensions</span>
              </div>
              <span className="font-medium">
                0 / {domain.maxExtensions}
              </span>
            </div>
            <Progress value={extensionUtilization} className="h-2" />
          </div>

          {/* Domain Info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Plan:</span>
              </div>
              <Badge variant={getBillingPlanColor()} className="text-xs">
                {domain.billingPlan || 'Basic'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Admin:</span>
              </div>
              <div className="text-xs">
                <div className="truncate">{domain.adminEmail}</div>
                {domain.adminPhone && (
                  <div className="text-muted-foreground truncate">{domain.adminPhone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {domain.settings?.recording_enabled && (
              <Badge variant="outline" className="text-xs">
                Recording
              </Badge>
            )}
            {domain.settings?.voicemail_enabled && (
              <Badge variant="outline" className="text-xs">
                Voicemail
              </Badge>
            )}
            {domain.settings?.registration_required && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            )}
            {(domain as any).billingSettings?.billing_enabled && (
              <Badge variant="outline" className="text-xs">
                <CreditCard className="w-3 h-3 mr-1" />
                Billing
              </Badge>
            )}
          </div>

          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created: {new Date(domain.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the domain "{domain.displayName}" ({domain.name})?
              This action cannot be undone and will remove all associated users, extensions, and configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Domain'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
