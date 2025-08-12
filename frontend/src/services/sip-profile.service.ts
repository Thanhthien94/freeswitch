import { api } from '@/lib/api-client';

export interface SipProfile {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  type: 'internal' | 'external' | 'custom';
  domainId?: string;
  bindIp?: string;
  bindPort: number;
  tlsPort?: number;
  rtpIp?: string;
  extRtpIp?: string;
  extSipIp?: string;
  sipPort?: number;
  settings?: any;
  advancedSettings?: any;
  securitySettings?: any;
  codecSettings?: any;
  isActive?: boolean;
  isDefault?: boolean;
  order?: number;
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
  displayName?: string;
  description?: string;
  type: 'internal' | 'external' | 'custom';
  domainId?: string;
  bindIp?: string;
  bindPort: number;
  tlsPort?: number;
  rtpIp?: string;
  extRtpIp?: string;
  extSipIp?: string;
  sipPort?: number;
  settings?: any;
  advancedSettings?: any;
  securitySettings?: any;
  codecSettings?: any;
  isActive?: boolean;
  isDefault?: boolean;
  order?: number;
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
  private readonly baseUrl = '/freeswitch/sip-profiles';

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
    const response = await api.get<{data: SipProfile[], total: number, page: number, limit: number}>(url);

    // Backend already returns the correct structure: {data, total, page, limit}
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: Math.ceil(response.total / response.limit)
    };
  }

  async getSipProfile(id: string): Promise<SipProfile> {
    const response = await api.get<SipProfile>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createSipProfile(data: CreateSipProfileData): Promise<SipProfile> {
    return api.post<SipProfile>(this.baseUrl, data);
  }

  async updateSipProfile(id: string, data: UpdateSipProfileData): Promise<SipProfile> {
    return api.put<SipProfile>(`${this.baseUrl}/${id}`, data);
  }

  deleteSipProfile = async (id: string): Promise<void> => {
    console.log('🔍 SIP Profile Service: Deleting profile with ID:', id);
    console.log('🔍 SIP Profile Service: baseUrl value:', this.baseUrl);
    console.log('🔍 SIP Profile Service: Delete URL:', `${this.baseUrl}/${id}`);
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async toggleSipProfileStatus(id: string, isActive: boolean): Promise<SipProfile> {
    return api.patch<SipProfile>(`${this.baseUrl}/${id}/status`, { isActive });
  }

  async getSipProfileStats(): Promise<SipProfileStats> {
    const response = await api.get<SipProfileStats>(`${this.baseUrl}/stats`);
    return response;
  }

  async getSipProfilesByDomain(domainId: string): Promise<SipProfile[]> {
    const response = await api.get<SipProfile[]>(`${this.baseUrl}/by-domain/${domainId}`);
    return response;
  }

  async generateSipProfileXml(id: string): Promise<{ xml: string }> {
    const response = await api.get<{ xml: string }>(`${this.baseUrl}/${id}/xml`);
    return response;
  }

  async downloadSipProfileXml(id: string): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${id}/xml/download`, {
      responseType: 'blob'
    });
    return response as Blob;
  }

  async testSipProfile(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    return api.post<{ success: boolean; message: string; details?: any }>(`${this.baseUrl}/${id}/test`);
  }

  async reloadSipProfile(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`${this.baseUrl}/${id}/reload`);
  }

  async duplicateSipProfile(id: string, newName: string): Promise<SipProfile> {
    return api.post<SipProfile>(`${this.baseUrl}/${id}/duplicate`, { name: newName });
  }

  async exportSipProfiles(params?: SipProfileQueryParams): Promise<Blob> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append('search', params.search);
    if (params?.domainId) searchParams.append('domainId', params.domainId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const url = searchParams.toString() ? `${this.baseUrl}/export?${searchParams}` : `${this.baseUrl}/export`;
    const response = await api.get(url, { responseType: 'blob' });
    return response as Blob;
  }

  async importSipProfiles(file: File): Promise<{ success: boolean; imported: number; errors: string[] }> {
    // Note: Current api client may not support FormData properly
    // This would need custom implementation similar to other services
    throw new Error('Import functionality not implemented with current api client');
  }
}

export const sipProfileService = new SipProfileService();
