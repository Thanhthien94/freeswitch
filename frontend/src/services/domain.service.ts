// Modern NextJS 15 API Pattern - Using api client
import { api } from '@/lib/api-client';

export interface Domain {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  maxUsers: number;
  maxExtensions: number;
  settings: Record<string, any>;
  billingPlan: string;
  costCenter?: string;
  adminEmail: string;
  adminPhone?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  users?: any[];
}

export interface CreateDomainData {
  name: string;
  displayName: string;
  description: string;
  maxUsers: number;
  maxExtensions: number;
  adminEmail: string;
  adminPhone?: string;
  costCenter?: string;
}

export interface UpdateDomainData {
  displayName?: string;
  description?: string;
  maxUsers?: number;
  maxExtensions?: number;
  adminEmail?: string;
  adminPhone?: string;
  costCenter?: string;
}

export interface DomainQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  billingPlan?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DomainResponse {
  data: Domain[];
  total: number;
  page: number;
  limit: number;
}

export interface DomainStats {
  userCount: number;
  extensionCount: number;
  activeExtensions: number;
  registeredExtensions: number;
  isOverUserLimit: boolean;
  isOverExtensionLimit: boolean;
}

export interface AllDomainStats {
  totalDomains: number;
  activeDomains: number;
  totalUsers: number;
  totalExtensions: number;
  byBillingPlan: Record<string, number>;
}

class DomainService {
  /**
   * Get all domains with optional filtering and pagination
   */
  async getDomains(params?: DomainQueryParams): Promise<DomainResponse> {
    const response = await api.get<Domain[]>('/freeswitch/domains', {
      headers: params ? { 'X-Query-Params': JSON.stringify(params) } : undefined
    });
    return {
      data: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 20
    };
  }

  /**
   * Get a single domain by ID
   */
  async getDomain(id: string): Promise<Domain> {
    const response = await api.get<Domain>(`/freeswitch/domains/${id}`);
    return response.data;
  }

  /**
   * Create a new domain
   */
  async createDomain(data: CreateDomainData): Promise<Domain> {
    const response = await api.post<Domain>('/freeswitch/domains', data);
    return response;
  }

  /**
   * Update an existing domain
   */
  async updateDomain(id: string, data: UpdateDomainData): Promise<Domain> {
    const response = await api.patch<Domain>(`/freeswitch/domains/${id}`, data);
    return response;
  }

  /**
   * Delete a domain
   */
  async deleteDomain(id: string): Promise<void> {
    await api.delete(`/freeswitch/domains/${id}`);
  }

  /**
   * Get domain statistics
   */
  async getDomainStats(id: string): Promise<DomainStats> {
    const response = await api.get<DomainStats>(`/freeswitch/domains/${id}/stats`);
    return response.data;
  }

  /**
   * Get all domains statistics
   */
  async getAllDomainStats(): Promise<AllDomainStats> {
    const response = await api.get<AllDomainStats>('/freeswitch/domains/stats');
    return response.data;
  }

  /**
   * Get users for a specific domain
   */
  async getDomainUsers(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/freeswitch/domains/${id}/users`);
    return response.data;
  }

  /**
   * Get extensions for a specific domain
   */
  async getDomainExtensions(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/freeswitch/domains/${id}/extensions`);
    return response.data;
  }

  /**
   * Activate a domain
   */
  async activateDomain(id: string): Promise<Domain> {
    const response = await api.patch<Domain>(`/freeswitch/domains/${id}/activate`);
    return response;
  }

  /**
   * Deactivate a domain
   */
  async deactivateDomain(id: string): Promise<Domain> {
    const response = await api.patch<Domain>(`/domains/${id}/deactivate`);
    return response;
  }

  /**
   * Update domain settings
   */
  async updateDomainSettings(id: string, settings: Record<string, any>): Promise<Domain> {
    const response = await api.patch<Domain>(`/domains/${id}/settings`, { settings });
    return response;
  }

  /**
   * Get domain configuration for FreeSWITCH
   */
  async getDomainConfig(id: string): Promise<string> {
    const response = await api.get<string>(`/domains/${id}/config`);
    return response.data;
  }

  /**
   * Validate domain name availability
   */
  async validateDomainName(name: string): Promise<{ available: boolean; message?: string }> {
    const response = await api.get<{ available: boolean; message?: string }>(`/freeswitch/domains/validate/${name}`);
    return response.data;
  }

  /**
   * Export domain data
   */
  async exportDomain(id: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    // Note: api client doesn't support blob response type, would need custom implementation
    throw new Error('Export functionality not implemented with current api client');
  }

  /**
   * Import domain data
   */
  async importDomain(file: File): Promise<{ success: boolean; message: string; domain?: Domain }> {
    const formData = new FormData();
    formData.append('file', file);

    // Note: api client doesn't support FormData, would need custom implementation
    throw new Error('Import functionality not implemented with current api client');
  }

  /**
   * Get domain audit logs
   */
  async getDomainAuditLogs(id: string, params?: { page?: number; limit?: number }): Promise<any> {
    const response = await api.get<any>(`/freeswitch/domains/${id}/audit-logs`, {
      headers: params ? { 'X-Query-Params': JSON.stringify(params) } : undefined
    });
    return response.data;
  }

  /**
   * Test domain connectivity
   */
  async testDomainConnectivity(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await api.post<{ success: boolean; message: string; details?: any }>(`/freeswitch/domains/${id}/test-connectivity`);
    return response;
  }
}

export const domainService = new DomainService();
export default domainService;
