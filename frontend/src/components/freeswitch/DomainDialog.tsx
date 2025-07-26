'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Building2, Users, Phone, Settings, Globe, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { domainService, Domain, CreateDomainData, UpdateDomainData } from '@/services/domain.service';

interface DomainDialogProps {
  domain?: Domain | null;
  open: boolean;
  onClose: () => void;
}

interface DomainFormData {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  maxUsers: number;
  maxExtensions: number;
  maxConcurrentCalls: number;
  adminEmail: string;
  adminPhone: string;
  timezone: string;
  language: string;
  settings: {
    recording_enabled: boolean;
    voicemail_enabled: boolean;
    registration_required: boolean;
    allow_anonymous_calls: boolean;
    default_gateway: string;
    default_areacode: string;
  };
  billingSettings: {
    billing_enabled: boolean;
    billing_plan: string;
    currency: string;
    cost_center: string;
  };
}

export function DomainDialog({ domain, open, onClose }: DomainDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<DomainFormData>({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    maxUsers: 100,
    maxExtensions: 1000,
    maxConcurrentCalls: 50,
    adminEmail: '',
    adminPhone: '',
    timezone: 'UTC',
    language: 'en',
    settings: {
      recording_enabled: true,
      voicemail_enabled: true,
      registration_required: true,
      allow_anonymous_calls: false,
      default_gateway: '',
      default_areacode: '',
    },
    billingSettings: {
      billing_enabled: false,
      billing_plan: 'basic',
      currency: 'USD',
      cost_center: '',
    },
  });

  // Reset form when dialog opens/closes or domain changes
  useEffect(() => {
    if (open) {
      if (domain) {
        // Edit mode - populate with domain data
        setFormData({
          name: domain.name,
          displayName: domain.displayName || '',
          description: domain.description || '',
          isActive: domain.isActive,
          maxUsers: domain.maxUsers,
          maxExtensions: domain.maxExtensions,
          maxConcurrentCalls: (domain as any).maxConcurrentCalls || 50,
          adminEmail: domain.adminEmail,
          adminPhone: domain.adminPhone || '',
          timezone: (domain as any).timezone || 'UTC',
          language: (domain as any).language || 'en',
          settings: {
            recording_enabled: domain.settings?.recording_enabled ?? true,
            voicemail_enabled: domain.settings?.voicemail_enabled ?? true,
            registration_required: domain.settings?.registration_required ?? true,
            allow_anonymous_calls: domain.settings?.allow_anonymous_calls ?? false,
            default_gateway: domain.settings?.default_gateway || '',
            default_areacode: domain.settings?.default_areacode || '',
          },
          billingSettings: {
            billing_enabled: (domain as any).billingSettings?.billing_enabled ?? false,
            billing_plan: domain.billingPlan || 'basic',
            currency: (domain as any).billingSettings?.currency || 'USD',
            cost_center: domain.costCenter || '',
          },
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          displayName: '',
          description: '',
          isActive: true,
          maxUsers: 100,
          maxExtensions: 1000,
          maxConcurrentCalls: 50,
          adminEmail: '',
          adminPhone: '',
          timezone: 'UTC',
          language: 'en',
          settings: {
            recording_enabled: true,
            voicemail_enabled: true,
            registration_required: true,
            allow_anonymous_calls: false,
            default_gateway: '',
            default_areacode: '',
          },
          billingSettings: {
            billing_enabled: false,
            billing_plan: 'basic',
            currency: 'USD',
            cost_center: '',
          },
        });
      }
      setActiveTab('general');
    }
  }, [domain, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDomainData) => domainService.createDomain(data),
    onSuccess: () => {
      toast.success('Domain created successfully');
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating domain:', error);
      toast.error(error.message || 'Failed to create domain');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDomainData }) =>
      domainService.updateDomain(id, data),
    onSuccess: () => {
      toast.success('Domain updated successfully');
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating domain:', error);
      toast.error(error.message || 'Failed to update domain');
    },
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name || !formData.displayName || !formData.adminEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate domain name format (basic check)
    if (!domain && !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(formData.name)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    const submitData = {
      name: formData.name,
      displayName: formData.displayName,
      description: formData.description,
      isActive: formData.isActive,
      maxUsers: formData.maxUsers,
      maxExtensions: formData.maxExtensions,
      maxConcurrentCalls: formData.maxConcurrentCalls,
      adminEmail: formData.adminEmail,
      adminPhone: formData.adminPhone,
      timezone: formData.timezone,
      language: formData.language,
      settings: formData.settings,
      billingSettings: formData.billingSettings,
    };

    if (domain) {
      updateMutation.mutate({ id: domain.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {domain ? 'Edit Domain' : 'Create New Domain'}
          </DialogTitle>
          <DialogDescription>
            {domain 
              ? 'Update domain configuration and settings.'
              : 'Create a new domain with multi-tenant capabilities and enterprise features.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Limits
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Configure basic domain properties and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Domain Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="company.local"
                      disabled={!!domain} // Disable editing domain name for existing domains
                    />
                    <p className="text-xs text-muted-foreground">
                      {domain ? 'Domain name cannot be changed' : 'Use a valid domain format (e.g., company.local)'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Domain description and purpose..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@company.local"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Domain is active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Limits</CardTitle>
                <CardDescription>Configure maximum resource allocations for this domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of users in this domain</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExtensions">Max Extensions</Label>
                    <Input
                      id="maxExtensions"
                      type="number"
                      min="1"
                      max="100000"
                      value={formData.maxExtensions}
                      onChange={(e) => setFormData({ ...formData, maxExtensions: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of extensions</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentCalls">Max Concurrent Calls</Label>
                    <Input
                      id="maxConcurrentCalls"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.maxConcurrentCalls}
                      onChange={(e) => setFormData({ ...formData, maxConcurrentCalls: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Maximum simultaneous calls</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Resource Utilization Guidelines</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recommended Users:</span>
                        <span>{Math.floor(formData.maxUsers * 0.8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recommended Extensions:</span>
                        <span>{Math.floor(formData.maxExtensions * 0.8)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak Calls:</span>
                        <span>{Math.floor(formData.maxConcurrentCalls * 0.7)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Safety Buffer:</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">FreeSWITCH Settings</CardTitle>
                <CardDescription>Configure domain-specific FreeSWITCH behavior and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call Features
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="recording_enabled"
                        checked={formData.settings.recording_enabled}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, recording_enabled: checked }
                        })}
                      />
                      <Label htmlFor="recording_enabled">Enable Call Recording</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="voicemail_enabled"
                        checked={formData.settings.voicemail_enabled}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, voicemail_enabled: checked }
                        })}
                      />
                      <Label htmlFor="voicemail_enabled">Enable Voicemail</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="registration_required"
                        checked={formData.settings.registration_required}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, registration_required: checked }
                        })}
                      />
                      <Label htmlFor="registration_required">Require Registration</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow_anonymous_calls"
                        checked={formData.settings.allow_anonymous_calls}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, allow_anonymous_calls: checked }
                        })}
                      />
                      <Label htmlFor="allow_anonymous_calls">Allow Anonymous Calls</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Gateway Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default_gateway">Default Gateway</Label>
                      <Input
                        id="default_gateway"
                        value={formData.settings.default_gateway}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, default_gateway: e.target.value }
                        })}
                        placeholder="gateway.provider.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default_areacode">Default Area Code</Label>
                      <Input
                        id="default_areacode"
                        value={formData.settings.default_areacode}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, default_areacode: e.target.value }
                        })}
                        placeholder="555"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Configuration</CardTitle>
                <CardDescription>Configure billing settings and cost management for this domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="billing_enabled"
                    checked={formData.billingSettings.billing_enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      billingSettings: { ...formData.billingSettings, billing_enabled: checked }
                    })}
                  />
                  <Label htmlFor="billing_enabled">Enable Billing</Label>
                </div>

                {formData.billingSettings.billing_enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing_plan">Billing Plan</Label>
                        <Select
                          value={formData.billingSettings.billing_plan}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            billingSettings: { ...formData.billingSettings, billing_plan: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Plan</SelectItem>
                            <SelectItem value="professional">Professional Plan</SelectItem>
                            <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                            <SelectItem value="custom">Custom Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.billingSettings.currency}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            billingSettings: { ...formData.billingSettings, currency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost_center">Cost Center</Label>
                      <Input
                        id="cost_center"
                        value={formData.billingSettings.cost_center}
                        onChange={(e) => setFormData({
                          ...formData,
                          billingSettings: { ...formData.billingSettings, cost_center: e.target.value }
                        })}
                        placeholder="CC-001"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cost center code for accounting and reporting purposes
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h5 className="text-sm font-medium mb-2">Billing Plan Features</h5>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {formData.billingSettings.billing_plan === 'basic' && (
                          <>
                            <div>• Up to 50 users</div>
                            <div>• Basic call features</div>
                            <div>• Email support</div>
                          </>
                        )}
                        {formData.billingSettings.billing_plan === 'professional' && (
                          <>
                            <div>• Up to 200 users</div>
                            <div>• Advanced call features</div>
                            <div>• Call recording & analytics</div>
                            <div>• Priority support</div>
                          </>
                        )}
                        {formData.billingSettings.billing_plan === 'enterprise' && (
                          <>
                            <div>• Unlimited users</div>
                            <div>• All features included</div>
                            <div>• Custom integrations</div>
                            <div>• 24/7 dedicated support</div>
                          </>
                        )}
                        {formData.billingSettings.billing_plan === 'custom' && (
                          <div>• Custom feature set based on requirements</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {domain ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {domain ? 'Update Domain' : 'Create Domain'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
