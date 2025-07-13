// Modern NextJS 15 API Pattern - Use Route Handlers instead of direct API calls

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
  getCdrList: async (params: CdrListParams = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/cdr?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CDR data');
    }

    return response.json();
  },

  // Get CDR by ID - Use Route Handler
  getCdrById: async (id: string): Promise<CallDetailRecord> => {
    const response = await fetch(`/api/cdr/${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CDR record');
    }

    const result = await response.json();
    return result.data;
  },

  // Get CDR by call UUID - Use Route Handler
  getCdrByCallUuid: async (callUuid: string): Promise<CallDetailRecord> => {
    const response = await fetch(`/api/cdr/call/${callUuid}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CDR record');
    }

    const result = await response.json();
    return result.data;
  },

  // Get CDR statistics - Use Route Handler
  getCdrStats: async (params: Omit<CdrListParams, 'page' | 'limit'> = {}): Promise<CdrStats> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/cdr/stats?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CDR statistics');
    }

    const result = await response.json();
    return result.data;
  },

  // Export CDR data - Use Route Handler
  exportCdr: async (params: CdrListParams = {}, format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    queryParams.append('format', format);

    const response = await fetch(`/api/cdr/export?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
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
