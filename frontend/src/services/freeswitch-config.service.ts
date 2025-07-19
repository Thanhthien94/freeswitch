// FreeSWITCH Configuration Service
import { api } from '@/lib/api-client';

// Types
export interface NetworkConfig {
  external_ip_mode: 'auto' | 'stun' | 'manual';
  external_ip?: string;
  bind_server_ip?: string;
  rtp_start_port: number;
  rtp_end_port: number;
  stun_server?: string;
  internal_sip_port?: number;
  internal_tls_port?: number;
}

export interface SipConfig {
  sip_port: number;
  sip_port_tls: number;
  sip_domain: string;
  context: string;
  auth_calls: boolean;
  accept_blind_reg: boolean;
  accept_blind_auth: boolean;
}

export interface FreeSwitchConfig {
  id: string;
  category: string;
  name: string;
  value: string;
  type: string;
  description: string;
  is_active: boolean;
  requires_restart: boolean;
  sort_order: number;
}

export interface VarsXmlPreview {
  content: string;
}

// ACL Types
export interface AclRule {
  type: 'allow' | 'deny';
  cidr: string;
  description?: string;
}

export interface AclConfig {
  domains: AclRule[];
  esl_access: AclRule[];
  sip_profiles: AclRule[];
}

export interface NetworkDetection {
  interfaces: Array<{
    ip: string;
    prefix: number;
    cidr: string;
    network: string;
  }>;
  routes: Array<{
    type: string;
    line: string;
  }>;
  detectedRanges: AclRule[];
}

// Multicast Types
export interface MulticastConfig {
  address: string;
  port: number;
  bindings: string;
  ttl: number;
  loopback?: boolean;
  psk?: string;
}

// Verto WebRTC Types
export interface VertoConfig {
  enabled: boolean;
  port: number;
  securePort: number;
  mcastIp: string;
  mcastPort: number;
  userAuth: boolean;
  context: string;
  outboundCodecs: string;
  inboundCodecs: string;
  rtpTimeout: number;
  rtpHoldTimeout: number;
  enable3pcc: boolean;
}

// SIP Profiles Types
export interface SipProfileConfig {
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

export interface SipProfilesConfig {
  internal: SipProfileConfig;
  external: SipProfileConfig;
}

class FreeSwitchConfigService {
  // Get all configurations
  async getConfigurations(category?: string): Promise<FreeSwitchConfig[]> {
    const params = category ? `?category=${category}` : '';
    const response = await api.get<FreeSwitchConfig[]>(`/freeswitch-config${params}`);
    return response.data;
  }

  // Get network configuration
  async getNetworkConfig(): Promise<NetworkConfig> {
    const configs = await this.getConfigurations('network');
    const externalIpMode = configs.find(c => c.name === 'external_ip_mode')?.value || 'stun';
    const networkConfig: NetworkConfig = {
      external_ip_mode: (externalIpMode as 'auto' | 'stun' | 'manual'),
      external_ip: configs.find(c => c.name === 'external_ip')?.value || '',
      rtp_start_port: parseInt(configs.find(c => c.name === 'rtp_start_port')?.value || '16384'),
      rtp_end_port: parseInt(configs.find(c => c.name === 'rtp_end_port')?.value || '32768'),
      bind_server_ip: configs.find(c => c.name === 'bind_server_ip')?.value || 'auto',
    };
    return networkConfig;
  }

  // Update network configuration
  async updateNetworkConfig(config: NetworkConfig): Promise<void> {
    await api.put('/freeswitch-config/network', config);
  }

  // Get SIP configuration
  async getSipConfig(): Promise<SipConfig> {
    const configs = await this.getConfigurations('sip');
    const sipConfig: SipConfig = {
      sip_port: parseInt(configs.find(c => c.name === 'sip_port')?.value || '5060'),
      sip_port_tls: parseInt(configs.find(c => c.name === 'sip_port_tls')?.value || '5061'),
      sip_domain: configs.find(c => c.name === 'sip_domain')?.value || 'localhost',
      context: configs.find(c => c.name === 'context')?.value || 'default',
      auth_calls: false,
      accept_blind_reg: false,
      accept_blind_auth: false,
    };
    return sipConfig;
  }

  // Update SIP configuration
  async updateSipConfig(config: SipConfig): Promise<void> {
    await api.put('/freeswitch-config/sip', config);
  }

  // Get SIP profiles configuration
  async getSipProfiles(): Promise<SipProfilesConfig> {
    const response = await api.get<SipProfilesConfig>('/freeswitch-config/sip-profiles');
    return response.data;
  }

  // Update SIP profiles configuration
  async updateSipProfiles(config: SipProfilesConfig): Promise<void> {
    await api.put('/freeswitch-config/sip-profiles', config);
  }

  // Get SIP profile status
  async getProfileStatus(): Promise<{ internal: string; external: string }> {
    const response = await api.get<{ internal: string; external: string }>('/freeswitch-config/sip-profiles/status');
    return response.data;
  }

  // Test SIP profile connectivity
  async testProfile(profileType: 'internal' | 'external'): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/freeswitch-config/sip-profiles/${profileType}/test`);
    return response.data;
  }

  // Restart SIP profile
  async restartProfile(profileType: 'internal' | 'external'): Promise<void> {
    await api.post(`/freeswitch-config/sip-profiles/${profileType}/restart`);
  }

  // Start/Stop SIP profile
  async toggleProfile(profileType: 'internal' | 'external', enabled: boolean): Promise<void> {
    await api.post(`/freeswitch-config/sip-profiles/${profileType}/${enabled ? 'start' : 'stop'}`);
  }

  // Apply configuration (restart FreeSWITCH)
  async applyConfiguration(): Promise<void> {
    await api.post('/freeswitch-config/apply');
  }

  // Preview vars.xml
  async previewVarsXml(): Promise<VarsXmlPreview> {
    const response = await api.get<VarsXmlPreview>('/freeswitch-config/vars-xml/preview');
    return response.data;
  }

  // Update specific configuration
  async updateConfig(id: string, value: string): Promise<void> {
    await api.put(`/freeswitch-config/${id}`, { value });
  }

  // Create new configuration
  async createConfig(config: Omit<FreeSwitchConfig, 'id'>): Promise<FreeSwitchConfig> {
    const response = await api.post<FreeSwitchConfig>('/freeswitch-config', config);
    return response.data;
  }

  // Delete configuration
  async deleteConfig(id: string): Promise<void> {
    await api.delete(`/freeswitch-config/${id}`);
  }

  // Detect external IP
  async detectExternalIp(): Promise<string> {
    const response = await api.get<{ ip: string }>('/freeswitch-config/detect-ip');
    return response.data.ip;
  }

  // Network Detection
  async detectNetworkRanges(): Promise<NetworkDetection> {
    const response = await api.get<{ success: boolean; data: NetworkDetection }>('/freeswitch-config/acl/detect');
    return response.data.data;
  }

  // ACL Configuration
  async getAclConfig(): Promise<AclConfig> {
    const response = await api.get<{ success: boolean; data: AclConfig }>('/freeswitch-config/acl');
    return response.data.data;
  }

  async updateAclConfig(config: AclConfig): Promise<void> {
    await api.put('/freeswitch-config/acl', config);
  }

  async applyDetectedAcl(): Promise<AclConfig> {
    const response = await api.post<{ success: boolean; data: AclConfig }>('/freeswitch-config/acl/apply-detected');
    return response.data.data;
  }

  // Multicast Configuration
  async getMulticastConfig(): Promise<MulticastConfig> {
    const response = await api.get<{ success: boolean; data: MulticastConfig }>('/freeswitch-config/multicast');
    return response.data.data;
  }

  async updateMulticastConfig(config: MulticastConfig): Promise<void> {
    await api.put('/freeswitch-config/multicast', config);
  }

  // Verto Configuration
  async getVertoConfig(): Promise<VertoConfig> {
    const response = await api.get<{ success: boolean; data: VertoConfig }>('/freeswitch-config/verto');
    return response.data.data;
  }

  async updateVertoConfig(config: VertoConfig): Promise<void> {
    await api.put('/freeswitch-config/verto', config);
  }
}

export const freeswitchConfigService = new FreeSwitchConfigService();
