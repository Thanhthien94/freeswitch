'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Network,
  Shield,
  Settings,
  Phone,
  Globe,
  Wifi,
  Server,
  CheckCircle,
  RefreshCw,
  TestTube,
  Play,
  Square,
  Save,
  RotateCcw
} from 'lucide-react';
import { freeswitchConfigService, SipProfileConfig as ServiceSipProfileConfig } from '@/services/freeswitch-config.service';

interface SipProfileConfig {
  // Basic Settings
  name: string;
  enabled: boolean;
  description: string;
  
  // Network Settings
  sip_ip: string;
  sip_port: number;
  sip_port_tls: number;
  rtp_ip: string;
  ext_rtp_ip: string;
  ext_sip_ip: string;
  
  // RTP Settings
  rtp_start_port: number;
  rtp_end_port: number;
  rtp_timer_name: string;
  rtp_timeout_sec: number;
  rtp_hold_timeout_sec: number;
  
  // Security Settings
  auth_calls: boolean;
  accept_blind_reg: boolean;
  accept_blind_auth: boolean;
  apply_inbound_acl: string;
  apply_register_acl: string;
  
  // Advanced Settings
  context: string;
  dialplan: string;
  dtmf_duration: number;
  codec_prefs: string;
  inbound_codec_prefs: string;
  outbound_codec_prefs: string;
  
  // NAT Settings
  nat_options_ping: boolean;
  aggressive_nat_detection: boolean;
  stun_enabled: boolean;
  stun_auto_disable: boolean;
}

interface SipProfilesPanelProps {
  onConfigChange?: (config: any) => void;
}

const defaultInternalProfile: SipProfileConfig = {
  name: 'internal',
  enabled: true,
  description: 'Internal SIP profile for local extensions',
  sip_ip: '0.0.0.0',
  sip_port: 5060,
  sip_port_tls: 5061,
  rtp_ip: '0.0.0.0',
  ext_rtp_ip: 'auto-nat',
  ext_sip_ip: 'auto-nat',
  rtp_start_port: 16384,
  rtp_end_port: 16484,
  rtp_timer_name: 'soft',
  rtp_timeout_sec: 300,
  rtp_hold_timeout_sec: 1800,
  auth_calls: true,
  accept_blind_reg: false,
  accept_blind_auth: false,
  apply_inbound_acl: 'domains',
  apply_register_acl: 'domains',
  context: 'default',
  dialplan: 'XML',
  dtmf_duration: 2000,
  codec_prefs: 'OPUS,G722,PCMU,PCMA',
  inbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  outbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  nat_options_ping: true,
  aggressive_nat_detection: true,
  stun_enabled: true,
  stun_auto_disable: false,
};

const defaultExternalProfile: SipProfileConfig = {
  name: 'external',
  enabled: true,
  description: 'External SIP profile for outbound calls and providers',
  sip_ip: '0.0.0.0',
  sip_port: 5080,
  sip_port_tls: 5081,
  rtp_ip: '0.0.0.0',
  ext_rtp_ip: 'auto-nat',
  ext_sip_ip: 'auto-nat',
  rtp_start_port: 16384,
  rtp_end_port: 16484,
  rtp_timer_name: 'soft',
  rtp_timeout_sec: 300,
  rtp_hold_timeout_sec: 1800,
  auth_calls: false,
  accept_blind_reg: false,
  accept_blind_auth: false,
  apply_inbound_acl: 'providers',
  apply_register_acl: 'providers',
  context: 'public',
  dialplan: 'XML',
  dtmf_duration: 2000,
  codec_prefs: 'OPUS,G722,PCMU,PCMA',
  inbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  outbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  nat_options_ping: true,
  aggressive_nat_detection: true,
  stun_enabled: true,
  stun_auto_disable: false,
};

export default function SipProfilesPanel({ onConfigChange }: SipProfilesPanelProps) {
  const [internalProfile, setInternalProfile] = useState<SipProfileConfig>(defaultInternalProfile);
  const [externalProfile, setExternalProfile] = useState<SipProfileConfig>(defaultExternalProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    internal: 'unknown' | 'running' | 'stopped' | 'error';
    external: 'unknown' | 'running' | 'stopped' | 'error';
  }>({
    internal: 'unknown',
    external: 'unknown'
  });

  // Load current configuration
  useEffect(() => {
    loadConfiguration();
    checkProfileStatus();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await freeswitchConfigService.getSipProfiles();
      // Convert service types to local types
      setInternalProfile({
        ...response.internal,
        // Map any additional fields if needed
      } as SipProfileConfig);
      setExternalProfile({
        ...response.external,
        // Map any additional fields if needed
      } as SipProfileConfig);

      toast.success('SIP profiles configuration loaded');
    } catch (error) {
      console.error('Failed to load SIP profiles:', error);
      toast.error('Failed to load SIP profiles configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      await freeswitchConfigService.updateSipProfiles({
        internal: internalProfile,
        external: externalProfile
      });

      onConfigChange?.({ internal: internalProfile, external: externalProfile });
      toast.success('SIP profiles configuration saved successfully');
    } catch (error) {
      console.error('Failed to save SIP profiles:', error);
      toast.error('Failed to save SIP profiles configuration');
    } finally {
      setSaving(false);
    }
  };

  const checkProfileStatus = async () => {
    try {
      const status = await freeswitchConfigService.getProfileStatus();
      setProfileStatus({
        internal: status.internal as 'unknown' | 'running' | 'stopped' | 'error',
        external: status.external as 'unknown' | 'running' | 'stopped' | 'error'
      });
    } catch (error) {
      console.error('Error checking profile status:', error);
      setProfileStatus({
        internal: 'error',
        external: 'error'
      });
    }
  };

  const testProfile = async (profileType: 'internal' | 'external') => {
    setTesting(true);
    try {
      const result = await freeswitchConfigService.testProfile(profileType);
      if (result.success) {
        toast.success(`${profileType} profile test successful: ${result.message}`);
      } else {
        toast.error(`${profileType} profile test failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`${profileType} profile test failed`);
      console.error('Error testing profile:', error);
    } finally {
      setTesting(false);
    }
  };

  const restartProfile = async (profileType: 'internal' | 'external') => {
    try {
      await freeswitchConfigService.restartProfile(profileType);
      toast.success(`${profileType} profile restarted successfully`);
      await checkProfileStatus();
    } catch (error) {
      toast.error(`Failed to restart ${profileType} profile`);
      console.error('Error restarting profile:', error);
    }
  };

  const toggleProfile = async (profileType: 'internal' | 'external', enabled: boolean) => {
    try {
      await freeswitchConfigService.toggleProfile(profileType, enabled);
      toast.success(`${profileType} profile ${enabled ? 'started' : 'stopped'} successfully`);
      await checkProfileStatus();
    } catch (error) {
      toast.error(`Failed to ${enabled ? 'start' : 'stop'} ${profileType} profile`);
      console.error('Error toggling profile:', error);
    }
  };

  const updateInternalProfile = (field: keyof SipProfileConfig, value: any) => {
    const updatedProfile = { ...internalProfile, [field]: value };
    setInternalProfile(updatedProfile);

    // Auto-notify parent component of changes
    onConfigChange?.({
      internal: updatedProfile,
      external: externalProfile
    });
  };

  const updateExternalProfile = (field: keyof SipProfileConfig, value: any) => {
    const updatedProfile = { ...externalProfile, [field]: value };
    setExternalProfile(updatedProfile);

    // Auto-notify parent component of changes
    onConfigChange?.({
      internal: internalProfile,
      external: updatedProfile
    });
  };

  const renderProfileSettings = (
    profile: SipProfileConfig, 
    updateProfile: (field: keyof SipProfileConfig, value: any) => void,
    profileType: 'internal' | 'external'
  ) => (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Settings
          </CardTitle>
          <CardDescription>
            Configure basic profile settings and identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-name`}>Profile Name</Label>
              <Input
                id={`${profileType}-name`}
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                placeholder="Profile name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-enabled`}>Enabled</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${profileType}-enabled`}
                  checked={profile.enabled}
                  onCheckedChange={(checked) => updateProfile('enabled', checked)}
                />
                <Badge variant={profile.enabled ? 'default' : 'secondary'}>
                  {profile.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${profileType}-description`}>Description</Label>
            <Textarea
              id={`${profileType}-description`}
              value={profile.description}
              onChange={(e) => updateProfile('description', e.target.value)}
              placeholder="Profile description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Network Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Settings
          </CardTitle>
          <CardDescription>
            Configure IP addresses and port settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-sip-ip`}>SIP IP Address</Label>
              <Input
                id={`${profileType}-sip-ip`}
                value={profile.sip_ip}
                onChange={(e) => updateProfile('sip_ip', e.target.value)}
                placeholder="0.0.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-sip-port`}>SIP Port</Label>
              <Input
                id={`${profileType}-sip-port`}
                type="number"
                value={profile.sip_port}
                onChange={(e) => updateProfile('sip_port', parseInt(e.target.value))}
                placeholder="5060"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-rtp-ip`}>RTP IP Address</Label>
              <Input
                id={`${profileType}-rtp-ip`}
                value={profile.rtp_ip}
                onChange={(e) => updateProfile('rtp_ip', e.target.value)}
                placeholder="0.0.0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-sip-port-tls`}>SIP TLS Port</Label>
              <Input
                id={`${profileType}-sip-port-tls`}
                type="number"
                value={profile.sip_port_tls}
                onChange={(e) => updateProfile('sip_port_tls', parseInt(e.target.value))}
                placeholder="5061"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            RTP Settings
          </CardTitle>
          <CardDescription>
            Configure RTP media handling and port ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-rtp-start-port`}>RTP Start Port</Label>
              <Input
                id={`${profileType}-rtp-start-port`}
                type="number"
                value={profile.rtp_start_port}
                onChange={(e) => updateProfile('rtp_start_port', parseInt(e.target.value))}
                placeholder="16384"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-rtp-end-port`}>RTP End Port</Label>
              <Input
                id={`${profileType}-rtp-end-port`}
                type="number"
                value={profile.rtp_end_port}
                onChange={(e) => updateProfile('rtp_end_port', parseInt(e.target.value))}
                placeholder="16484"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-rtp-timeout`}>RTP Timeout (sec)</Label>
              <Input
                id={`${profileType}-rtp-timeout`}
                type="number"
                value={profile.rtp_timeout_sec}
                onChange={(e) => updateProfile('rtp_timeout_sec', parseInt(e.target.value))}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-rtp-timer`}>RTP Timer</Label>
              <Select
                value={profile.rtp_timer_name}
                onValueChange={(value) => updateProfile('rtp_timer_name', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soft">Soft Timer</SelectItem>
                  <SelectItem value="none">No Timer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${profileType}-codec-prefs`}>Codec Preferences</Label>
            <Input
              id={`${profileType}-codec-prefs`}
              value={profile.codec_prefs}
              onChange={(e) => updateProfile('codec_prefs', e.target.value)}
              placeholder="OPUS,G722,PCMU,PCMA"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure authentication and access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-auth-calls`}>Authenticate Calls</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${profileType}-auth-calls`}
                  checked={profile.auth_calls}
                  onCheckedChange={(checked) => updateProfile('auth_calls', checked)}
                />
                <Badge variant={profile.auth_calls ? 'default' : 'secondary'}>
                  {profile.auth_calls ? 'Required' : 'Optional'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-blind-reg`}>Accept Blind Registration</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${profileType}-blind-reg`}
                  checked={profile.accept_blind_reg}
                  onCheckedChange={(checked) => updateProfile('accept_blind_reg', checked)}
                />
                <Badge variant={profile.accept_blind_reg ? 'destructive' : 'default'}>
                  {profile.accept_blind_reg ? 'Allowed' : 'Blocked'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-inbound-acl`}>Inbound ACL</Label>
              <Select
                value={profile.apply_inbound_acl}
                onValueChange={(value) => updateProfile('apply_inbound_acl', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ACL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domains">Domains</SelectItem>
                  <SelectItem value="providers">Providers</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-register-acl`}>Register ACL</Label>
              <Select
                value={profile.apply_register_acl}
                onValueChange={(value) => updateProfile('apply_register_acl', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ACL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domains">Domains</SelectItem>
                  <SelectItem value="providers">Providers</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Configure dialplan context and advanced options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-context`}>Dialplan Context</Label>
              <Input
                id={`${profileType}-context`}
                value={profile.context}
                onChange={(e) => updateProfile('context', e.target.value)}
                placeholder="default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-dialplan`}>Dialplan</Label>
              <Select
                value={profile.dialplan}
                onValueChange={(value) => updateProfile('dialplan', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dialplan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="enum">ENUM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-nat-ping`}>NAT Options Ping</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${profileType}-nat-ping`}
                  checked={profile.nat_options_ping}
                  onCheckedChange={(checked) => updateProfile('nat_options_ping', checked)}
                />
                <Badge variant={profile.nat_options_ping ? 'default' : 'secondary'}>
                  {profile.nat_options_ping ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${profileType}-stun`}>STUN Enabled</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${profileType}-stun`}
                  checked={profile.stun_enabled}
                  onCheckedChange={(checked) => updateProfile('stun_enabled', checked)}
                />
                <Badge variant={profile.stun_enabled ? 'default' : 'secondary'}>
                  {profile.stun_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading SIP profiles configuration...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">SIP Profiles Configuration</h2>
        <p className="text-muted-foreground">
          Configure internal and external SIP profiles for call handling
        </p>
      </div>

      <Tabs defaultValue="internal" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Internal Profile
              <Badge
                variant={profileStatus.internal === 'running' ? 'default' :
                        profileStatus.internal === 'error' ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {profileStatus.internal}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              External Profile
              <Badge
                variant={profileStatus.external === 'running' ? 'default' :
                        profileStatus.external === 'error' ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {profileStatus.external}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkProfileStatus}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testProfile('internal')}
              disabled={testing}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Internal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testProfile('external')}
              disabled={testing}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test External
            </Button>
          </div>
        </div>

        <TabsContent value="internal">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Internal Profile Control
                    </CardTitle>
                    <CardDescription>
                      Manage internal SIP profile operations
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartProfile('internal')}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button
                      variant={internalProfile.enabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => {
                        const newEnabled = !internalProfile.enabled;
                        updateInternalProfile('enabled', newEnabled);
                        toggleProfile('internal', newEnabled);
                      }}
                    >
                      {internalProfile.enabled ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {renderProfileSettings(internalProfile, updateInternalProfile, 'internal')}
          </div>
        </TabsContent>

        <TabsContent value="external">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      External Profile Control
                    </CardTitle>
                    <CardDescription>
                      Manage external SIP profile operations
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartProfile('external')}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button
                      variant={externalProfile.enabled ? "destructive" : "default"}
                      size="sm"
                      onClick={() => {
                        const newEnabled = !externalProfile.enabled;
                        updateExternalProfile('enabled', newEnabled);
                        toggleProfile('external', newEnabled);
                      }}
                    >
                      {externalProfile.enabled ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {renderProfileSettings(externalProfile, updateExternalProfile, 'external')}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save and Reset Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Changes will be applied to FreeSWITCH configuration files and require a restart to take effect.
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadConfiguration}
                disabled={loading || saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={loading || saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
