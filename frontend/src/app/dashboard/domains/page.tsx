'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Users, Phone, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { domainService, CreateDomainData, UpdateDomainData, Domain } from '@/services/domain.service';

// Types imported from service

export default function DomainsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState<CreateDomainData>({
    name: '',
    displayName: '',
    description: '',
    maxUsers: 100,
    maxExtensions: 200,
    adminEmail: '',
    adminPhone: '',
    costCenter: '',
  });

  // Fetch domains using React Query
  const { data: domainsResponse, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains(),
  });

  const domains = domainsResponse?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateDomainData) => domainService.createDomain(data),
    onSuccess: () => {
      toast.success('Domain created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: (error: any) => {
      console.error('Error creating domain:', error);
      toast.error(error.message || 'Failed to create domain');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDomainData }) =>
      domainService.updateDomain(id, data),
    onSuccess: () => {
      toast.success('Domain updated successfully');
      setIsEditDialogOpen(false);
      setSelectedDomain(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: (error: any) => {
      console.error('Error updating domain:', error);
      toast.error(error.message || 'Failed to update domain');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainService.deleteDomain(id),
    onSuccess: () => {
      toast.success('Domain deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
    onError: (error: any) => {
      console.error('Error deleting domain:', error);
      toast.error(error.message || 'Failed to delete domain');
    },
  });

  const handleCreateDomain = () => {
    createMutation.mutate(formData);
  };

  const handleUpdateDomain = () => {
    if (!selectedDomain) return;
    updateMutation.mutate({ id: selectedDomain.id, data: formData });
  };

  const handleDeleteDomain = (domain: Domain) => {
    if (!confirm(`Are you sure you want to delete domain "${domain.name}"?`)) {
      return;
    }
    deleteMutation.mutate(domain.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      maxUsers: 100,
      maxExtensions: 200,
      adminEmail: '',
      adminPhone: '',
      costCenter: '',
    });
  };

  const openEditDialog = (domain: Domain) => {
    setSelectedDomain(domain);
    setFormData({
      name: domain.name,
      displayName: domain.displayName,
      description: domain.description,
      maxUsers: domain.maxUsers,
      maxExtensions: domain.maxExtensions,
      adminEmail: domain.adminEmail,
      adminPhone: domain.adminPhone || '',
      costCenter: domain.costCenter || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredDomains = (domains || []).filter(domain =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground">
            Manage domains and their configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Domain</DialogTitle>
              <DialogDescription>
                Add a new domain to the system. Fill in the required information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Domain Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Example Company"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Domain description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxExtensions">Max Extensions</Label>
                  <Input
                    id="maxExtensions"
                    type="number"
                    value={formData.maxExtensions}
                    onChange={(e) => setFormData({ ...formData, maxExtensions: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Admin Phone</Label>
                  <Input
                    id="adminPhone"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Input
                  id="costCenter"
                  value={formData.costCenter}
                  onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                  placeholder="CC-001"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDomain}>Create Domain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search domains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domains ({filteredDomains.length})</CardTitle>
          <CardDescription>
            List of all domains in the system
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
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Extensions</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{domain.displayName}</div>
                        <div className="text-sm text-muted-foreground">{domain.name}</div>
                        {domain.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {domain.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.isActive ? "default" : "secondary"}>
                        {domain.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{domain.users?.length || 0}/{domain.maxUsers}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>0/{domain.maxExtensions}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{domain.billingPlan}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{domain.adminEmail}</div>
                        {domain.adminPhone && (
                          <div className="text-muted-foreground">{domain.adminPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(domain)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDomain(domain)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>
              Update domain information. Some fields may be read-only.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Domain Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Display Name *</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxUsers">Max Users</Label>
                <Input
                  id="edit-maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxExtensions">Max Extensions</Label>
                <Input
                  id="edit-maxExtensions"
                  type="number"
                  value={formData.maxExtensions}
                  onChange={(e) => setFormData({ ...formData, maxExtensions: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-adminEmail">Admin Email *</Label>
                <Input
                  id="edit-adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-adminPhone">Admin Phone</Label>
                <Input
                  id="edit-adminPhone"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costCenter">Cost Center</Label>
              <Input
                id="edit-costCenter"
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDomain}>Update Domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
