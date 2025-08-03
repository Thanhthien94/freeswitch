import { api } from '@/lib/api-client';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  domainId: string;
  domain?: {
    id: string;
    name: string;
    displayName: string;
  };
  roles: string[];
  permissions: string[];
  primaryRole: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  profilePicture?: string;
  timezone?: string;
  language?: string;
  preferences?: Record<string, any>;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  domainId: string;
  roles: string[];
  status?: 'active' | 'inactive';
  timezone?: string;
  language?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  domainId?: string;
  roles?: string[];
  status?: 'active' | 'inactive' | 'suspended';
  timezone?: string;
  language?: string;
  preferences?: Record<string, any>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  onlineUsers: number;
  usersByRole: Record<string, number>;
  usersByDomain: Record<string, number>;
  usersByDepartment: Record<string, number>;
  recentRegistrations: number;
  lastLoginStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

class UserService {
  private baseUrl = '/users';

  async getUsers(query: UserQuery = {}): Promise<UserListResponse> {
    const params = new URLSearchParams();

    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.domainId) params.append('domainId', query.domainId);
    if (query.role) params.append('role', query.role);
    if (query.status) params.append('status', query.status);
    if (query.department) params.append('department', query.department);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await api.get<UserListResponse>(url);
    return response;
  }

  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return api.post<User>(this.baseUrl, userData);
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    return api.put<User>(`${this.baseUrl}/${id}`, userData);
  }

  async deleteUser(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async changePassword(id: number, passwordData: ChangePasswordRequest): Promise<void> {
    await api.post(`${this.baseUrl}/${id}/change-password`, passwordData);
  }

  async resetPassword(id: number): Promise<{ temporaryPassword: string }> {
    return api.post<{ temporaryPassword: string }>(`${this.baseUrl}/${id}/reset-password`);
  }

  async toggleUserStatus(id: number, status: 'active' | 'inactive' | 'suspended'): Promise<User> {
    return api.patch<User>(`${this.baseUrl}/${id}/status`, { status });
  }

  async assignRoles(id: number, roles: string[]): Promise<User> {
    return api.patch<User>(`${this.baseUrl}/${id}/roles`, { roles });
  }

  async getUserStats(): Promise<UserStatsResponse> {
    const response = await api.get<UserStatsResponse>(`${this.baseUrl}/stats`);
    return response;
  }

  async getUserActivity(id: number, days: number = 30): Promise<any[]> {
    const response = await api.get<any[]>(`${this.baseUrl}/${id}/activity?days=${days}`);
    return response;
  }

  async getUserSessions(id: number): Promise<any[]> {
    const response = await api.get<any[]>(`${this.baseUrl}/${id}/sessions`);
    return response;
  }

  async terminateUserSession(id: number, sessionId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}/sessions/${sessionId}`);
  }

  async enableTwoFactor(id: number): Promise<{ qrCode: string; secret: string }> {
    return api.post<{ qrCode: string; secret: string }>(`${this.baseUrl}/${id}/2fa/enable`);
  }

  async disableTwoFactor(id: number): Promise<void> {
    await api.post(`${this.baseUrl}/${id}/2fa/disable`);
  }

  async verifyTwoFactor(id: number, token: string): Promise<void> {
    await api.post(`${this.baseUrl}/${id}/2fa/verify`, { token });
  }

  async uploadProfilePicture(id: number, file: File): Promise<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<{ profilePicture: string }>(
      `${this.baseUrl}/${id}/profile-picture`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  async deleteProfilePicture(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}/profile-picture`);
  }

  async getUserPreferences(id: number): Promise<Record<string, any>> {
    const response = await api.get<Record<string, any>>(`${this.baseUrl}/${id}/preferences`);
    return response;
  }

  async updateUserPreferences(id: number, preferences: Record<string, any>): Promise<void> {
    await api.put(`${this.baseUrl}/${id}/preferences`, preferences);
  }

  async bulkUpdateUsers(userIds: number[], updates: Partial<UpdateUserRequest>): Promise<void> {
    await api.patch(`${this.baseUrl}/bulk`, { userIds, updates });
  }

  async bulkDeleteUsers(userIds: number[]): Promise<void> {
    await api.patch(`${this.baseUrl}/bulk-delete`, { userIds });
  }

  async exportUsers(query: UserQuery = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (query.domainId) params.append('domainId', query.domainId);
    if (query.role) params.append('role', query.role);
    if (query.status) params.append('status', query.status);
    if (query.department) params.append('department', query.department);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/export?${queryString}` : `${this.baseUrl}/export`;
    
    const response = await api.get<Blob>(url, {
      responseType: 'blob',
    });
    return response;
  }

  async importUsers(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{ success: number; failed: number; errors: string[] }>(
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

export const userService = new UserService();
export default userService;
