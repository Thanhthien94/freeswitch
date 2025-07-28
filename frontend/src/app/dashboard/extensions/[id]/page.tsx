'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Edit, Save, X, Eye, EyeOff, Copy, Phone, Settings, Trash2, RotateCcw, 
  Home, ChevronRight, User, Clock, Shield, Activity, PhoneCall, Mic, MicOff,
  Volume2, VolumeX, Download, Upload, FileText, Calendar, MapPin, Globe,
  Wifi, WifiOff, Signal, SignalHigh, SignalLow, SignalMedium, AlertCircle,
  CheckCircle, XCircle, Info, Bell, BellOff, Lock, Unlock, Key, RefreshCw,
  Database, Server, Network, Monitor, Headphones, Speaker, PlayCircle,
  PauseCircle, StopCircle, SkipForward, SkipBack, Repeat, Shuffle
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

import { extensionService, Extension, ExtensionCallStats } from '@/services/extension.service';
import { domainService } from '@/services/domain.service';
import { Domain } from '@/types/domain';

// Extended interface for form data with additional properties
interface ExtensionFormData extends Partial<Extension> {
  context?: string;
  voicemailEnabled?: boolean;
  voicemailPin?: string;
  dndEnabled?: boolean;
  callForwardEnabled?: boolean;
  callForwardNumber?: string;
  callForwardType?: string;
  callForwardOnBusy?: boolean;
  callForwardOnNoAnswer?: boolean;
  callForwardUnconditional?: boolean;
  callForwardBusyNumber?: string;
  callForwardNoAnswerNumber?: string;
  callForwardUnconditionalNumber?: string;
  callForwardTimeout?: number;
  // Security settings
  requireStrongPassword?: boolean;
  twoFactorEnabled?: boolean;
  allowInternational?: boolean;
  allowLongDistance?: boolean;
  businessHoursOnly?: boolean;
  allowedIPs?: string;
  // Advanced SIP settings
  sipPort?: number;
  rtpPortRange?: string;
  codecs?: string;
  dtmfMode?: string;
  enableSRTP?: boolean;
  enableICE?: boolean;
  debugLogging?: boolean;
  logLevel?: string;
  recordingMode?: string;
  // Call settings
  maxCalls?: number;
  callTimeout?: number;
  recordCalls?: boolean;
  hangupAfterBridge?: boolean;
  continueOnFail?: boolean;
}

export default function ExtensionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const extensionId = params.id as string;

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plainPassword, setPlainPassword] = useState<string>('');
  const [formData, setFormData] = useState<ExtensionFormData>({});
  const [activeTab, setActiveTab] = useState('general');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Fetch extension data
  const { data: extension, isLoading, error } = useQuery({
    queryKey: ['extension', extensionId],
    queryFn: () => extensionService.getExtension(extensionId),
    enabled: !!extensionId,
  });

  // Fetch domains for select
  const { data: domains } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains(),
  });

  // Fetch extension statistics
  const { data: stats } = useQuery({
    queryKey: ['extension-call-stats', extensionId],
    queryFn: () => extensionService.getExtensionCallStats(extensionId),
    enabled: !!extensionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch call history
  const { data: calls } = useQuery({
    queryKey: ['extension-calls', extensionId],
    queryFn: () => extensionService.getExtensionCalls(extensionId),
    enabled: !!extensionId,
  });

  // Fetch registration status
  const { data: registration } = useQuery({
    queryKey: ['extension-registration', extensionId],
    queryFn: () => extensionService.getExtensionRegistration(extensionId),
    enabled: !!extensionId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update extension mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Extension>) => extensionService.updateExtension(extensionId, data),
    onSuccess: (data) => {
      toast.success('Extension updated successfully');
      queryClient.invalidateQueries({ queryKey: ['extension', extensionId] });
      setIsEditing(false);
      // Check if response has plainPassword (for password reset)
      if ('plainPassword' in data && (data as any).plainPassword) {
        setPlainPassword((data as any).plainPassword);
        setShowPassword(true);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update extension');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: () => extensionService.resetExtensionPassword(extensionId),
    onSuccess: (data) => {
      toast.success('Password reset successfully');
      setPlainPassword(data.plainPassword);
      setShowPassword(true);
      queryClient.invalidateQueries({ queryKey: ['extension', extensionId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });

  // Delete extension mutation
  const deleteMutation = useMutation({
    mutationFn: () => extensionService.deleteExtension(extensionId),
    onSuccess: () => {
      toast.success('Extension deleted successfully');
      router.push('/dashboard/extensions');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete extension');
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => extensionService.testExtensionConnection(extensionId),
    onSuccess: (data) => {
      setConnectionStatus(data.connected ? 'connected' : 'disconnected');
      toast.success(data.connected ? 'Extension is connected' : 'Extension is not connected');
    },
    onError: (error: any) => {
      setConnectionStatus('disconnected');
      toast.error(error.message || 'Failed to test connection');
    },
  });

  // Generate password mutation
  const generatePasswordMutation = useMutation({
    mutationFn: () => extensionService.generatePassword(),
    onSuccess: (data) => {
      // Password is not part of Extension interface, just show it
      // setFormData({ ...formData, password: data.password });
      setPlainPassword(data.password);
      setShowPassword(true);
      toast.success('New password generated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate password');
    },
  });

  // Reboot extension mutation
  const rebootMutation = useMutation({
    mutationFn: () => extensionService.rebootExtension(extensionId),
    onSuccess: () => {
      toast.success('Extension reboot command sent');
      queryClient.invalidateQueries({ queryKey: ['extension-registration', extensionId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reboot extension');
    },
  });

  // Initialize form data when extension loads
  useEffect(() => {
    if (extension && !isEditing) {
      setFormData({
        extensionNumber: extension.extensionNumber,
        domainId: extension.domainId,
        displayName: extension.displayName || '',
        description: extension.description || '',
        password: extension.password || '',
        effectiveCallerIdName: extension.effectiveCallerIdName || '',
        effectiveCallerIdNumber: extension.effectiveCallerIdNumber || '',
        isActive: extension.isActive,
        // Set default values for additional form fields
        context: 'default',
        // Map features from backend response
        recordCalls: extension.directorySettings?.recording?.enabled || false,
        recordingMode: extension.directorySettings?.recording?.mode || 'all',
        voicemailEnabled: extension.voicemailSettings?.enabled || false,
        dndEnabled: extension.directorySettings?.dnd?.enabled || false,
        callForwardEnabled: extension.directorySettings?.callForward?.enabled || false,
      });
    }
  }, [extension, isEditing]);

  // Helper functions

  const getRegistrationIcon = () => {
    if (!registration) return <WifiOff className="h-4 w-4 text-gray-400" />;
    
    if (registration.isRegistered) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getSignalStrengthIcon = (strength: number) => {
    if (strength >= 80) return <SignalHigh className="h-4 w-4 text-green-500" />;
    if (strength >= 60) return <SignalMedium className="h-4 w-4 text-yellow-500" />;
    if (strength >= 40) return <SignalLow className="h-4 w-4 text-orange-500" />;
    return <Signal className="h-4 w-4 text-red-500" />;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const copyPasswordToClipboard = () => {
    if (plainPassword) {
      navigator.clipboard.writeText(plainPassword);
      toast.success('Password copied to clipboard');
    }
  };

  const testConnection = () => {
    setIsTestingConnection(true);
    testConnectionMutation.mutate();
    setTimeout(() => setIsTestingConnection(false), 2000);
  };

  const handleSave = () => {
    // Transform formData to backend format
    const updateData = {
      extensionNumber: formData.extensionNumber,
      domainId: formData.domainId,
      displayName: formData.displayName,
      description: formData.description,
      password: formData.password,
      effectiveCallerIdName: formData.effectiveCallerIdName,
      effectiveCallerIdNumber: formData.effectiveCallerIdNumber,
      isActive: formData.isActive,
      // Map features to backend format
      directorySettings: {
        recording: {
          enabled: formData.recordCalls || false,
          mode: formData.recordingMode || 'all',
        },
        dnd: {
          enabled: formData.dndEnabled || false,
        },
        callForward: {
          enabled: formData.callForwardEnabled || false,
        },
      },
      voicemailSettings: {
        enabled: formData.voicemailEnabled || false,
      },
    };

    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      extensionNumber: extension?.extensionNumber,
      domainId: extension?.domainId,
      displayName: extension?.displayName || '',
      description: extension?.description || '',
      password: extension?.password || '',
      effectiveCallerIdName: extension?.effectiveCallerIdName || '',
      effectiveCallerIdNumber: extension?.effectiveCallerIdNumber || '',
      isActive: extension?.isActive,
      // Set default values for additional form fields
      context: 'default',
      voicemailEnabled: false,
      dndEnabled: false,
      callForwardEnabled: false,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !extension) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Extension not found</h3>
          <p className="text-gray-500">The extension you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/extensions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Extensions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/extensions" className="hover:text-foreground">
          Extensions
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{extension.extensionNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Extension {extension.extensionNumber}
            </h1>
            <div className="flex items-center space-x-2">
              {getRegistrationIcon()}
              <Badge variant={extension.isActive ? 'default' : 'secondary'}>
                {extension.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-muted-foreground">
              {extension.displayName} • {extension.domainId}
            </p>
            {registration && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Registration:</span>
                <span className={registration.isRegistered ? 'text-green-600' : 'text-red-600'}>
                  {registration.isRegistered ? 'Online' : 'Offline'}
                </span>
                {registration.isRegistered && registration.userAgent && (
                  <span className="text-muted-foreground">• {registration.userAgent}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Network className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => rebootMutation.mutate()}
                disabled={rebootMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reboot
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this extension?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="sip" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>SIP</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Features</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center space-x-2">
            <PhoneCall className="h-4 w-4" />
            <span>Calls</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core extension settings and identification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="extension">Extension Number</Label>
                    <Input
                      id="extension"
                      value={formData.extensionNumber || ''}
                      onChange={(e) => setFormData({ ...formData, extensionNumber: e.target.value })}
                      disabled={!isEditing}
                      placeholder="1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domainId">Domain</Label>
                    <Select
                      value={formData.domainId || ''}
                      onValueChange={(value) => setFormData({ ...formData, domainId: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {domains?.data?.map((domain: any) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    disabled={!isEditing}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Extension description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Caller ID Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Caller ID Settings</CardTitle>
                <CardDescription>
                  Configure how this extension appears to other parties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveCallerIdName">Caller ID Name</Label>
                  <Input
                    id="effectiveCallerIdName"
                    value={formData.effectiveCallerIdName || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveCallerIdName: e.target.value })}
                    disabled={!isEditing}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveCallerIdNumber">Caller ID Number</Label>
                  <Input
                    id="effectiveCallerIdNumber"
                    value={formData.effectiveCallerIdNumber || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveCallerIdNumber: e.target.value })}
                    disabled={!isEditing}
                    placeholder="1001"
                  />
                </div>


              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SIP Tab */}
        <TabsContent value="sip" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SIP Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>SIP Configuration</CardTitle>
                <CardDescription>
                  Session Initiation Protocol settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="context">Context</Label>
                  <Input
                    id="context"
                    value={formData.context || ''}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    disabled={!isEditing}
                    placeholder="default"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxCalls">Max Concurrent Calls</Label>
                    <Input
                      id="maxCalls"
                      type="number"
                      value={formData.maxCalls || 1}
                      onChange={(e) => setFormData({ ...formData, maxCalls: parseInt(e.target.value) })}
                      disabled={!isEditing}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="callTimeout">Call Timeout (seconds)</Label>
                    <Input
                      id="callTimeout"
                      type="number"
                      value={formData.callTimeout || 30}
                      onChange={(e) => setFormData({ ...formData, callTimeout: parseInt(e.target.value) })}
                      disabled={!isEditing}
                      min="10"
                      max="300"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Call Behavior</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="recordCalls">Record Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically record all calls for this extension
                      </p>
                    </div>
                    <Switch
                      id="recordCalls"
                      checked={formData.recordCalls || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, recordCalls: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hangupAfterBridge">Hangup After Bridge</Label>
                      <p className="text-sm text-muted-foreground">
                        Hangup call when bridge ends
                      </p>
                    </div>
                    <Switch
                      id="hangupAfterBridge"
                      checked={formData.hangupAfterBridge || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, hangupAfterBridge: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="continueOnFail">Continue on Fail</Label>
                      <p className="text-sm text-muted-foreground">
                        Continue dialplan execution on failure
                      </p>
                    </div>
                    <Switch
                      id="continueOnFail"
                      checked={formData.continueOnFail || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, continueOnFail: checked })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Information */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
                <CardDescription>
                  Current SIP registration status and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {registration ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getRegistrationIcon()}
                        <span className={registration.isRegistered ? 'text-green-600' : 'text-red-600'}>
                          {registration.isRegistered ? 'Registered' : 'Not Registered'}
                        </span>
                      </div>
                    </div>

                    {registration.isRegistered && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">IP Address:</span>
                          <span className="text-sm font-mono">{registration.registrationIp || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">User Agent:</span>
                          <span className="text-sm">{registration.userAgent || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Last Registration:</span>
                          <span className="text-sm">
                            {registration.lastRegistration
                              ? new Date(registration.lastRegistration).toLocaleString()
                              : 'N/A'
                            }
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Expires:</span>
                          <span className="text-sm">
                            {registration.expires
                              ? new Date(registration.expires).toLocaleString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testConnection}
                        disabled={isTestingConnection}
                        className="flex-1"
                      >
                        {isTestingConnection ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Network className="h-4 w-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rebootMutation.mutate()}
                        disabled={rebootMutation.isPending}
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reboot
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <WifiOff className="h-8 w-8 mx-auto mb-2" />
                    <p>No registration information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Call Features */}
            <Card>
              <CardHeader>
                <CardTitle>Call Features</CardTitle>
                <CardDescription>
                  Advanced calling features and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Recording */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Call Recording
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Call Recording</Label>
                      <p className="text-sm text-muted-foreground">
                        Record all calls for this extension
                      </p>
                    </div>
                    <Switch
                      checked={formData.recordCalls || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, recordCalls: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  {formData.recordCalls && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="recordingMode">Recording Mode</Label>
                      <Select
                        value={(formData as any).recordingMode || 'all'}
                        onValueChange={(value) => setFormData({ ...formData, recordingMode: value } as any)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Calls</SelectItem>
                          <SelectItem value="inbound">Inbound Only</SelectItem>
                          <SelectItem value="outbound">Outbound Only</SelectItem>
                          <SelectItem value="none">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Voicemail */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center">
                    <Mic className="h-4 w-4 mr-2" />
                    Voicemail
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Voicemail</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow callers to leave voicemail messages
                      </p>
                    </div>
                    <Switch
                      checked={formData.voicemailEnabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, voicemailEnabled: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  {formData.voicemailEnabled && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="voicemailPin">Voicemail PIN</Label>
                      <Input
                        id="voicemailPin"
                        type="password"
                        value={formData.voicemailPin || ''}
                        onChange={(e) => setFormData({ ...formData, voicemailPin: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter 4-6 digit PIN"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Do Not Disturb */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center">
                    <BellOff className="h-4 w-4 mr-2" />
                    Do Not Disturb
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable DND</Label>
                      <p className="text-sm text-muted-foreground">
                        Block incoming calls when enabled
                      </p>
                    </div>
                    <Switch
                      checked={formData.dndEnabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, dndEnabled: checked })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Forwarding */}
            <Card>
              <CardHeader>
                <CardTitle>Call Forwarding</CardTitle>
                <CardDescription>
                  Configure call forwarding rules and destinations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Forward Always */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Forward All Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Forward all incoming calls to another number
                      </p>
                    </div>
                    <Switch
                      checked={formData.callForwardEnabled || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, callForwardEnabled: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  {formData.callForwardEnabled && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="callForwardNumber">Forward to Number</Label>
                      <Input
                        id="callForwardNumber"
                        value={formData.callForwardNumber || ''}
                        onChange={(e) => setFormData({ ...formData, callForwardNumber: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Call Forward on Busy */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Forward on Busy</Label>
                      <p className="text-sm text-muted-foreground">
                        Forward calls when extension is busy
                      </p>
                    </div>
                    <Switch
                      checked={formData.callForwardOnBusy || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, callForwardOnBusy: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  {formData.callForwardOnBusy && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="callForwardBusyNumber">Forward to Number</Label>
                      <Input
                        id="callForwardBusyNumber"
                        value={formData.callForwardBusyNumber || ''}
                        onChange={(e) => setFormData({ ...formData, callForwardBusyNumber: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Call Forward on No Answer */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Forward on No Answer</Label>
                      <p className="text-sm text-muted-foreground">
                        Forward calls when not answered
                      </p>
                    </div>
                    <Switch
                      checked={formData.callForwardOnNoAnswer || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, callForwardOnNoAnswer: checked })}
                      disabled={!isEditing}
                    />
                  </div>

                  {formData.callForwardOnNoAnswer && (
                    <div className="space-y-4 ml-4">
                      <div className="space-y-2">
                        <Label htmlFor="callForwardNoAnswerNumber">Forward to Number</Label>
                        <Input
                          id="callForwardNoAnswerNumber"
                          value={formData.callForwardNoAnswerNumber || ''}
                          onChange={(e) => setFormData({ ...formData, callForwardNoAnswerNumber: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="callForwardTimeout">Timeout (seconds)</Label>
                        <Input
                          id="callForwardTimeout"
                          type="number"
                          value={formData.callForwardTimeout || 20}
                          onChange={(e) => setFormData({ ...formData, callForwardTimeout: parseInt(e.target.value) })}
                          disabled={!isEditing}
                          min="5"
                          max="60"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle>Password Management</CardTitle>
                <CardDescription>
                  Manage SIP authentication password for this extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plainPassword && showPassword && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>New Password:</strong>
                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {plainPassword}
                          </code>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyPasswordToClipboard}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPassword(false)}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">SIP Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Password used for SIP authentication
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePasswordMutation.mutate()}
                        disabled={generatePasswordMutation.isPending}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate()}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Security Options</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Strong Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Enforce strong password requirements
                        </p>
                      </div>
                      <Switch
                        checked={(formData as any).requireStrongPassword || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, requireStrongPassword: checked } as any)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Two-Factor Auth</Label>
                        <p className="text-sm text-muted-foreground">
                          Require additional authentication factor
                        </p>
                      </div>
                      <Switch
                        checked={(formData as any).twoFactorEnabled || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, twoFactorEnabled: checked } as any)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Control access permissions and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow International Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Permit calls to international numbers
                      </p>
                    </div>
                    <Switch
                      checked={(formData as any).allowInternational || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowInternational: checked } as any)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Long Distance</Label>
                      <p className="text-sm text-muted-foreground">
                        Permit long distance calls
                      </p>
                    </div>
                    <Switch
                      checked={(formData as any).allowLongDistance || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowLongDistance: checked } as any)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Restrict to Business Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Only allow calls during business hours
                      </p>
                    </div>
                    <Switch
                      checked={(formData as any).businessHoursOnly || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, businessHoursOnly: checked } as any)}
                      disabled={!isEditing}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                    <Textarea
                      id="allowedIPs"
                      value={(formData as any).allowedIPs || ''}
                      onChange={(e) => setFormData({ ...formData, allowedIPs: e.target.value } as any)}
                      disabled={!isEditing}
                      placeholder="Enter IP addresses or ranges (one per line)"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave empty to allow from any IP address
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Registration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="h-5 w-5 mr-2" />
                  Registration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registration ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getRegistrationIcon()}
                        <span className={registration.isRegistered ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {registration.isRegistered ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    {registration.isRegistered && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">IP Address:</span>
                          <span className="text-sm font-mono">{registration.registrationIp || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">User Agent:</span>
                          <span className="text-sm truncate max-w-32" title={registration.userAgent}>
                            {registration.userAgent || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Seen:</span>
                          <span className="text-sm">
                            {registration.lastRegistration
                              ? new Date(registration.lastRegistration).toLocaleString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <WifiOff className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">No registration data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PhoneCall className="h-5 w-5 mr-2" />
                  Call Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Calls:</span>
                      <span className="text-sm font-medium">{stats.totalCalls || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inbound:</span>
                      <span className="text-sm font-medium text-green-600">{stats.inboundCalls || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Outbound:</span>
                      <span className="text-sm font-medium text-blue-600">{stats.outboundCalls || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Missed:</span>
                      <span className="text-sm font-medium text-red-600">{stats.missedCalls || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Duration:</span>
                      <span className="text-sm font-medium">
                        {stats.averageDuration ? formatDuration(stats.averageDuration) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Activity className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">No statistics available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Extension Status:</span>
                    <div className="flex items-center space-x-2">
                      {extension?.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        extension?.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {extension?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Connection Test:</span>
                    <div className="flex items-center space-x-2">
                      {connectionStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {connectionStatus === 'disconnected' && <XCircle className="h-4 w-4 text-red-500" />}
                      {connectionStatus === 'unknown' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                      <span className={`text-sm font-medium ${
                        connectionStatus === 'connected' ? 'text-green-600' :
                        connectionStatus === 'disconnected' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {connectionStatus === 'connected' ? 'Connected' :
                         connectionStatus === 'disconnected' ? 'Disconnected' : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated:</span>
                    <span className="text-sm">{new Date().toLocaleTimeString()}</span>
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testConnection}
                    disabled={isTestingConnection}
                    className="w-full"
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Network className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Real-time Activity
              </CardTitle>
              <CardDescription>
                Live monitoring of extension activity and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Call Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        registration?.isRegistered ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {registration?.isRegistered ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {registration?.isRegistered ? 'Ready to receive calls' : 'Not registered'}
                  </div>
                </div>

                {/* Recent Events */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Events</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {registration?.lastRegistration && (
                      <div className="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Registered from {registration.registrationIp}</span>
                        <span className="text-muted-foreground ml-auto">
                          {new Date(registration.lastRegistration).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {!registration?.isRegistered && (
                      <div className="flex items-center space-x-2 text-sm p-2 bg-red-50 rounded">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Extension offline</span>
                        <span className="text-muted-foreground ml-auto">Current</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <div className="space-y-6">
            {/* Call Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <PhoneCall className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Calls</p>
                      <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inbound</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.inboundCalls || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Outbound</p>
                      <p className="text-2xl font-bold text-blue-600">{stats?.outboundCalls || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <PhoneCall className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Missed</p>
                      <p className="text-2xl font-bold text-red-600">{stats?.missedCalls || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Call History
                </CardTitle>
                <CardDescription>
                  Latest calls for this extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calls && calls.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Date/Time</th>
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Direction</th>
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Number</th>
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Duration</th>
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-2 text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calls.slice(0, 10).map((call: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2 text-sm">
                                {call.startTime ? new Date(call.startTime).toLocaleString() : 'N/A'}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  {call.direction === 'inbound' ? (
                                    <Phone className="h-4 w-4 text-green-500 rotate-180" />
                                  ) : (
                                    <Phone className="h-4 w-4 text-blue-500" />
                                  )}
                                  <span className="text-sm capitalize">{call.direction || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="p-2 text-sm font-mono">
                                {call.direction === 'inbound' ? call.callerNumber : call.destinationNumber}
                              </td>
                              <td className="p-2 text-sm">
                                {call.duration ? formatDuration(call.duration) : 'N/A'}
                              </td>
                              <td className="p-2">
                                <Badge variant={
                                  call.status === 'answered' ? 'default' :
                                  call.status === 'missed' ? 'destructive' :
                                  call.status === 'busy' ? 'secondary' : 'outline'
                                }>
                                  {call.status || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex space-x-1">
                                  {call.recordingPath && (
                                    <Button variant="outline" size="sm">
                                      <PlayCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {calls.length > 10 && (
                      <div className="text-center">
                        <Button variant="outline">
                          View All Calls ({calls.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <PhoneCall className="h-8 w-8 mx-auto mb-2" />
                    <p>No call history available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Call records will appear here once the extension is used
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SIP Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SIP Advanced Settings</CardTitle>
                <CardDescription>
                  Advanced SIP protocol configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sipPort">SIP Port</Label>
                      <Input
                        id="sipPort"
                        type="number"
                        value={(formData as any).sipPort || 5060}
                        onChange={(e) => setFormData({ ...formData, sipPort: parseInt(e.target.value) } as any)}
                        disabled={!isEditing}
                        min="1024"
                        max="65535"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rtpPort">RTP Port Range</Label>
                      <Input
                        id="rtpPort"
                        value={(formData as any).rtpPortRange || '16384-32768'}
                        onChange={(e) => setFormData({ ...formData, rtpPortRange: e.target.value } as any)}
                        disabled={!isEditing}
                        placeholder="16384-32768"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codec">Preferred Codecs</Label>
                    <Input
                      id="codec"
                      value={(formData as any).codecs || 'PCMU,PCMA,G729'}
                      onChange={(e) => setFormData({ ...formData, codecs: e.target.value } as any)}
                      disabled={!isEditing}
                      placeholder="PCMU,PCMA,G729"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dtmfMode">DTMF Mode</Label>
                    <Select
                      value={(formData as any).dtmfMode || 'rfc2833'}
                      onValueChange={(value) => setFormData({ ...formData, dtmfMode: value } as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rfc2833">RFC2833</SelectItem>
                        <SelectItem value="inband">Inband</SelectItem>
                        <SelectItem value="info">SIP INFO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Protocol Options</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable SRTP</Label>
                        <p className="text-sm text-muted-foreground">
                          Secure Real-time Transport Protocol
                        </p>
                      </div>
                      <Switch
                        checked={(formData as any).enableSRTP || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, enableSRTP: checked } as any)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable ICE</Label>
                        <p className="text-sm text-muted-foreground">
                          Interactive Connectivity Establishment
                        </p>
                      </div>
                      <Switch
                        checked={(formData as any).enableICE || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, enableICE: checked } as any)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debugging & Diagnostics */}
            <Card>
              <CardHeader>
                <CardTitle>Debugging & Diagnostics</CardTitle>
                <CardDescription>
                  Tools for troubleshooting and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Debug Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log detailed SIP messages for this extension
                      </p>
                    </div>
                    <Switch
                      checked={(formData as any).debugLogging || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, debugLogging: checked } as any)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={(formData as any).logLevel || 'info'}
                      onValueChange={(value) => setFormData({ ...formData, logLevel: value } as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Diagnostic Tools</h4>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testConnection}
                        disabled={isTestingConnection}
                      >
                        <Network className="h-4 w-4 mr-2" />
                        Test SIP
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rebootMutation.mutate()}
                        disabled={rebootMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reboot
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Extension Information</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extension ID:</span>
                        <span className="font-mono">{extension?.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{extension?.createdAt ? new Date(extension.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{extension?.updatedAt ? new Date(extension.updatedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Raw Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Raw Configuration
              </CardTitle>
              <CardDescription>
                View and edit raw extension configuration (JSON format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    >
                      {showAdvancedSettings ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showAdvancedSettings ? 'Hide' : 'Show'} Raw Config
                    </Button>
                  </div>

                  {showAdvancedSettings && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(extension, null, 2));
                          toast.success('Configuration copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(extension, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `extension-${extension?.extensionNumber}-config.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>

                {showAdvancedSettings && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="text-sm overflow-x-auto">
                      <code>{JSON.stringify(extension, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
