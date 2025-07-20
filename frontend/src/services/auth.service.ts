import { api } from '@/lib/api-client';

// Auth Types
export interface LoginRequest {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  domainId: string;
  roles: string[];
  permissions: string[];
  primaryRole: string;
  // Additional user info
  firstName?: string;
  lastName?: string;
  extension?: string;
  isActive?: boolean;
  domain?: {
    id: string;
    name: string;
    displayName: string;
  };
  // Security attributes
  securityClearance?: string;
  lastLogin?: string;
  accountAge?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserAttributes {
  securityClearance: string;
  mfaEnabled: boolean;
  allowedIpRanges: string[];
  workingHours: Array<{
    start: string;
    end: string;
    days: number[];
  }>;
  emergencyAccess: boolean;
  employeeId: string;
  costCenter: string;
  contractType: string;
}

export interface PolicyEvaluationResult {
  decision: 'ALLOW' | 'DENY' | 'INDETERMINATE';
  reason: string;
  appliedPolicies: string[];
  obligations: string[];
  riskScore: number;
  evaluationTime: number;
}

// Auth Service
export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);

      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Create session cookie for middleware protection
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: response.data.user.id,
              token: response.data.access_token,
            }),
          });
        } catch (sessionError) {
          console.warn('Failed to create session cookie:', sessionError);
          // Don't fail login if session creation fails
        }
      }

      return response.data;
    } catch (error: any) {
      // Handle different types of errors
      if (error.response?.status === 401) {
        throw new Error('Email hoặc mật khẩu không đúng');
      } else if (error.response?.status === 403) {
        throw new Error('Tài khoản đã bị khóa hoặc không có quyền truy cập');
      } else if (error.response?.status >= 500) {
        throw new Error('Lỗi hệ thống, vui lòng thử lại sau');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng');
      } else {
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
      }
    }
  },

  // Register
  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Clear session cookie
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      } catch (sessionError) {
        console.warn('Failed to clear session cookie:', sessionError);
        // Don't fail logout if session clearing fails
      }
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      console.warn('Get current user failed:', error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await api.post<LoginResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      // Update tokens
      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      console.warn('Refresh token failed:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    try {
      return !!localStorage.getItem('auth_token');
    } catch {
      return false;
    }
  },

  // Get stored user
  getStoredUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Force clear all auth data (for fixing auth loops)
  forceClearAuth: (): void => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      // Also clear any other auth-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('auth_') || key === 'user' || key === 'token') {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  // Check if user has specific role
  hasRole: (roleName: string): boolean => {
    const user = authService.getStoredUser();
    return user?.roles?.includes(roleName) || false;
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roleNames: string[]): boolean => {
    const user = authService.getStoredUser();
    return roleNames.some(role => user?.roles?.includes(role)) || false;
  },

  // Check if user has specific permission
  hasPermission: (permission: string): boolean => {
    const user = authService.getStoredUser();
    if (!user?.permissions) return false;

    // Check for exact permission or wildcard
    return user.permissions.includes(permission) ||
           user.permissions.includes('*:manage') ||
           user.permissions.some(p => {
             const [resource, action] = p.split(':');
             const [reqResource] = permission.split(':');
             return resource === reqResource && (action === 'manage' || action === '*');
           });
  },

  // Check if user has any of the specified permissions
  hasAnyPermission: (permissions: string[]): boolean => {
    return permissions.some(permission => authService.hasPermission(permission));
  },

  // Check if user can access domain
  canAccessDomain: (domainId: string): boolean => {
    const user = authService.getStoredUser();
    if (!user) return false;

    // SuperAdmin can access all domains
    if (user.roles.includes('SuperAdmin')) return true;

    // User can access their own domain
    return user.domainId === domainId;
  },

  // Get user's security clearance level
  getSecurityClearance: (): string => {
    const user = authService.getStoredUser();
    return user?.securityClearance || 'LOW';
  },

  // Check if user has minimum security clearance
  hasMinimumClearance: (requiredLevel: string): boolean => {
    const clearanceLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const userLevel = authService.getSecurityClearance();
    const userIndex = clearanceLevels.indexOf(userLevel);
    const requiredIndex = clearanceLevels.indexOf(requiredLevel);

    return userIndex >= requiredIndex;
  },

  // Get user attributes
  getUserAttributes: async (): Promise<UserAttributes | null> => {
    try {
      const response = await api.get<UserAttributes>('/auth/attributes');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user attributes:', error);
      return null;
    }
  },

  // Update user attributes
  updateUserAttributes: async (attributes: Partial<UserAttributes>): Promise<void> => {
    await api.put('/auth/attributes', attributes);
  },

  // Evaluate policy for resource access
  evaluatePolicy: async (resource: string, action: string, context?: unknown): Promise<PolicyEvaluationResult> => {
    try {
      const response = await api.post<PolicyEvaluationResult>('/auth/evaluate-policy', {
        resource,
        action,
        context,
      });
      return response.data;
    } catch (error) {
      console.error('Policy evaluation failed:', error);
      return {
        decision: 'DENY',
        reason: 'Policy evaluation failed',
        appliedPolicies: [],
        obligations: [],
        riskScore: 100,
        evaluationTime: 0,
      };
    }
  },

  // Check if current time is within business hours
  isBusinessHours: (): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday to Friday, 9 AM to 6 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  },

  // Get current risk score based on context
  getCurrentRiskScore: (): number => {
    let riskScore = 0;

    // Increase risk for non-business hours
    if (!authService.isBusinessHours()) {
      riskScore += 20;
    }

    // Increase risk for mobile devices (simplified check)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      riskScore += 10;
    }

    // Additional risk factors could be added here

    return Math.min(riskScore, 100);
  },
};
