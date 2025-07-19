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
  Settings,
  Shield,
  Network,
  Phone,
  Globe,
  Server,
  Database,
  Clock,
  Zap,
  Save,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AdvancedSipConfig {
  // Codec Settings
  codec_prefs: string;
  inbound_codec_prefs: string;
  outbound_codec_prefs: string;
  codec_negotiation: 'generous' | 'greedy' | 'scrooge';
  
  // NAT Settings
  nat_options_ping: boolean;
  aggressive_nat_detection: boolean;
  stun_enabled: boolean;
  stun_auto_disable: boolean;
  
  // Security Settings
  auth_all_packets: boolean;
  force_register_domain: boolean;
  force_register_db_domain: boolean;
  force_subscription_expires: number;
  
  // Performance Settings
  rtp_timer_name: string;
  rtp_timeout_sec: number;
  rtp_hold_timeout_sec: number;
  session_timeout: number;
  min_session_expires: number;
  
  // Advanced Settings
  enable_100rel: boolean;
  disable_transfer: boolean;
  manual_redirect: boolean;
  enable_3pcc: boolean;
  
  // Logging Settings
  log_auth_failures: boolean;
  log_level: 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR';
  
  // Database Settings
  odbc_dsn: string;
  user_cache: boolean;
  
  // Custom Parameters
  custom_params: { name: string; value: string }[];
}

const defaultAdvancedConfig: AdvancedSipConfig = {
  codec_prefs: 'OPUS,G722,PCMU,PCMA',
  inbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  outbound_codec_prefs: 'OPUS,G722,PCMU,PCMA',
  codec_negotiation: 'generous',
  nat_options_ping: true,
  aggressive_nat_detection: true,
  stun_enabled: true,
  stun_auto_disable: false,
  auth_all_packets: false,
  force_register_domain: false,
  force_register_db_domain: false,
  force_subscription_expires: 120,
  rtp_timer_name: 'soft',
  rtp_timeout_sec: 300,
  rtp_hold_timeout_sec: 1800,
  session_timeout: 1800,
  min_session_expires: 120,
  enable_100rel: true,
  disable_transfer: false,
  manual_redirect: false,
  enable_3pcc: false,
  log_auth_failures: true,
  log_level: 'INFO',
  odbc_dsn: '',
  user_cache: true,
  custom_params: []
};

interface AdvancedSipPanelProps {
  onConfigChange?: (config: AdvancedSipConfig) => void;
}

export default function AdvancedSipPanel({ onConfigChange }: AdvancedSipPanelProps) {
  const [config, setConfig] = useState<AdvancedSipConfig>(defaultAdvancedConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // TODO: Load actual configuration from API
      toast.success('Advanced SIP configuration loaded');
    } catch (error) {
      toast.error('Failed to load advanced SIP configuration');
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // TODO: Save configuration via API
      onConfigChange?.(config);
      toast.success('Advanced SIP configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save advanced SIP configuration');
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof AdvancedSipConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addCustomParam = () => {
    setConfig(prev => ({
      ...prev,
      custom_params: [...prev.custom_params, { name: '', value: '' }]
    }));
  };

  const updateCustomParam = (index: number, field: 'name' | 'value', value: string) => {
    setConfig(prev => ({
      ...prev,
      custom_params: prev.custom_params.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const removeCustomParam = (index: number) => {
    setConfig(prev => ({
      ...prev,
      custom_params: prev.custom_params.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          Loading advanced SIP configuration...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advanced SIP Configuration</h2>
        <p className="text-muted-foreground">
          Configure advanced SIP settings, codecs, NAT, security, and performance options
        </p>
      </div>

      <Tabs defaultValue="codecs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="codecs" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Codecs
          </TabsTrigger>
          <TabsTrigger value="nat" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            NAT
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codecs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Codec Configuration
              </CardTitle>
              <CardDescription>
                Configure audio codec preferences and negotiation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="codec_prefs">Default Codec Preferences</Label>
                  <Input
                    id="codec_prefs"
                    value={config.codec_prefs}
                    onChange={(e) => updateConfig('codec_prefs', e.target.value)}
                    placeholder="OPUS,G722,PCMU,PCMA"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of preferred codecs in order of preference
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inbound_codec_prefs">Inbound Codec Preferences</Label>
                  <Input
                    id="inbound_codec_prefs"
                    value={config.inbound_codec_prefs}
                    onChange={(e) => updateConfig('inbound_codec_prefs', e.target.value)}
                    placeholder="OPUS,G722,PCMU,PCMA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outbound_codec_prefs">Outbound Codec Preferences</Label>
                  <Input
                    id="outbound_codec_prefs"
                    value={config.outbound_codec_prefs}
                    onChange={(e) => updateConfig('outbound_codec_prefs', e.target.value)}
                    placeholder="OPUS,G722,PCMU,PCMA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codec_negotiation">Codec Negotiation Strategy</Label>
                  <Select
                    value={config.codec_negotiation}
                    onValueChange={(value) => updateConfig('codec_negotiation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generous">Generous - Accept any codec</SelectItem>
                      <SelectItem value="greedy">Greedy - Prefer our codecs</SelectItem>
                      <SelectItem value="scrooge">Scrooge - Only our codecs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                NAT Configuration
              </CardTitle>
              <CardDescription>
                Configure NAT traversal and STUN settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>NAT Options Ping</Label>
                    <p className="text-sm text-muted-foreground">
                      Send OPTIONS ping to detect NAT
                    </p>
                  </div>
                  <Switch
                    checked={config.nat_options_ping}
                    onCheckedChange={(checked) => updateConfig('nat_options_ping', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aggressive NAT Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Use aggressive NAT detection methods
                    </p>
                  </div>
                  <Switch
                    checked={config.aggressive_nat_detection}
                    onCheckedChange={(checked) => updateConfig('aggressive_nat_detection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>STUN Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable STUN for NAT traversal
                    </p>
                  </div>
                  <Switch
                    checked={config.stun_enabled}
                    onCheckedChange={(checked) => updateConfig('stun_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>STUN Auto Disable</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto disable STUN if not needed
                    </p>
                  </div>
                  <Switch
                    checked={config.stun_auto_disable}
                    onCheckedChange={(checked) => updateConfig('stun_auto_disable', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure authentication and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auth All Packets</Label>
                    <p className="text-sm text-muted-foreground">
                      Require authentication for all packets
                    </p>
                  </div>
                  <Switch
                    checked={config.auth_all_packets}
                    onCheckedChange={(checked) => updateConfig('auth_all_packets', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Force Register Domain</Label>
                    <p className="text-sm text-muted-foreground">
                      Force domain in registration
                    </p>
                  </div>
                  <Switch
                    checked={config.force_register_domain}
                    onCheckedChange={(checked) => updateConfig('force_register_domain', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log Auth Failures</Label>
                    <p className="text-sm text-muted-foreground">
                      Log authentication failures
                    </p>
                  </div>
                  <Switch
                    checked={config.log_auth_failures}
                    onCheckedChange={(checked) => updateConfig('log_auth_failures', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="force_subscription_expires">Subscription Expires (seconds)</Label>
                  <Input
                    id="force_subscription_expires"
                    type="number"
                    value={config.force_subscription_expires}
                    onChange={(e) => updateConfig('force_subscription_expires', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Configuration
              </CardTitle>
              <CardDescription>
                Configure timeouts and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rtp_timer_name">RTP Timer Name</Label>
                  <Select
                    value={config.rtp_timer_name}
                    onValueChange={(value) => updateConfig('rtp_timer_name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">Soft Timer</SelectItem>
                      <SelectItem value="none">No Timer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtp_timeout_sec">RTP Timeout (seconds)</Label>
                  <Input
                    id="rtp_timeout_sec"
                    type="number"
                    value={config.rtp_timeout_sec}
                    onChange={(e) => updateConfig('rtp_timeout_sec', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtp_hold_timeout_sec">RTP Hold Timeout (seconds)</Label>
                  <Input
                    id="rtp_hold_timeout_sec"
                    type="number"
                    value={config.rtp_hold_timeout_sec}
                    onChange={(e) => updateConfig('rtp_hold_timeout_sec', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (seconds)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={config.session_timeout}
                    onChange={(e) => updateConfig('session_timeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Configure advanced SIP features and custom parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable 100rel</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable reliable provisional responses
                      </p>
                    </div>
                    <Switch
                      checked={config.enable_100rel}
                      onCheckedChange={(checked) => updateConfig('enable_100rel', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Disable Transfer</Label>
                      <p className="text-sm text-muted-foreground">
                        Disable call transfer functionality
                      </p>
                    </div>
                    <Switch
                      checked={config.disable_transfer}
                      onCheckedChange={(checked) => updateConfig('disable_transfer', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable 3PCC</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable third-party call control
                      </p>
                    </div>
                    <Switch
                      checked={config.enable_3pcc}
                      onCheckedChange={(checked) => updateConfig('enable_3pcc', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log_level">Log Level</Label>
                    <Select
                      value={config.log_level}
                      onValueChange={(value) => updateConfig('log_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEBUG">Debug</SelectItem>
                        <SelectItem value="INFO">Info</SelectItem>
                        <SelectItem value="NOTICE">Notice</SelectItem>
                        <SelectItem value="WARNING">Warning</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Custom Parameters
                </CardTitle>
                <CardDescription>
                  Add custom SIP profile parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.custom_params.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Parameter name"
                      value={param.name}
                      onChange={(e) => updateCustomParam(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Parameter value"
                      value={param.value}
                      onChange={(e) => updateCustomParam(index, 'value', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomParam(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addCustomParam}
                >
                  Add Custom Parameter
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save and Reset Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Advanced settings require FreeSWITCH restart to take effect.
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
