import { api } from '@/lib/api-client';

export interface GlobalNetworkConfig {
  id: number;
  configName: string;
  displayName?: string;
  description?: string;
  externalIp?: string;
  bindServerIp: string;
  domain: string;
  sipPort: number;
  externalSipPort?: number;
  tlsPort: number;
  externalTlsPort?: number;
  rtpStartPort: number;
  rtpEndPort: number;
  externalRtpIp?: string;
  stunServer: string;
  stunEnabled: boolean;
  globalCodecPrefs: string;
  outboundCodecPrefs: string;
  transportProtocols: string[];
  enableTls: boolean;
  natDetection: boolean;
  autoNat: boolean;
  status: 'active' | 'pending' | 'error' | 'disabled';
  isActive: boolean;
  isDefault: boolean;
  autoApply: boolean;
  metadata: any;
  tags?: any;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  lastAppliedAt?: string;
  lastAppliedBy?: string;
}

export interface UpdateNetworkConfigDto {
  configName?: string;
  displayName?: string;
  description?: string;
  externalIp?: string;
  bindServerIp?: string;
  domain?: string;
  sipPort?: number;
  externalSipPort?: number;
  tlsPort?: number;
  externalTlsPort?: number;
  rtpStartPort?: number;
  rtpEndPort?: number;
  externalRtpIp?: string;
  stunServer?: string;
  stunEnabled?: boolean;
  globalCodecPrefs?: string;
  outboundCodecPrefs?: string;
  transportProtocols?: string[];
  enableTls?: boolean;
  natDetection?: boolean;
  autoNat?: boolean;
  autoApply?: boolean;
  metadata?: any;
  tags?: any;
}

export interface NetworkConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApplyConfigResult {
  success: boolean;
  message: string;
  errors?: string[];
  appliedAt: string;
  configBackup?: string;
}

export interface ExternalIpDetectionResult {
  detectedIp: string;
  method: 'stun' | 'http' | 'manual';
  success: boolean;
  error?: string;
}

export interface NetworkConfigStatus {
  configId: number;
  status: string;
  lastAppliedAt?: string;
  lastAppliedBy?: string;
  isValid: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class NetworkConfigService {
  private readonly baseUrl = '/freeswitch/network-config';

  /**
   * Get current global network configuration
   */
  async getConfig(): Promise<GlobalNetworkConfig> {
    const response = await api.get<{ success: boolean; data: GlobalNetworkConfig; message?: string }>(this.baseUrl);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get network configuration');
    }
    return response.data;
  }

  /**
   * Update global network configuration
   */
  async updateConfig(config: UpdateNetworkConfigDto): Promise<GlobalNetworkConfig> {
    const response = await api.put<{ success: boolean; data: GlobalNetworkConfig; message?: string }>(this.baseUrl, config);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update network configuration');
    }
    return response.data;
  }

  /**
   * Validate network configuration
   */
  async validateConfig(config: UpdateNetworkConfigDto): Promise<NetworkConfigValidationResult> {
    const response = await api.post<{ success: boolean; data: NetworkConfigValidationResult; message?: string }>(
      `${this.baseUrl}/validate`,
      config
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to validate network configuration');
    }
    return response.data;
  }

  /**
   * Apply network configuration to FreeSWITCH
   */
  async applyConfig(): Promise<ApplyConfigResult> {
    const response = await api.post<{ success: boolean; data: ApplyConfigResult; message?: string }>(
      `${this.baseUrl}/apply`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to apply network configuration');
    }
    return response.data;
  }

  /**
   * Detect external IP address
   */
  async detectExternalIp(): Promise<ExternalIpDetectionResult> {
    const response = await api.post<{ success: boolean; data: ExternalIpDetectionResult; message?: string }>(
      `${this.baseUrl}/detect-ip`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to detect external IP');
    }
    return response.data;
  }

  /**
   * Sync configuration to XML files
   */
  async syncToXml(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/sync-xml`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to sync configuration to XML');
    }
    return response;
  }

  /**
   * Get network configuration status
   */
  async getConfigStatus(): Promise<NetworkConfigStatus> {
    const response = await api.get<{ success: boolean; data: NetworkConfigStatus; message?: string }>(
      `${this.baseUrl}/status`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get network configuration status');
    }
    return response.data;
  }

  /**
   * Reset to default configuration
   */
  async resetToDefault(): Promise<GlobalNetworkConfig> {
    const response = await api.post<ApiResponse<GlobalNetworkConfig>>(
      `${this.baseUrl}/reset-to-default`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to reset network configuration');
    }
    return response.data;
  }
}

export const networkConfigService = new NetworkConfigService();
