// Modern NextJS 15 API Pattern - Using api client
import { api } from '@/lib/api-client';

export interface ExtensionCallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
}

export interface Extension {
  id: string;
  extension: string;
  domainId: string;
  userId?: string;
  displayName: string;
  description: string;
  type: 'user' | 'conference' | 'queue' | 'ivr';
  status: 'active' | 'inactive' | 'suspended';
  sipPassword: string;
  authId: string;
  callerIdName?: string;
  callerIdNumber?: string;
  outboundCallerIdName?: string;
  outboundCallerIdNumber?: string;
  voicemailEnabled: boolean;
  voicemailPassword?: string;
  voicemailEmail?: string;
  voicemailAttachFile: boolean;
  voicemailDeleteFile: boolean;
  callForwardEnabled: boolean;
  callForwardDestination?: string;
  callForwardOnBusy: boolean;
  callForwardOnNoAnswer: boolean;
  callForwardTimeout: number;
  callRecordingEnabled: boolean;
  callRecordingMode: 'none' | 'inbound' | 'outbound' | 'all';
  dndEnabled: boolean;
  presenceId?: string;
  maxCalls: number;
  callTimeout: number;
  callGroup?: string;
  pickupGroup?: string;
  codecPrefs?: string;
  forcePing: boolean;
  sipForceContact?: string;
  sipForceExpires?: string;
  isRegistered: boolean;
  lastRegistration?: string;
  registrationIp?: string;
  userAgent?: string;
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  domain?: {
    id: string;
    name: string;
    displayName: string;
  };
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateExtensionData {
  extension: string;
  domainId: string;
  displayName: string;
  description: string;
  type: 'user' | 'conference' | 'queue' | 'ivr';
  password: string;
  userId?: string;
  callerIdName?: string;
  callerIdNumber?: string;
  outboundCallerIdName?: string;
  outboundCallerIdNumber?: string;
  voicemailEnabled?: boolean;
  voicemailPassword?: string;
  voicemailEmail?: string;
  voicemailAttachFile?: boolean;
  voicemailDeleteFile?: boolean;
  callForwardEnabled?: boolean;
  callForwardDestination?: string;
  callForwardOnBusy?: boolean;
  callForwardOnNoAnswer?: boolean;
  callForwardTimeout?: number;
  callRecordingEnabled?: boolean;
  callRecordingMode?: 'none' | 'inbound' | 'outbound' | 'all';
  dndEnabled?: boolean;
  presenceId?: string;
  maxCalls?: number;
  callTimeout?: number;
  callGroup?: string;
  pickupGroup?: string;
  codecPrefs?: string;
  forcePing?: boolean;
  sipForceContact?: string;
  sipForceExpires?: string;
  variables?: Record<string, any>;
}

export interface UpdateExtensionData {
  displayName?: string;
  description?: string;
  type?: 'user' | 'conference' | 'queue' | 'ivr';
  userId?: string;
  callerIdName?: string;
  callerIdNumber?: string;
  outboundCallerIdName?: string;
  outboundCallerIdNumber?: string;
  voicemailEnabled?: boolean;
  voicemailPassword?: string;
  voicemailEmail?: string;
  voicemailAttachFile?: boolean;
  voicemailDeleteFile?: boolean;
  callForwardEnabled?: boolean;
  callForwardDestination?: string;
  callForwardOnBusy?: boolean;
  callForwardOnNoAnswer?: boolean;
  callForwardTimeout?: number;
  callRecordingEnabled?: boolean;
  callRecordingMode?: 'none' | 'inbound' | 'outbound' | 'all';
  dndEnabled?: boolean;
  presenceId?: string;
  maxCalls?: number;
  callTimeout?: number;
  callGroup?: string;
  pickupGroup?: string;
  codecPrefs?: string;
  forcePing?: boolean;
  sipForceContact?: string;
  sipForceExpires?: string;
  variables?: Record<string, any>;
}

export interface ExtensionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  type?: 'user' | 'conference' | 'queue' | 'ivr';
  status?: 'active' | 'inactive' | 'suspended';
  isRegistered?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExtensionResponse {
  data: Extension[];
  total: number;
  page: number;
  limit: number;
}

export interface ExtensionStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  registered: number;
  unregistered: number;
  byType: Record<string, number>;
  byDomain: Record<string, number>;
}

class ExtensionService {
  /**
   * Get all extensions with optional filtering and pagination
   */
  async getExtensions(params?: ExtensionQueryParams): Promise<ExtensionResponse> {
    const response = await api.get<Extension[]>('/extensions', {
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
   * Get a single extension by ID
   */
  async getExtension(id: string): Promise<Extension> {
    const response = await api.get<Extension>(`/extensions/${id}`);
    return response.data;
  }

  /**
   * Create a new extension
   */
  async createExtension(data: CreateExtensionData): Promise<Extension> {
    const response = await api.post<Extension>('/extensions', data);
    return response;
  }

  /**
   * Update an existing extension
   */
  async updateExtension(id: string, data: UpdateExtensionData): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}`, data);
    return response;
  }

  /**
   * Delete an extension
   */
  async deleteExtension(id: string): Promise<void> {
    await api.delete(`/extensions/${id}`);
  }

  /**
   * Get extension statistics
   */
  async getExtensionStats(): Promise<ExtensionStats> {
    const response = await api.get<ExtensionStats>('/extensions/stats');
    return response.data;
  }

  /**
   * Get individual extension call statistics
   */
  async getExtensionCallStats(id: string): Promise<ExtensionCallStats> {
    const response = await api.get<ExtensionCallStats>(`/extensions/${id}/stats`);
    return response.data;
  }

  /**
   * Activate an extension
   */
  async activateExtension(id: string): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/activate`);
    return response;
  }

  /**
   * Deactivate an extension
   */
  async deactivateExtension(id: string): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/deactivate`);
    return response;
  }

  /**
   * Suspend an extension
   */
  async suspendExtension(id: string): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/suspend`);
    return response;
  }

  /**
   * Reset extension password
   */
  async resetExtensionPassword(id: string, newPassword?: string): Promise<{ extension: Extension; plainPassword: string }> {
    const response = await api.patch<{ extension: Extension; plainPassword: string }>(`/extensions/${id}/reset-password`, { password: newPassword });
    return response;
  }

  /**
   * Get extension registration status
   */
  async getExtensionRegistration(id: string): Promise<{
    isRegistered: boolean;
    lastRegistration?: string;
    registrationIp?: string;
    userAgent?: string;
    expires?: string;
  }> {
    const response = await api.get<{
      isRegistered: boolean;
      lastRegistration?: string;
      registrationIp?: string;
      userAgent?: string;
      expires?: string;
    }>(`/extensions/${id}/registration`);
    return response.data;
  }

  /**
   * Force extension re-registration
   */
  async forceExtensionReregistration(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/extensions/${id}/force-reregister`);
    return response;
  }

  /**
   * Get extension call history
   */
  async getExtensionCallHistory(id: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<any> {
    const response = await api.get<any>(`/extensions/${id}/call-history`, {
      headers: params ? { 'X-Query-Params': JSON.stringify(params) } : undefined
    });
    return response.data;
  }

  /**
   * Get extension voicemail messages
   */
  async getExtensionVoicemails(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/extensions/${id}/voicemails`);
    return response.data;
  }

  /**
   * Update extension voicemail settings
   */
  async updateExtensionVoicemailSettings(id: string, settings: {
    enabled?: boolean;
    password?: string;
    email?: string;
    attachFile?: boolean;
    deleteFile?: boolean;
  }): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/voicemail-settings`, settings);
    return response;
  }

  /**
   * Update extension call forwarding settings
   */
  async updateExtensionCallForwardSettings(id: string, settings: {
    enabled?: boolean;
    destination?: string;
    onBusy?: boolean;
    onNoAnswer?: boolean;
    timeout?: number;
  }): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/call-forward-settings`, settings);
    return response;
  }

  /**
   * Update extension DND status
   */
  async updateExtensionDND(id: string, enabled: boolean): Promise<Extension> {
    const response = await api.patch<Extension>(`/extensions/${id}/dnd`, { enabled });
    return response;
  }

  /**
   * Get extension configuration for FreeSWITCH
   */
  async getExtensionConfig(id: string): Promise<string> {
    const response = await api.get<string>(`/extensions/${id}/config`);
    return response.data;
  }

  /**
   * Validate extension number availability
   */
  async validateExtensionNumber(extension: string, domainId: string): Promise<{ available: boolean; message?: string }> {
    const response = await api.get<{ available: boolean; message?: string }>(`/extensions/validate/${extension}`, {
      headers: { 'X-Query-Params': JSON.stringify({ domainId }) }
    });
    return response.data;
  }

  /**
   * Export extension data
   */
  async exportExtension(id: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    // Note: api client doesn't support blob response type, would need custom implementation
    throw new Error('Export functionality not implemented with current api client');
  }

  /**
   * Import extension data
   */
  async importExtensions(file: File, domainId: string): Promise<{ success: boolean; message: string; extensions?: Extension[] }> {
    // Note: api client doesn't support FormData, would need custom implementation
    throw new Error('Import functionality not implemented with current api client');
  }

  /**
   * Get extension audit logs
   */
  async getExtensionAuditLogs(id: string, params?: { page?: number; limit?: number }): Promise<any> {
    const response = await api.get<any>(`/extensions/${id}/audit-logs`, {
      headers: params ? { 'X-Query-Params': JSON.stringify(params) } : undefined
    });
    return response.data;
  }

  /**
   * Test extension connectivity
   */
  async testExtensionConnectivity(id: string): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await api.post<{ success: boolean; message: string; details?: any }>(`/extensions/${id}/test-connectivity`);
    return response;
  }

  /**
   * Get extension call history
   */
  async getExtensionCalls(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/extensions/${id}/calls`);
    return response.data;
  }



  /**
   * Test extension connection
   */
  async testExtensionConnection(id: string): Promise<any> {
    const response = await api.post<any>(`/extensions/${id}/test-connection`);
    return response;
  }

  /**
   * Generate random password
   */
  async generatePassword(): Promise<{ password: string }> {
    const response = await api.post<{ password: string }>('/extensions/generate-password');
    return response;
  }

  /**
   * Reboot extension
   */
  async rebootExtension(id: string): Promise<any> {
    const response = await api.post<any>(`/extensions/${id}/reboot`);
    return response;
  }
}

export const extensionService = new ExtensionService();
export default extensionService;
