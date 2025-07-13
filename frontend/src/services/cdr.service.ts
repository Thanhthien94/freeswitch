// Modern NextJS 15 API Pattern - Direct API calls to backend
import { api } from '@/lib/api-client';

// CDR Types
export interface CallDetailRecord {
  id: string;
  callUuid: string;
  callSessionId: string;
  parentCallUuid?: string;
  callerIdNumber: string;
  callerIdName?: string;
  destinationNumber: string;
  destinationName?: string;
  direction: 'inbound' | 'outbound' | 'internal';
  isBillingLeg: boolean;
  context: string;
  domainName: string;
  callCreatedAt: string;
  callRingingAt?: string;
  callAnsweredAt?: string;
  callBridgedAt?: string;
  callEndedAt?: string;
  ringDuration?: number;
  talkDuration?: number;
  totalDuration?: number;
  billableDuration?: number;
  callStatus: 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';
  hangupCause?: string;
  hangupDisposition?: string;
  answerDisposition?: string;
  callerIpAddress?: string;
  calleeIpAddress?: string;
  sipUserAgent?: string;
  codecUsed?: string;
  gatewayUsed?: string;
  routeUsed?: string;
  trunkUsed?: string;
  audioQualityScore?: number;
  packetLossPercent?: number;
  jitterMs?: number;
  latencyMs?: number;
  billingAccount?: string;
  recordingEnabled: boolean;
  recordingFilePath?: string;
  transferOccurred: boolean;
  conferenceUsed: boolean;
  voicemailUsed: boolean;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface CdrListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  callerNumber?: string;
  destinationNumber?: string;
  callStatus?: string;
  direction?: string;
  search?: string;
}

export interface CdrStats {
  totalCalls: number;
  answeredCalls: number;
  failedCalls: number;
  averageDuration: number;
  totalDuration: number;
  answerSeizureRatio: number;
  averageQualityScore: number;
}

// CDR Service - Modern NextJS 15 Pattern
export const cdrService = {
  // Get CDR list with filters - Use Route Handler
  getCdrList: async (params: CdrListParams = {}): Promise<{ data: CallDetailRecord[], pagination: any }> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get<{ data: CallDetailRecord[], pagination: any }>(`/cdr?${queryParams.toString()}`);
    return response.data;
  },

  // Get CDR by ID
  getCdrById: async (id: string): Promise<CallDetailRecord> => {
    const response = await api.get<CallDetailRecord>(`/cdr/${id}`);
    return response.data;
  },

  // Get CDR by call UUID
  getCdrByCallUuid: async (callUuid: string): Promise<CallDetailRecord> => {
    const response = await api.get<CallDetailRecord>(`/cdr/call/${callUuid}`);
    return response.data;
  },

  // Get CDR statistics
  getCdrStats: async (params: Omit<CdrListParams, 'page' | 'limit'> = {}): Promise<CdrStats> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get<CdrStats>(`/cdr/stats?${queryParams.toString()}`);
    return response.data;
  },

  // Export CDR data
  exportCdr: async (params: CdrListParams = {}, format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    queryParams.append('format', format);

    // Use direct fetch for file download
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    const response = await fetch(`${API_BASE_URL}/cdr/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CDR data');
    }

    // Create download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `cdr-export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Delete CDR record - Use Route Handler
  deleteCdr: async (id: string): Promise<void> => {
    const response = await fetch(`/api/cdr/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete CDR record');
    }
  },
};
