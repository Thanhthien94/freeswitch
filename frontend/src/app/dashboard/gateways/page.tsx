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
// Temporarily comment out icons for debugging
// import {
//   Plus,
//   Search,
//   RefreshCw,
//   Eye,
//   Edit,
//   Trash2,
//   Code,
//   Signal,
//   Server,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   X
// } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Gateway</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Gateway name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SIP username"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SIP password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Realm *</label>
              <input
                type="text"
                value={formData.realm}
                onChange={(e) => handleChange('realm', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.realm ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SIP realm/domain"
              />
              {errors.realm && <p className="text-red-500 text-xs mt-1">{errors.realm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Proxy *</label>
              <input
                type="text"
                value={formData.proxy}
                onChange={(e) => handleChange('proxy', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.proxy ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SIP proxy server"
              />
              {errors.proxy && <p className="text-red-500 text-xs mt-1">{errors.proxy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SIP Profile *</label>
              <select
                value={formData.profileId}
                onChange={(e) => handleChange('profileId', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.profileId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select SIP Profile</option>
                {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                )) : []}
              </select>
              {errors.profileId && <p className="text-red-500 text-xs mt-1">{errors.profileId}</p>}
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Gateway
            </button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Gateway: {gateway.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            {/* <X className="h-6 w-6" /> */}
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Realm *</label>
              <input
                type="text"
                value={formData.realm}
                onChange={(e) => handleChange('realm', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.realm ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.realm && <p className="text-red-500 text-xs mt-1">{errors.realm}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Proxy *</label>
              <input
                type="text"
                value={formData.proxy}
                onChange={(e) => handleChange('proxy', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.proxy ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.proxy && <p className="text-red-500 text-xs mt-1">{errors.proxy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SIP Profile *</label>
              <select
                value={formData.profileId}
                onChange={(e) => handleChange('profileId', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.profileId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select SIP Profile</option>
                {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                )) : []}
              </select>
              {errors.profileId && <p className="text-red-500 text-xs mt-1">{errors.profileId}</p>}
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Update Gateway
            </button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Delete Gateway</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the gateway <strong>{gateway.name}</strong>?
          </p>
          <p className="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete Gateway
          </button>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Gateway Details: {gateway.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Username</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Realm</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.realm}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Proxy</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.proxy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">SIP Profile</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.profileName || gateway.profileId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Extension</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.extension || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Status Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Registration Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  gateway.status === 'REGED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {gateway.status || 'Unknown'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">State</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  gateway.state === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {gateway.state || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Register</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.register ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Retry Seconds</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.retrySeconds || 30}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Context</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.context || 'default'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Caller ID in From</label>
                <p className="mt-1 text-sm text-gray-900">{gateway.callerIdInFrom ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
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
        profileId: selectedProfile || undefined,
        status: selectedStatus || undefined,
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'REGED':
        return 'bg-green-100 text-green-800';
      case 'NOREG':
        return 'bg-gray-100 text-gray-800';
      case 'UNREGED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'FAIL_WAIT':
        return 'bg-red-100 text-red-800';
      case 'TRYING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateColor = (state?: string) => {
    switch (state) {
      case 'UP':
        return 'bg-green-100 text-green-800';
      case 'DOWN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading gateways...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gateways</h1>
          <p className="text-gray-600">Manage FreeSWITCH gateway configurations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">➕</span>
            Add Gateway
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* <Server className="h-8 w-8 text-gray-400" /> */}
                  📊
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Gateways</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* <CheckCircle className="h-8 w-8 text-green-400" /> */}
                  ✅
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* <XCircle className="h-8 w-8 text-red-400" /> */}
                  ❌
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inactive}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* <Signal className="h-8 w-8 text-yellow-400" /> */}
                  📡
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Registered</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.registered}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search gateways..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile" className="block text-sm font-medium text-gray-700">
                  SIP Profile
                </label>
                <select
                  id="profile"
                  value={selectedProfile}
                  onChange={(e) => {
                    setSelectedProfile(e.target.value);
                    handleFilterChange();
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Profiles</option>
                  {Array.isArray(sipProfiles) ? sipProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  )) : []}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    handleFilterChange();
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="REGED">Registered</option>
                  <option value="NOREG">No Registration</option>
                  <option value="UNREGED">Unregistered</option>
                  <option value="FAILED">Failed</option>
                  <option value="TRYING">Trying</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-2">🔍</span>
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Gateways Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Gateways ({totalGateways})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gateway
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(gateways) ? gateways.map((gateway) => (
                <tr key={gateway.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {gateway.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {gateway.username}@{gateway.realm}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {gateway.profileName || gateway.profileId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {gateway.proxy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(gateway.status)}`}>
                      {gateway.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(gateway.state)}`}>
                      {gateway.state || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openViewModal(gateway)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(gateway)}
                        className="text-green-600 hover:text-green-900 px-2 py-1 text-sm"
                        title="Edit Gateway"
                      >
                        Edit
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 px-2 py-1 text-sm"
                        title="View Configuration"
                      >
                        Config
                      </button>
                      <button
                        onClick={() => openDeleteModal(gateway)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 text-sm"
                        title="Delete Gateway"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : []}
            </tbody>
          </table>

          {gateways.length === 0 && (
            <div className="text-center py-12">
              {/* <Server className="mx-auto h-12 w-12 text-gray-400" /> */}
              <div className="mx-auto text-4xl">🖥️</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No gateways</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new gateway.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-2">➕</span>
                  Add Gateway
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination - Temporarily disabled for debugging */}
        {false && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalGateways)} of {totalGateways} results
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success'
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <span>✅</span>
              ) : (
                <span>⚠️</span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotification(null)}
                className="inline-flex text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
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
