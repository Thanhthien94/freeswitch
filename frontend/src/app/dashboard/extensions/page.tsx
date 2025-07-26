'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  PhoneOff,
  Settings,
  Users,
  Filter,
  Link
} from 'lucide-react';
import { extensionService, Extension } from '@/services/extension.service';
import { domainService, Domain } from '@/services/domain.service';
import { useToast } from '@/hooks/use-toast';





export default function ExtensionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newExtension, setNewExtension] = useState({
    extensionNumber: '',
    displayName: '',
    description: '',
    password: '',
    effectiveCallerIdName: '',
    effectiveCallerIdNumber: '',
    domainId: ''
  });

  useEffect(() => {
    loadExtensions();
    loadDomains();
  }, []);

  const loadExtensions = async () => {
    try {
      setLoading(true);
      console.log('=== Loading extensions ===');
      const response = await extensionService.getExtensions();
      console.log('Extension service response:', response);
      console.log('Response type:', typeof response);
      console.log('Response is array:', Array.isArray(response));
      console.log('Response keys:', Object.keys(response));
      console.log('Response data:', response.data);
      console.log('Response data length:', response.data?.length);
      const extensionsData = response.data || [];
      console.log('Setting extensions to:', extensionsData);
      setExtensions(extensionsData);
    } catch (error) {
      console.error('Error loading extensions:', error);
      toast({
        title: "Error",
        description: "Failed to load extensions",
        variant: "destructive",
      });
      setExtensions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await domainService.getDomains();
      setDomains(response.data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
      setDomains([]); // Set empty array on error
    }
  };

  const handleCreateExtension = async () => {
    try {
      // Clean up the data before sending
      const extensionData = {
        extensionNumber: newExtension.extensionNumber,
        displayName: newExtension.displayName || undefined,
        description: newExtension.description || undefined,
        domainId: newExtension.domainId || undefined,
        password: newExtension.password || undefined,
        effectiveCallerIdName: newExtension.effectiveCallerIdName || undefined,
        effectiveCallerIdNumber: newExtension.effectiveCallerIdNumber || undefined,
        isActive: true
      };

      await extensionService.createExtension(extensionData);
      toast({
        title: "Success",
        description: "Extension created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewExtension({
        extensionNumber: '',
        displayName: '',
        description: '',
        password: '',
        effectiveCallerIdName: '',
        effectiveCallerIdNumber: '',
        domainId: ''
      });
      loadExtensions();
    } catch (error) {
      console.error('Error creating extension:', error);
      toast({
        title: "Error",
        description: "Failed to create extension",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExtension = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extension?')) {
      return;
    }

    try {
      await extensionService.deleteExtension(id);
      toast({
        title: "Success",
        description: "Extension deleted successfully",
      });
      loadExtensions();
    } catch (error) {
      console.error('Error deleting extension:', error);
      toast({
        title: "Error",
        description: "Failed to delete extension",
        variant: "destructive",
      });
    }
  };

  const filteredExtensions = Array.isArray(extensions) ? extensions.filter(ext => {
    const matchesSearch = ext.extensionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.effectiveCallerIdName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.effectiveCallerIdNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = selectedDomain === 'all' || ext.domainId === selectedDomain;

    return matchesSearch && matchesDomain;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extensions</h1>
          <p className="text-muted-foreground">
            Manage SIP extensions and their configurations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/extension-profiles')}
          >
            <Link className="w-4 h-4 mr-2" />
            Manage Associations
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Extension
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Extension</DialogTitle>
              <DialogDescription>
                Add a new SIP extension to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="extension" className="text-right">
                  Extension
                </Label>
                <Input
                  id="extension"
                  value={newExtension.extensionNumber}
                  onChange={(e) => setNewExtension({ ...newExtension, extensionNumber: e.target.value })}
                  className="col-span-3"
                  placeholder="1001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="displayName" className="text-right">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={newExtension.displayName}
                  onChange={(e) => setNewExtension({ ...newExtension, displayName: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newExtension.description}
                  onChange={(e) => setNewExtension({ ...newExtension, description: e.target.value })}
                  className="col-span-3"
                  placeholder="User extension"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newExtension.password}
                  onChange={(e) => setNewExtension({ ...newExtension, password: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="callerIdName" className="text-right">
                  Caller ID Name
                </Label>
                <Input
                  id="callerIdName"
                  value={newExtension.effectiveCallerIdName}
                  onChange={(e) => setNewExtension({ ...newExtension, effectiveCallerIdName: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="callerIdNumber" className="text-right">
                  Caller ID Number
                </Label>
                <Input
                  id="callerIdNumber"
                  value={newExtension.effectiveCallerIdNumber}
                  onChange={(e) => setNewExtension({ ...newExtension, effectiveCallerIdNumber: e.target.value })}
                  className="col-span-3"
                  placeholder="1001"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="domain" className="text-right">
                  Domain
                </Label>
                <Select value={newExtension.domainId} onValueChange={(value) => setNewExtension({ ...newExtension, domainId: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(domains) && domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateExtension}>
                Create Extension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Extensions List
          </CardTitle>
          <CardDescription>
            Total: {filteredExtensions.length} extensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search extensions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {Array.isArray(domains) && domains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Caller ID</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading extensions...
                    </TableCell>
                  </TableRow>
                ) : filteredExtensions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No extensions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExtensions.map((extension) => (
                    <TableRow key={extension.id}>
                      <TableCell className="font-medium">
                        {extension.extensionNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{extension.displayName || extension.effectiveCallerIdName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{extension.effectiveCallerIdNumber || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {extension.domain?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={extension.isActive ? "default" : "secondary"}>
                          {extension.isActive ? (
                            <>
                              <Phone className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <PhoneOff className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(extension.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/extensions/${extension.id}`)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/extensions/${extension.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExtension(extension.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
