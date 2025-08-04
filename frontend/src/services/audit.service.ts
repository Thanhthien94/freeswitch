import { api } from '@/lib/api-client';

// Enums matching backend
export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  POLICY_EVALUATED = 'policy_evaluated',
  ATTRIBUTE_CHANGED = 'attribute_changed',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  WEBSOCKET_TOKEN_GENERATED = 'websocket_token_generated',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
  INFO = 'info',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Types
export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: number;
  sessionId?: string;
  username?: string;
  action: AuditAction;
  result: AuditResult;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  domainId?: string;
  clientIp?: string;
  userAgent?: string;
  requestId?: string;
  riskLevel?: RiskLevel;
  riskScore?: number;
  threatIndicators?: string[];
  policiesEvaluated?: string[];
  permissionsChecked?: string[];
  rolesInvolved?: string[];
  metadata?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
  durationMs?: number;
  complianceTags?: string[];
  retentionUntil?: string;
  isSensitive?: boolean;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: number;
  username?: string;
  action?: AuditAction;
  result?: AuditResult;
  resourceType?: string;
  resourceId?: string;
  riskLevel?: RiskLevel;
  startDate?: string;
  endDate?: string;
  clientIp?: string;
  search?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  successfulActions: number;
  highRiskEvents: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ username: string; count: number }>;
  riskDistribution: Array<{ riskLevel: string; count: number }>;
}

export const auditService = {
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params?: AuditLogQueryParams): Promise<AuditLogResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    console.log('🔍 Audit Service: Fetching audit logs with params:', params);
    const response = await api.get<AuditLogResponse>(`/audit?${queryParams.toString()}`);
    console.log('✅ Audit Service: Response received:', response);
    
    return response;
  },

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(): Promise<AuditLogStats> {
    console.log('🔍 Audit Service: Fetching audit log statistics');
    const response = await api.get<AuditLogStats>('/audit-stats');
    console.log('✅ Audit Service: Stats received:', response);
    
    return response;
  },

  /**
   * Get specific audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    console.log('🔍 Audit Service: Fetching audit log by ID:', id);
    const response = await api.get<AuditLog>(`/audit/${id}`);
    console.log('✅ Audit Service: Audit log received:', response);
    
    return response;
  },

  /**
   * Get audit logs for specific user
   */
  async getUserAuditLogs(userId: number, limit?: number): Promise<AuditLog[]> {
    const queryParams = new URLSearchParams();
    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    console.log('🔍 Audit Service: Fetching user audit logs for user:', userId);
    const response = await api.get<AuditLog[]>(`/audit/user/${userId}?${queryParams.toString()}`);
    console.log('✅ Audit Service: User audit logs received:', response);
    
    return response;
  },

  /**
   * Get audit logs for specific resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit?: number
  ): Promise<AuditLog[]> {
    const queryParams = new URLSearchParams();
    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    console.log('🔍 Audit Service: Fetching resource audit logs for:', resourceType, resourceId);
    const response = await api.get<AuditLog[]>(
      `/audit/resource/${resourceType}/${resourceId}?${queryParams.toString()}`
    );
    console.log('✅ Audit Service: Resource audit logs received:', response);
    
    return response;
  },

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs(params?: AuditLogQueryParams): Promise<{ data: string; filename: string }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    console.log('🔍 Audit Service: Exporting audit logs with params:', params);
    const response = await api.get<{ data: string; filename: string; contentType: string }>(
      `/audit/export/csv?${queryParams.toString()}`
    );
    console.log('✅ Audit Service: Export completed');
    
    return {
      data: response.data,
      filename: response.filename,
    };
  },

  /**
   * Helper function to format audit action for display
   */
  formatAction(action: AuditAction): string {
    const actionMap: Record<AuditAction, string> = {
      [AuditAction.LOGIN]: 'Đăng nhập',
      [AuditAction.LOGOUT]: 'Đăng xuất',
      [AuditAction.ACCESS_GRANTED]: 'Cấp quyền truy cập',
      [AuditAction.ACCESS_DENIED]: 'Từ chối truy cập',
      [AuditAction.ROLE_ASSIGNED]: 'Gán vai trò',
      [AuditAction.ROLE_REVOKED]: 'Thu hồi vai trò',
      [AuditAction.PERMISSION_GRANTED]: 'Cấp quyền',
      [AuditAction.PERMISSION_REVOKED]: 'Thu hồi quyền',
      [AuditAction.POLICY_EVALUATED]: 'Đánh giá chính sách',
      [AuditAction.ATTRIBUTE_CHANGED]: 'Thay đổi thuộc tính',
      [AuditAction.PASSWORD_CHANGED]: 'Đổi mật khẩu',
      [AuditAction.ACCOUNT_LOCKED]: 'Khóa tài khoản',
      [AuditAction.ACCOUNT_UNLOCKED]: 'Mở khóa tài khoản',
      [AuditAction.MFA_ENABLED]: 'Bật MFA',
      [AuditAction.MFA_DISABLED]: 'Tắt MFA',
      [AuditAction.SUSPICIOUS_ACTIVITY]: 'Hoạt động đáng ngờ',
      [AuditAction.WEBSOCKET_TOKEN_GENERATED]: 'Tạo WebSocket token',
    };

    return actionMap[action] || action;
  },

  /**
   * Helper function to format audit result for display
   */
  formatResult(result: AuditResult): string {
    const resultMap: Record<AuditResult, string> = {
      [AuditResult.SUCCESS]: 'Thành công',
      [AuditResult.FAILURE]: 'Thất bại',
      [AuditResult.WARNING]: 'Cảnh báo',
      [AuditResult.INFO]: 'Thông tin',
    };

    return resultMap[result] || result;
  },

  /**
   * Helper function to format risk level for display
   */
  formatRiskLevel(riskLevel: RiskLevel): string {
    const riskMap: Record<RiskLevel, string> = {
      [RiskLevel.LOW]: 'Thấp',
      [RiskLevel.MEDIUM]: 'Trung bình',
      [RiskLevel.HIGH]: 'Cao',
      [RiskLevel.CRITICAL]: 'Nghiêm trọng',
    };

    return riskMap[riskLevel] || riskLevel;
  },

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(riskLevel: RiskLevel): string {
    const colorMap: Record<RiskLevel, string> = {
      [RiskLevel.LOW]: 'text-green-600 bg-green-50',
      [RiskLevel.MEDIUM]: 'text-yellow-600 bg-yellow-50',
      [RiskLevel.HIGH]: 'text-orange-600 bg-orange-50',
      [RiskLevel.CRITICAL]: 'text-red-600 bg-red-50',
    };

    return colorMap[riskLevel] || 'text-gray-600 bg-gray-50';
  },

  /**
   * Get result color for UI
   */
  getResultColor(result: AuditResult): string {
    const colorMap: Record<AuditResult, string> = {
      [AuditResult.SUCCESS]: 'text-green-600 bg-green-50',
      [AuditResult.FAILURE]: 'text-red-600 bg-red-50',
      [AuditResult.WARNING]: 'text-yellow-600 bg-yellow-50',
      [AuditResult.INFO]: 'text-blue-600 bg-blue-50',
    };

    return colorMap[result] || 'text-gray-600 bg-gray-50';
  },
};
