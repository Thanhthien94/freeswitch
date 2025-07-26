// Modern NextJS 15 Pattern - Use Route Handlers instead of direct API calls
import { api } from '@/lib/api-client';

// Recording Types
export interface Recording {
  callUuid: string;
  callerNumber: string;
  destinationNumber: string;
  filePath: string;
  fileSize: number;
  duration: number;
  format: string;
  exists: boolean;
  createdAt: string;
}

export interface RecordingInfo {
  callUuid: string;
  fileSize: number;
  duration: number;
  format: string;
  exists: boolean;
  filePath: string;
  callerNumber: string;
  destinationNumber: string;
  createdAt: string;
}

export interface RecordingStats {
  totalRecordings: number;
  totalSize: number;
  totalDuration: number;
  averageDuration: number;
  formatBreakdown: Record<string, number>;
}

export interface RecordingListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  callerNumber?: string;
  destinationNumber?: string;
  search?: string;
}

// Recording Service - Modern NextJS 15 Pattern
export const recordingService = {
  // Get recordings list - Use Route Handler
  getRecordingsList: async (params: RecordingListParams = {}): Promise<{ data: Recording[], pagination: any }> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    console.log('🔍 Recording Service: Fetching recordings list with params:', params);
    const response = await api.get<Recording[]>(`/recordings?${queryParams.toString()}`);
    console.log('✅ Recording Service: Response received:', response);
    // Backend returns { data: [...], pagination: {...} } directly
    return {
      data: response,
      pagination: (response as any).pagination
    };
  },

  // Get recording info by call UUID
  getRecordingInfo: async (callUuid: string): Promise<RecordingInfo> => {
    const response = await api.get<RecordingInfo>(`/recordings/${callUuid}/info`);
    return response;
  },

  // Download recording
  downloadRecording: async (callUuid: string, filename?: string): Promise<void> => {
    await api.download(`/recordings/${callUuid}/download`, filename);
  },

  // Stream recording (for web player)
  getRecordingStreamUrl: (callUuid: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    return `${baseUrl}/recordings/${callUuid}/stream`;
  },

  // Delete recording
  deleteRecording: async (callUuid: string): Promise<void> => {
    await api.delete(`/recordings/${callUuid}`);
  },

  // Get recording statistics
  getRecordingStats: async (): Promise<RecordingStats> => {
    const response = await api.get<RecordingStats>('/recordings/stats');
    // Stats endpoint returns data directly
    return response;
  },

  // Bulk delete recordings
  bulkDeleteRecordings: async (callUuids: string[]): Promise<void> => {
    await api.post('/recordings/bulk-delete', { callUuids });
  },

  // Search recordings
  searchRecordings: async (query: string, params: RecordingListParams = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get<Recording[]>(`/recordings/search?${queryParams.toString()}`);
    return response;
  },
};
