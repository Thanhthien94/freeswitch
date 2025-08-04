'use client';

import { useState, useEffect } from 'react';
import {
  Gateway,
  GatewayStats,
  gatewayService,
  GatewayListParams,
  CreateGatewayRequest
} from '@/services/gateway.service';
import { sipProfileService } from '@/services/sip-profile.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Code,
  Signal,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Settings,
  Network
} from 'lucide-react';

interface SipProfile {
  id: string;
  name: string;
}

// Modal Components
interface AddGatewayModalProps {
  sipProfiles: SipProfile[];
  onClose: () => void;
  onSubmit: (data: CreateGatewayRequest) => void;
}

function AddGatewayModal({ sipProfiles, onClose, onSubmit }: AddGatewayModalProps) {
  const [formData, setFormData] = useState<CreateGatewayRequest>({
    name: '',
    username: '',
    password: '',
    realm: '',
    proxy: '',
    profileId: '',
    register: true,
    retrySeconds: 30,
    callerIdInFrom: false,
    extension: '',
    context: 'default'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.realm.trim()) newErrors.realm = 'Realm is required';
    if (!formData.proxy.trim()) newErrors.proxy = 'Proxy is required';
    if (!formData.profileId) newErrors.profileId = 'SIP Profile is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreateGatewayRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <Card className="relative top-20 mx-auto w-11/12 md:w-3/4 lg:w-1/2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Gateway</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Gateway name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="SIP username"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="SIP password"
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Realm *</label>
              <Input
                type="text"
                value={formData.realm}
                onChange={(e) => handleChange('realm', e.target.value)}
                placeholder="SIP realm/domain"
                className={errors.realm ? 'border-destructive' : ''}
              />
              {errors.realm && <p className="text-destructive text-xs mt-1">{errors.realm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Proxy *</label>
              <Input
                type="text"
                value={formData.proxy}
                onChange={(e) => handleChange('proxy', e.target.value)}
                placeholder="SIP proxy server"
                className={errors.proxy ? 'border-destructive' : ''}
              />
              {errors.proxy && <p className="text-destructive text-xs mt-1">{errors.proxy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SIP Profile *</label>
              <Select
                value={formData.profileId}
                onValueChange={(value) => handleChange('profileId', value)}
              >
                <SelectTrigger className={errors.profileId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select SIP Profile" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              {errors.profileId && <p className="text-destructive text-xs mt-1">{errors.profileId}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.register}
                onChange={(e) => handleChange('register', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Register</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.callerIdInFrom}
                onChange={(e) => handleChange('callerIdInFrom', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Caller ID in From</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Create Gateway
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Gateway Modal
interface EditGatewayModalProps {
  gateway: Gateway;
  sipProfiles: SipProfile[];
  onClose: () => void;
  onSubmit: (data: Partial<CreateGatewayRequest>) => void;
}

function EditGatewayModal({ gateway, sipProfiles, onClose, onSubmit }: EditGatewayModalProps) {
  const [formData, setFormData] = useState<CreateGatewayRequest>({
    name: gateway.name || '',
    username: gateway.username || '',
    password: gateway.password || '',
    realm: gateway.realm || '',
    proxy: gateway.proxy || '',
    profileId: gateway.profileId || '',
    register: gateway.register ?? true,
    retrySeconds: gateway.retrySeconds || 30,
    callerIdInFrom: gateway.callerIdInFrom ?? false,
    extension: gateway.extension || '',
    context: gateway.context || 'default'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.realm.trim()) newErrors.realm = 'Realm is required';
    if (!formData.proxy.trim()) newErrors.proxy = 'Proxy is required';
    if (!formData.profileId) newErrors.profileId = 'SIP Profile is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreateGatewayRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <Card className="relative top-20 mx-auto w-11/12 md:w-3/4 lg:w-1/2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Gateway: {gateway.name}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Realm *</label>
              <Input
                type="text"
                value={formData.realm}
                onChange={(e) => handleChange('realm', e.target.value)}
                className={errors.realm ? 'border-destructive' : ''}
              />
              {errors.realm && <p className="text-destructive text-xs mt-1">{errors.realm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Proxy *</label>
              <Input
                type="text"
                value={formData.proxy}
                onChange={(e) => handleChange('proxy', e.target.value)}
                className={errors.proxy ? 'border-destructive' : ''}
              />
              {errors.proxy && <p className="text-destructive text-xs mt-1">{errors.proxy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SIP Profile *</label>
              <Select
                value={formData.profileId}
                onValueChange={(value) => handleChange('profileId', value)}
              >
                <SelectTrigger className={errors.profileId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select SIP Profile" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  )) : []}
                </SelectContent>
              </Select>
              {errors.profileId && <p className="text-destructive text-xs mt-1">{errors.profileId}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.register}
                onChange={(e) => handleChange('register', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Register</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.callerIdInFrom}
                onChange={(e) => handleChange('callerIdInFrom', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Caller ID in From</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Update Gateway
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Gateway Modal
interface DeleteGatewayModalProps {
  gateway: Gateway;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteGatewayModal({ gateway, onClose, onConfirm }: DeleteGatewayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <Card className="relative top-20 mx-auto w-96">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Gateway
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the gateway <strong>{gateway.name}</strong>?
            </p>
            <p className="text-sm text-destructive mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
            >
              Delete Gateway
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// View Gateway Modal
interface ViewGatewayModalProps {
  gateway: Gateway;
  onClose: () => void;
}

function ViewGatewayModal({ gateway, onClose }: ViewGatewayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
      <Card className="relative top-20 mx-auto w-11/12 md:w-3/4 lg:w-1/2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Gateway Details: {gateway.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1 text-sm font-medium">{gateway.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Username</label>
                <p className="mt-1 text-sm font-medium">{gateway.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Realm</label>
                <p className="mt-1 text-sm font-medium">{gateway.realm}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Proxy</label>
                <p className="mt-1 text-sm font-medium">{gateway.proxy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">SIP Profile</label>
                <p className="mt-1 text-sm font-medium">{gateway.profileName || gateway.profileId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Extension</label>
                <p className="mt-1 text-sm font-medium">{gateway.extension || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div>
            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
              <Signal className="h-4 w-4" />
              Status Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Registration Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(gateway.status)}>
                    {gateway.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">State</label>
                <div className="mt-1">
                  <Badge variant={getStateVariant(gateway.state)}>
                    {gateway.state || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h4 className="text-md font-medium mb-3 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Register</label>
                <p className="mt-1 text-sm font-medium">{gateway.register ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Retry Seconds</label>
                <p className="mt-1 text-sm font-medium">{gateway.retrySeconds || 30}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Context</label>
                <p className="mt-1 text-sm font-medium">{gateway.context || 'default'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Caller ID in From</label>
                <p className="mt-1 text-sm font-medium">{gateway.callerIdInFrom ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [sipProfiles, setSipProfiles] = useState<SipProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGateways, setTotalGateways] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const itemsPerPage = 10;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load gateways when filters change
  useEffect(() => {
    if (!loading) {
      loadGateways();
    }
  }, [currentPage, searchTerm, selectedProfile, selectedStatus]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGateways(),
        loadSipProfiles(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGateways = async () => {
    try {
      const params: GatewayListParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        profileId: selectedProfile && selectedProfile !== 'all' ? selectedProfile : undefined,
        status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
        sortBy: 'name',
        sortOrder: 'ASC'
      };

      const response = await gatewayService.getGateways(params);
      setGateways(response.data || []);
      setTotalGateways(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Failed to load gateways:', error);
      setGateways([]);
      setTotalGateways(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadSipProfiles = async () => {
    try {
      const response = await sipProfileService.getSipProfiles({ limit: 100 });
      setSipProfiles(response.data || []);
    } catch (error) {
      console.error('Failed to load SIP profiles:', error);
      setSipProfiles([]);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await gatewayService.getGatewayStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load gateway stats:', error);
      setStats(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadGateways();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadGateways();
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'REGED':
        return 'default';
      case 'NOREG':
        return 'secondary';
      case 'UNREGED':
        return 'outline';
      case 'FAILED':
      case 'FAIL_WAIT':
        return 'destructive';
      case 'TRYING':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStateVariant = (state?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (state) {
      case 'UP':
        return 'default';
      case 'DOWN':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Modal handlers
  const handleAddGateway = async (data: CreateGatewayRequest) => {
    try {
      await gatewayService.createGateway(data);
      setNotification({ type: 'success', message: 'Gateway created successfully!' });
      setShowAddModal(false);
      await loadInitialData();
    } catch (error) {
      console.error('Failed to create gateway:', error);
      setNotification({ type: 'error', message: 'Failed to create gateway. Please try again.' });
    }
  };

  const handleEditGateway = async (data: Partial<CreateGatewayRequest>) => {
    if (!selectedGateway) return;

    try {
      await gatewayService.updateGateway(selectedGateway.id, data);
      setNotification({ type: 'success', message: 'Gateway updated successfully!' });
      setShowEditModal(false);
      setSelectedGateway(null);
      await loadInitialData();
    } catch (error) {
      console.error('Failed to update gateway:', error);
      setNotification({ type: 'error', message: 'Failed to update gateway. Please try again.' });
    }
  };

  const handleDeleteGateway = async () => {
    if (!selectedGateway) return;

    try {
      await gatewayService.deleteGateway(selectedGateway.id);
      setNotification({ type: 'success', message: 'Gateway deleted successfully!' });
      setShowDeleteModal(false);
      setSelectedGateway(null);
      await loadInitialData();
    } catch (error) {
      console.error('Failed to delete gateway:', error);
      setNotification({ type: 'error', message: 'Failed to delete gateway. Please try again.' });
    }
  };

  const openEditModal = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setShowEditModal(true);
  };

  const openDeleteModal = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setShowDeleteModal(true);
  };

  const openViewModal = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setShowViewModal(true);
  };

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Gateways
          </h1>
          <p className="text-muted-foreground">Manage FreeSWITCH gateway configurations</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Gateway
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Server className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Total Gateways</dt>
                    <dd className="text-lg font-medium">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Active</dt>
                    <dd className="text-lg font-medium">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Inactive</dt>
                    <dd className="text-lg font-medium">{stats.inactive}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Signal className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Registered</dt>
                    <dd className="text-lg font-medium">{stats.registered}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    placeholder="Search gateways..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile" className="block text-sm font-medium mb-2">
                  SIP Profile
                </label>
                <Select
                  value={selectedProfile}
                  onValueChange={(value) => {
                    setSelectedProfile(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Profiles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    )) : []}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="REGED">Registered</SelectItem>
                    <SelectItem value="NOREG">No Registration</SelectItem>
                    <SelectItem value="UNREGED">Unregistered</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="TRYING">Trying</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gateways Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gateways ({totalGateways})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {Array.isArray(gateways) ? gateways.map((gateway) => (
                <TableRow key={gateway.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">
                          {gateway.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {gateway.username}@{gateway.realm}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {gateway.profileName || gateway.profileId}
                  </TableCell>
                  <TableCell>
                    {gateway.proxy}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(gateway.status)}>
                      {gateway.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStateVariant(gateway.state)}>
                      {gateway.state || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(gateway)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(gateway)}
                        title="Edit Gateway"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Configuration"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(gateway)}
                        title="Delete Gateway"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : []}
              </TableBody>
            </Table>

            {gateways.length === 0 && (
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No gateways</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by creating a new gateway.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Gateway
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Pagination - Temporarily disabled for debugging */}
        {false && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalGateways)} of {totalGateways} results
            </div>
          </div>
        )}

      {/* Notification */}
      {notification && (
        <Alert className={`fixed top-4 right-4 z-50 max-w-md ${
          notification.type === 'success' ? 'border-green-500' : 'border-red-500'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <AlertDescription className="ml-3 flex-1">
              {notification.message}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotification(null)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Add Gateway Modal */}
      {showAddModal && (
        <AddGatewayModal
          sipProfiles={sipProfiles}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddGateway}
        />
      )}

      {/* Edit Gateway Modal */}
      {showEditModal && selectedGateway && (
        <EditGatewayModal
          gateway={selectedGateway}
          sipProfiles={sipProfiles}
          onClose={() => {
            setShowEditModal(false);
            setSelectedGateway(null);
          }}
          onSubmit={handleEditGateway}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGateway && (
        <DeleteGatewayModal
          gateway={selectedGateway}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedGateway(null);
          }}
          onConfirm={handleDeleteGateway}
        />
      )}

      {/* View Gateway Modal */}
      {showViewModal && selectedGateway && (
        <ViewGatewayModal
          gateway={selectedGateway}
          onClose={() => {
            setShowViewModal(false);
            setSelectedGateway(null);
          }}
        />
      )}
    </div>
  );
}
