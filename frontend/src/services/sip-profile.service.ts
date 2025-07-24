import { apiClient } from '@/lib/api-client';

export interface SipProfile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  sipPort: number;
  sipIp: string;
  rtpIp: string;
  rtpPortStart: number;
  rtpPortEnd: number;
  dialplan: string;
  context: string;
  dtmfDuration: number;
  codecPrefs: string;
  useRtpTimer: boolean;
  rtpTimerName: string;
  holdMusic: string;
  recordPath: string;
  recordTemplate: string;
  managePresence: boolean;
  presenceHosts: string;
  presencePrivacy: boolean;
  authCalls: boolean;
  authAllPackets: boolean;
  acceptBlindReg: boolean;
  acceptBlindAuth: boolean;
  suppressCng: boolean;
  enableTimer: boolean;
  minimumSessionExpires: number;
  sessionTimeout: number;
  dtmfType: string;
  liberalDtmf: boolean;
  rtpTimeout: number;
  rtpHoldTimeout: number;
  forceRegisterDomain: string;
  forceRegisterDbDomain: string;
  forceSubscriptionExpires: number;
  challengeRealm: string;
  isActive: boolean;
  domainId?: string;
  domain?: {
    id: string;
    name: string;
    displayName: string;
  };
  gatewayCount?: number;
  extensionCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateSipProfileData {
  name: string;
  displayName: string;
  description?: string;
  sipPort: number;
  sipIp: string;
  rtpIp: string;
  rtpPortStart: number;
  rtpPortEnd: number;
  dialplan: string;
  context: string;
  dtmfDuration?: number;
  codecPrefs?: string;
  useRtpTimer?: boolean;
  rtpTimerName?: string;
  holdMusic?: string;
  recordPath?: string;
  recordTemplate?: string;
  managePresence?: boolean;
  presenceHosts?: string;
  presencePrivacy?: boolean;
  authCalls?: boolean;
  authAllPackets?: boolean;
  acceptBlindReg?: boolean;
  acceptBlindAuth?: boolean;
  suppressCng?: boolean;
  enableTimer?: boolean;
  minimumSessionExpires?: number;
  sessionTimeout?: number;
  dtmfType?: string;
  liberalDtmf?: boolean;
  rtpTimeout?: number;
  rtpHoldTimeout?: number;
  forceRegisterDomain?: string;
  forceRegisterDbDomain?: string;
  forceSubscriptionExpires?: number;
  challengeRealm?: string;
  domainId?: string;
}

export interface UpdateSipProfileData extends Partial<CreateSipProfileData> {
  isActive?: boolean;
}

export interface SipProfileQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SipProfileStats {
  totalProfiles: number;
  activeProfiles: number;
  inactiveProfiles: number;
  totalGateways: number;
  totalExtensions: number;
  averageLoad: number;
  profilesByDomain: Array<{
    domainId: string;
    domainName: string;
    profileCount: number;
  }>;
}

export interface SipProfileResponse {
  data: SipProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class SipProfileService {
  private readonly baseUrl = '/api/v1/freeswitch/sip-profiles';

  async getSipProfiles(params?: SipProfileQueryParams): Promise<SipProfileResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.domainId) searchParams.append('domainId', params.domainId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
    return apiClient.get<SipProfileResponse>(url);
  }

  async getSipProfile(id: string): Promise<SipProfile> {
    return apiClient.get<SipProfile>(`${this.baseUrl}/${id}`);
  }

  async createSipProfile(data: CreateSipProfileData): Promise<SipProfile> {
    return apiClient.post<SipProfile>(this.baseUrl, data);
  }

  async updateSipProfile(id: string, data: UpdateSipProfileData): Promise<SipProfile> {
    return apiClient.put<SipProfile>(`${this.baseUrl}/${id}`, data);
  }

  async deleteSipProfile(id: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async toggleSipProfileStatus(id: string, isActive: boolean): Promise<SipProfile> {
    return apiClient.patch<SipProfile>(`${this.baseUrl}/${id}/status`, { isActive });
  }

  async getSipProfileStats(): Promise<SipProfileStats> {
    return apiClient.get<SipProfileStats>(`${this.baseUrl}/stats`);
  }

  async getSipProfilesByDomain(domainId: string): Promise<SipProfile[]> {
    return apiClient.get<SipProfile[]>(`${this.baseUrl}/by-domain/${domainId}`);
  }

  async generateSipProfileXml(id: string): Promise<{ xml: string }> {
    return apiClient.get<{ xml: string }>(`${this.baseUrl}/${id}/xml`);
  }

  async downloadSipProfileXml(id: string): Promise<Blob> {
    return apiClient.get(`${this.baseUrl}/${id}/xml/download`, {
      responseType: 'blob'
    });
  }

  async testSipProfile(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    return apiClient.post<{ success: boolean; message: string; details?: any }>(`${this.baseUrl}/${id}/test`);
  }

  async reloadSipProfile(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/reload`);
  }

  async duplicateSipProfile(id: string, newName: string): Promise<SipProfile> {
    return apiClient.post<SipProfile>(`${this.baseUrl}/${id}/duplicate`, { name: newName });
  }

  async exportSipProfiles(params?: SipProfileQueryParams): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.domainId) searchParams.append('domainId', params.domainId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = searchParams.toString() ? `${this.baseUrl}/export?${searchParams}` : `${this.baseUrl}/export`;
    return apiClient.get(url, { responseType: 'blob' });
  }

  async importSipProfiles(file: File): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post<{ success: boolean; imported: number; errors: string[] }>(
      `${this.baseUrl}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
}

export const sipProfileService = new SipProfileService();
