'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  RefreshCw,
  Globe,
  Network,
  Shield,
  Settings,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Radio,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import {
  freeswitchConfigService,
  NetworkConfig,
  SipConfig,
  AclConfig,
  AclRule,
  NetworkDetection,
  MulticastConfig,
  VertoConfig
} from '@/services/freeswitch-config.service';
import SipProfilesPanel from './SipProfilesPanel';
import AdvancedSipPanel from './AdvancedSipPanel';

// Types are now imported from service

export default function FreeSwitchConfigPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [sipProfilesConfig, setSipProfilesConfig] = useState<any>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>({
    external_ip_mode: 'stun',
    external_ip: '',
    bind_server_ip: 'auto',
    rtp_start_port: 16384,
    rtp_end_port: 32768,
  });
  const [sipConfig, setSipConfig] = useState<SipConfig>({
    sip_port: 5060,
    sip_port_tls: 5061,
    sip_domain: 'localhost',
    context: 'default',
    auth_calls: true,
    accept_blind_reg: false,
    accept_blind_auth: false,
  });
  const [detectedIp, setDetectedIp] = useState<string>('');

  // New state for ACL, Multicast, Verto
  const [aclConfig, setAclConfig] = useState<AclConfig>({
    domains: [],
    esl_access: [],
    sip_profiles: []
  });
  const [networkDetection, setNetworkDetection] = useState<NetworkDetection | null>(null);
  const [multicastConfig, setMulticastConfig] = useState<MulticastConfig>({
    address: '225.1.1.1',
    port: 4242,
    bindings: 'all',
    ttl: 1,
    loopback: false
  });
  const [vertoConfig, setVertoConfig] = useState<VertoConfig>({
    enabled: false,
    port: 8081,
    securePort: 8082,
    mcastIp: '224.1.1.1',
    mcastPort: 1337,
    userAuth: true,
    context: 'default',
    outboundCodecs: 'opus,vp8',
    inboundCodecs: 'opus,vp8',
    rtpTimeout: 300,
    rtpHoldTimeout: 1800,
    enable3pcc: true
  });

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Load network configuration using service
      const networkData = await freeswitchConfigService.getNetworkConfig();
      setNetworkConfig(prev => ({ ...prev, ...networkData }));

      // Load SIP configuration using service
      const sipData = await freeswitchConfigService.getSipConfig();
      setSipConfig(prev => ({ ...prev, ...sipData }));

      // Load SIP profiles configuration
      try {
        const sipProfilesData = await freeswitchConfigService.getSipProfiles();
        setSipProfilesConfig(sipProfilesData);
      } catch (error) {
        console.warn('SIP profiles config not found, using defaults');
      }

      // Load ACL configuration
      try {
        const aclData = await freeswitchConfigService.getAclConfig();
        setAclConfig(aclData);
      } catch (error) {
        console.warn('ACL config not found, using defaults');
      }

      // Load Multicast configuration
      try {
        const multicastData = await freeswitchConfigService.getMulticastConfig();
        setMulticastConfig(multicastData);
      } catch (error) {
        console.warn('Multicast config not found, using defaults');
      }

      // Load Verto configuration
      try {
        const vertoData = await freeswitchConfigService.getVertoConfig();
        setVertoConfig(vertoData);
      } catch (error) {
        console.warn('Verto config not found, using defaults');
      }

      toast.success('Configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.error('Failed to load FreeSWITCH configuration');
    } finally {
      setLoading(false);
    }
  };

  const detectExternalIp = async () => {
    setDetecting(true);
    try {
      const ip = await freeswitchConfigService.detectExternalIp();
      setDetectedIp(ip);
      setNetworkConfig(prev => ({ ...prev, external_ip: ip }));
      toast.success(`External IP detected: ${ip}`);
    } catch (error) {
      console.error('Failed to detect external IP:', error);
      toast.error('Failed to detect external IP');
    } finally {
      setDetecting(false);
    }
  };

  const detectNetworkRanges = async () => {
    setDetecting(true);
    try {
      const detection = await freeswitchConfigService.detectNetworkRanges();
      setNetworkDetection(detection);
      toast.success(`Detected ${detection.detectedRanges.length} network ranges`);
    } catch (error) {
      console.error('Failed to detect network ranges:', error);
      toast.error('Failed to detect network ranges');
    } finally {
      setDetecting(false);
    }
  };

  const applyDetectedAcl = async () => {
    setSaving(true);
    try {
      const appliedConfig = await freeswitchConfigService.applyDetectedAcl();
      setAclConfig(appliedConfig);
      toast.success('Detected ACL rules applied successfully');
    } catch (error) {
      console.error('Failed to apply detected ACL:', error);
      toast.error('Failed to apply detected ACL rules');
    } finally {
      setSaving(false);
    }
  };

  const addAclRule = (listName: keyof AclConfig) => {
    const newRule: AclRule = {
      type: 'allow',
      cidr: '',
      description: ''
    };
    setAclConfig(prev => ({
      ...prev,
      [listName]: [...prev[listName], newRule]
    }));
  };

  const removeAclRule = (listName: keyof AclConfig, index: number) => {
    setAclConfig(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const updateAclRule = (listName: keyof AclConfig, index: number, field: keyof AclRule, value: string) => {
    setAclConfig(prev => ({
      ...prev,
      [listName]: prev[listName].map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const saveNetworkConfig = async () => {
    setSaving(true);
    try {
      await freeswitchConfigService.updateNetworkConfig(networkConfig);
      toast.success('Network configuration saved successfully');
      toast.info('FreeSWITCH restart required for changes to take effect');
    } catch (error) {
      console.error('Failed to save network configuration:', error);
      toast.error('Failed to save network configuration');
    } finally {
      setSaving(false);
    }
  };

  const applyConfiguration = async () => {
    setSaving(true);
    try {
      // Update network configuration
      await freeswitchConfigService.updateNetworkConfig(networkConfig);

      // Update SIP profiles configuration if changed
      if (sipProfilesConfig) {
        console.log('Sending SIP profiles config:', sipProfilesConfig);
        try {
          await freeswitchConfigService.updateSipProfiles(sipProfilesConfig);
          console.log('SIP profiles config sent successfully');
        } catch (error) {
          console.error('Failed to send SIP profiles config:', error);
          throw error;
        }
      } else {
        console.log('No SIP profiles config to send');
      }

      // Update ACL configuration
      await freeswitchConfigService.updateAclConfig(aclConfig);

      // Update Multicast configuration
      await freeswitchConfigService.updateMulticastConfig(multicastConfig);

      // Update Verto configuration
      await freeswitchConfigService.updateVertoConfig(vertoConfig);

      // Apply all configurations to FreeSWITCH
      await freeswitchConfigService.applyConfiguration();

      toast.success('All configurations applied to FreeSWITCH successfully');
    } catch (error) {
      console.error('Failed to apply configuration:', error);
      toast.error('Failed to apply configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading FreeSWITCH configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FreeSWITCH Configuration</h2>
          <p className="text-muted-foreground">
            Configure FreeSWITCH network, SIP, and security settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfiguration} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={applyConfiguration} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Apply Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="network" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="sip" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SIP
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            SIP Profiles
          </TabsTrigger>
          <TabsTrigger value="advanced-sip" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Advanced SIP
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>
                Configure external IP detection and RTP port ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="external_ip_mode">External IP Mode</Label>
                  <Select
                    value={networkConfig.external_ip_mode}
                    onValueChange={(value: 'auto' | 'stun' | 'manual') =>
                      setNetworkConfig(prev => ({ ...prev, external_ip_mode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stun">STUN Server (Recommended)</SelectItem>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="manual">Manual IP</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {networkConfig.external_ip_mode === 'stun' && 'Use STUN server for NAT traversal'}
                    {networkConfig.external_ip_mode === 'auto' && 'Automatically detect external IP'}
                    {networkConfig.external_ip_mode === 'manual' && 'Manually specify external IP'}
                  </p>
                </div>

                {networkConfig.external_ip_mode === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="external_ip">External IP Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="external_ip"
                        value={networkConfig.external_ip || ''}
                        onChange={(e) =>
                          setNetworkConfig(prev => ({ ...prev, external_ip: e.target.value }))
                        }
                        placeholder="e.g., 203.0.113.1"
                      />
                      <Button
                        variant="outline"
                        onClick={detectExternalIp}
                        disabled={detecting}
                      >
                        {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Detect'}
                      </Button>
                    </div>
                    {detectedIp && (
                      <p className="text-sm text-green-600">
                        Detected IP: {detectedIp}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rtp_start_port">RTP Start Port</Label>
                  <Input
                    id="rtp_start_port"
                    type="number"
                    value={networkConfig.rtp_start_port}
                    onChange={(e) =>
                      setNetworkConfig(prev => ({ ...prev, rtp_start_port: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtp_end_port">RTP End Port</Label>
                  <Input
                    id="rtp_end_port"
                    type="number"
                    value={networkConfig.rtp_end_port}
                    onChange={(e) =>
                      setNetworkConfig(prev => ({ ...prev, rtp_end_port: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> Changes to network configuration require FreeSWITCH restart to take effect.
                  Make sure the RTP port range is properly configured in your firewall.
                </AlertDescription>
              </Alert>

              <Button onClick={saveNetworkConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Network Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sip">
          <Card>
            <CardHeader>
              <CardTitle>SIP Configuration</CardTitle>
              <CardDescription>
                Configure SIP domain, ports, and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sip_domain">SIP Domain</Label>
                  <Input
                    id="sip_domain"
                    value={sipConfig.sip_domain}
                    onChange={(e) =>
                      setSipConfig(prev => ({ ...prev, sip_domain: e.target.value }))
                    }
                    placeholder="e.g., pbx.company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Default Context</Label>
                  <Input
                    id="context"
                    value={sipConfig.context}
                    onChange={(e) =>
                      setSipConfig(prev => ({ ...prev, context: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sip_port">SIP Port (UDP/TCP)</Label>
                  <Input
                    id="sip_port"
                    type="number"
                    value={sipConfig.sip_port}
                    onChange={(e) =>
                      setSipConfig(prev => ({ ...prev, sip_port: parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sip_port_tls">SIP TLS Port</Label>
                  <Input
                    id="sip_port_tls"
                    type="number"
                    value={sipConfig.sip_port_tls}
                    onChange={(e) =>
                      setSipConfig(prev => ({ ...prev, sip_port_tls: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Authentication Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Authentication for Calls</Label>
                      <p className="text-sm text-muted-foreground">
                        Require users to authenticate before making calls
                      </p>
                    </div>
                    <Switch
                      checked={sipConfig.auth_calls}
                      onCheckedChange={(checked) =>
                        setSipConfig(prev => ({ ...prev, auth_calls: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Accept Blind Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow registration without authentication (not recommended)
                      </p>
                    </div>
                    <Switch
                      checked={sipConfig.accept_blind_reg}
                      onCheckedChange={(checked) =>
                        setSipConfig(prev => ({ ...prev, accept_blind_reg: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Accept Blind Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow authentication without registration (not recommended)
                      </p>
                    </div>
                    <Switch
                      checked={sipConfig.accept_blind_auth}
                      onCheckedChange={(checked) =>
                        setSipConfig(prev => ({ ...prev, accept_blind_auth: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <SipProfilesPanel onConfigChange={(config) => {
            setSipProfilesConfig(config);
            console.log('SIP Profiles config changed:', config);
          }} />
        </TabsContent>

        <TabsContent value="advanced-sip">
          <AdvancedSipPanel onConfigChange={(config) => {
            console.log('Advanced SIP config changed:', config);
          }} />
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            {/* Network Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Network Detection
                </CardTitle>
                <CardDescription>
                  Automatically detect network interfaces and generate ACL rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={detectNetworkRanges}
                    disabled={detecting}
                    variant="outline"
                  >
                    {detecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Detect Networks
                  </Button>
                  <Button
                    onClick={applyDetectedAcl}
                    disabled={saving || !networkDetection}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Apply Detected Rules
                  </Button>
                </div>

                {networkDetection && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Detected Interfaces:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {networkDetection.interfaces.map((iface, index) => (
                          <Badge key={index} variant="secondary" className="justify-start">
                            {iface.ip}/{iface.prefix} ({iface.network})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Suggested ACL Rules:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {networkDetection.detectedRanges.map((range, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                            {range.type} {range.cidr}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ACL Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Control Lists (ACL)
                </CardTitle>
                <CardDescription>
                  Configure network access rules for different FreeSWITCH components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="domains" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="domains">Domains</TabsTrigger>
                    <TabsTrigger value="esl">ESL Access</TabsTrigger>
                    <TabsTrigger value="sip">SIP Profiles</TabsTrigger>
                  </TabsList>

                  {(['domains', 'esl_access', 'sip_profiles'] as const).map((listName) => (
                    <TabsContent key={listName} value={listName === 'esl_access' ? 'esl' : listName === 'sip_profiles' ? 'sip' : listName}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">
                            {listName === 'domains' ? 'Domain Access Rules' :
                             listName === 'esl_access' ? 'ESL Access Rules' :
                             'SIP Profile Access Rules'}
                          </h4>
                          <Button
                            size="sm"
                            onClick={() => addAclRule(listName)}
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Rule
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {aclConfig[listName].map((rule, index) => (
                            <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                              <Select
                                value={rule.type}
                                onValueChange={(value: 'allow' | 'deny') => updateAclRule(listName, index, 'type', value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="allow">Allow</SelectItem>
                                  <SelectItem value="deny">Deny</SelectItem>
                                </SelectContent>
                              </Select>

                              <Input
                                placeholder="192.168.1.0/24"
                                value={rule.cidr}
                                onChange={(e) => updateAclRule(listName, index, 'cidr', e.target.value)}
                                className="flex-1"
                              />

                              <Input
                                placeholder="Description (optional)"
                                value={rule.description || ''}
                                onChange={(e) => updateAclRule(listName, index, 'description', e.target.value)}
                                className="flex-1"
                              />

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeAclRule(listName, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {aclConfig[listName].length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No ACL rules configured. Click "Add Rule" to get started.
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            {/* Event Multicast Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Event Multicast
                </CardTitle>
                <CardDescription>
                  Configure multicast event distribution for FreeSWITCH clustering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="multicast_address">Multicast Address</Label>
                    <Input
                      id="multicast_address"
                      value={multicastConfig.address}
                      onChange={(e) => setMulticastConfig(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="225.1.1.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multicast_port">Port</Label>
                    <Input
                      id="multicast_port"
                      type="number"
                      value={multicastConfig.port}
                      onChange={(e) => setMulticastConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      placeholder="4242"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multicast_bindings">Event Bindings</Label>
                    <Input
                      id="multicast_bindings"
                      value={multicastConfig.bindings}
                      onChange={(e) => setMulticastConfig(prev => ({ ...prev, bindings: e.target.value }))}
                      placeholder="all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multicast_ttl">TTL (Time To Live)</Label>
                    <Input
                      id="multicast_ttl"
                      type="number"
                      min="1"
                      max="255"
                      value={multicastConfig.ttl}
                      onChange={(e) => setMulticastConfig(prev => ({ ...prev, ttl: parseInt(e.target.value) }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multicast_loopback"
                      checked={multicastConfig.loopback || false}
                      onCheckedChange={(checked) => setMulticastConfig(prev => ({ ...prev, loopback: checked }))}
                    />
                    <Label htmlFor="multicast_loopback">Enable Loopback</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multicast_psk">Pre-Shared Key (Optional)</Label>
                    <Input
                      id="multicast_psk"
                      type="password"
                      value={multicastConfig.psk || ''}
                      onChange={(e) => setMulticastConfig(prev => ({ ...prev, psk: e.target.value }))}
                      placeholder="Enter PSK for encryption"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verto WebRTC Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Verto WebRTC
                </CardTitle>
                <CardDescription>
                  Configure WebRTC endpoint for browser-based calling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="verto_enabled"
                    checked={vertoConfig.enabled}
                    onCheckedChange={(checked) => setVertoConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="verto_enabled">Enable Verto WebRTC</Label>
                </div>

                {vertoConfig.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="verto_port">WebSocket Port</Label>
                        <Input
                          id="verto_port"
                          type="number"
                          value={vertoConfig.port}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                          placeholder="8081"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_secure_port">Secure WebSocket Port (WSS)</Label>
                        <Input
                          id="verto_secure_port"
                          type="number"
                          value={vertoConfig.securePort}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, securePort: parseInt(e.target.value) }))}
                          placeholder="8082"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_mcast_ip">Multicast IP</Label>
                        <Input
                          id="verto_mcast_ip"
                          value={vertoConfig.mcastIp}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, mcastIp: e.target.value }))}
                          placeholder="224.1.1.1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_mcast_port">Multicast Port</Label>
                        <Input
                          id="verto_mcast_port"
                          type="number"
                          value={vertoConfig.mcastPort}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, mcastPort: parseInt(e.target.value) }))}
                          placeholder="1337"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_context">Dialplan Context</Label>
                        <Input
                          id="verto_context"
                          value={vertoConfig.context}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, context: e.target.value }))}
                          placeholder="default"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_outbound_codecs">Outbound Codecs</Label>
                        <Input
                          id="verto_outbound_codecs"
                          value={vertoConfig.outboundCodecs}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, outboundCodecs: e.target.value }))}
                          placeholder="opus,vp8"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_inbound_codecs">Inbound Codecs</Label>
                        <Input
                          id="verto_inbound_codecs"
                          value={vertoConfig.inboundCodecs}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, inboundCodecs: e.target.value }))}
                          placeholder="opus,vp8"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_rtp_timeout">RTP Timeout (seconds)</Label>
                        <Input
                          id="verto_rtp_timeout"
                          type="number"
                          min="30"
                          max="3600"
                          value={vertoConfig.rtpTimeout}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, rtpTimeout: parseInt(e.target.value) }))}
                          placeholder="300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verto_rtp_hold_timeout">RTP Hold Timeout (seconds)</Label>
                        <Input
                          id="verto_rtp_hold_timeout"
                          type="number"
                          min="60"
                          max="7200"
                          value={vertoConfig.rtpHoldTimeout}
                          onChange={(e) => setVertoConfig(prev => ({ ...prev, rtpHoldTimeout: parseInt(e.target.value) }))}
                          placeholder="1800"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="verto_user_auth"
                          checked={vertoConfig.userAuth}
                          onCheckedChange={(checked) => setVertoConfig(prev => ({ ...prev, userAuth: checked }))}
                        />
                        <Label htmlFor="verto_user_auth">Require User Authentication</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="verto_enable_3pcc"
                          checked={vertoConfig.enable3pcc}
                          onCheckedChange={(checked) => setVertoConfig(prev => ({ ...prev, enable3pcc: checked }))}
                        />
                        <Label htmlFor="verto_enable_3pcc">Enable 3PCC (Third Party Call Control)</Label>
                      </div>
                    </div>
                  </>
                )}

                {!vertoConfig.enabled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Verto WebRTC is disabled. Enable it to configure browser-based calling features.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
