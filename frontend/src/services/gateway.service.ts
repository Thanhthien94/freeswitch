import { api } from '@/lib/api-client';

export interface Gateway {
  id: string;
  name: string;
  username: string;
  password: string;
  realm: string;
  proxy: string;
  register: boolean;
  registerProxy?: string;
  outboundProxy?: string;
  fromUser?: string;
  fromDomain?: string;
  expire?: number;
  retrySeconds?: number;
  callerIdInFrom?: boolean;
  extension?: string;
  context?: string;
  profileId: string;
  profileName?: string;
  status?: 'NOREG' | 'REGED' | 'UNREGED' | 'FAILED' | 'FAIL_WAIT' | 'EXPIRED' | 'TRYING';
  state?: 'UP' | 'DOWN';
  ping?: number;
  pingCount?: number;
  pingMax?: number;
  pingMin?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayStats {
  total: number;
  active: number;
  inactive: number;
  registered: number;
  byProfile: Record<string, number>;
}

export interface CreateGatewayRequest {
  name: string;
  username: string;
  password: string;
  realm: string;
  proxy: string;
  register: boolean;
  registerProxy?: string;
  outboundProxy?: string;
  fromUser?: string;
  fromDomain?: string;
  expire?: number;
  retrySeconds?: number;
  callerIdInFrom?: boolean;
  extension?: string;
  context?: string;
  profileId: string;
}

export interface UpdateGatewayRequest extends Partial<CreateGatewayRequest> {
  id: string;
}

export interface GatewayListResponse {
  data: Gateway[];
  total: number;
  page: number;
  limit: number;
}

export interface GatewayListParams {
  page?: number;
  limit?: number;
  search?: string;
  profileId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

class GatewayService {
  private baseUrl = '/freeswitch/gateways';

  async getGateways(params: GatewayListParams = {}): Promise<GatewayListResponse> {
    console.log('🔍 Gateway Service: Fetching gateways with params:', params);
    
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.profileId) searchParams.append('profileId', params.profileId);
    if (params.status) searchParams.append('status', params.status);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api.get<GatewayListResponse>(url);
    
    console.log('✅ Gateway Service: Response received:', response);
    return response;
  }

  async getGatewayById(id: string): Promise<Gateway> {
    console.log('🔍 Gateway Service: Fetching gateway by ID:', id);
    
    const response = await api.get<Gateway>(`${this.baseUrl}/${id}`);
    
    console.log('✅ Gateway Service: Gateway details received:', response);
    return response;
  }

  async createGateway(data: CreateGatewayRequest): Promise<Gateway> {
    console.log('🔍 Gateway Service: Creating gateway:', data);
    
    const response = await api.post<Gateway>(this.baseUrl, data);

    console.log('✅ Gateway Service: Gateway created:', response);
    return response;
  }

  async updateGateway(id: string, data: Partial<CreateGatewayRequest>): Promise<Gateway> {
    console.log('🔍 Gateway Service: Updating gateway:', id, data);

    const response = await api.put<Gateway>(`${this.baseUrl}/${id}`, data);

    console.log('✅ Gateway Service: Gateway updated:', response);
    return response;
  }

  async deleteGateway(id: string): Promise<void> {
    console.log('🔍 Gateway Service: Deleting gateway:', id);

    await api.delete(`${this.baseUrl}/${id}`);

    console.log('✅ Gateway Service: Gateway deleted');
  }

  async getGatewayStats(): Promise<GatewayStats> {
    console.log('🔍 Gateway Service: Fetching gateway statistics');

    const response = await api.get<GatewayStats>(`${this.baseUrl}/stats`);

    console.log('✅ Gateway Service: Stats received:', response);
    return response;
  }

  async getGatewaysByProfile(profileId: string): Promise<Gateway[]> {
    console.log('🔍 Gateway Service: Fetching gateways by profile:', profileId);

    const response = await api.get<Gateway[]>(`${this.baseUrl}/by-profile/${profileId}`);

    console.log('✅ Gateway Service: Gateways by profile received:', response);
    return response;
  }

  async getGatewayXml(id: string): Promise<string> {
    console.log('🔍 Gateway Service: Fetching gateway XML:', id);

    const response = await api.get<{ xml: string }>(`${this.baseUrl}/${id}/xml`);
    
    console.log('✅ Gateway Service: XML received');
    return response.xml;
  }

  // Helper methods for status formatting
  getStatusColor(status?: string): string {
    switch (status) {
      case 'REGED': return 'text-green-600 bg-green-50';
      case 'NOREG': return 'text-gray-600 bg-gray-50';
      case 'UNREGED': return 'text-yellow-600 bg-yellow-50';
      case 'FAILED': 
      case 'FAIL_WAIT': 
      case 'EXPIRED': return 'text-red-600 bg-red-50';
      case 'TRYING': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  getStateColor(state?: string): string {
    switch (state) {
      case 'UP': return 'text-green-600 bg-green-50';
      case 'DOWN': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  formatStatus(status?: string): string {
    switch (status) {
      case 'REGED': return 'Registered';
      case 'NOREG': return 'No Registration';
      case 'UNREGED': return 'Unregistered';
      case 'FAILED': return 'Failed';
      case 'FAIL_WAIT': return 'Fail Wait';
      case 'EXPIRED': return 'Expired';
      case 'TRYING': return 'Trying';
      default: return status || 'Unknown';
    }
  }
}

export const gatewayService = new GatewayService();
