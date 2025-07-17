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
    // Try real API first, fallback to mock for development
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);

      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.warn('Real API login failed, using mock data for development:', error);
    }

    // MOCK LOGIN FOR DEVELOPMENT FALLBACK
    const mockUsers = {
      'admin@localhost': {
        password: 'admin123',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@localhost',
          displayName: 'System Administrator',
          domainId: 'localhost',
          roles: ['SuperAdmin', 'DomainAdmin'],
          permissions: ['*:manage', 'system:*', 'domain:*', 'users:*', 'cdr:*', 'recordings:*', 'billing:*'],
          primaryRole: 'SuperAdmin',
          firstName: 'System',
          lastName: 'Administrator',
          extension: '1000',
          isActive: true,
          domain: {
            id: 'localhost',
            name: 'localhost',
            displayName: 'Local Development Domain',
          },
          securityClearance: 'CRITICAL',
          lastLogin: new Date().toISOString(),
          accountAge: Date.now() - new Date('2023-01-01').getTime(),
        }
      },
      'manager@localhost': {
        password: 'manager123',
        user: {
          id: 2,
          username: 'manager',
          email: 'manager@localhost',
          displayName: 'John Manager',
          domainId: 'localhost',
          roles: ['DepartmentManager'],
          permissions: ['users:read', 'users:create', 'users:update', 'calls:read', 'calls:execute', 'cdr:read', 'reports:read', 'reports:execute'],
          primaryRole: 'DepartmentManager',
          firstName: 'John',
          lastName: 'Manager',
          extension: '1001',
          isActive: true,
          domain: {
            id: 'localhost',
            name: 'localhost',
            displayName: 'Local Development Domain',
          },
          securityClearance: 'HIGH',
          lastLogin: new Date().toISOString(),
          accountAge: Date.now() - new Date('2023-06-01').getTime(),
        }
      },
      'agent@localhost': {
        password: 'agent123',
        user: {
          id: 3,
          username: 'agent',
          email: 'agent@localhost',
          displayName: 'Bob Agent',
          domainId: 'localhost',
          roles: ['Agent'],
          permissions: ['calls:read', 'calls:create', 'calls:execute'],
          primaryRole: 'Agent',
          firstName: 'Bob',
          lastName: 'Agent',
          extension: '1003',
          isActive: true,
          domain: {
            id: 'localhost',
            name: 'localhost',
            displayName: 'Local Development Domain',
          },
          securityClearance: 'LOW',
          lastLogin: new Date().toISOString(),
          accountAge: Date.now() - new Date('2023-09-01').getTime(),
        }
      }
    };

    const mockUser = mockUsers[credentials.emailOrUsername as keyof typeof mockUsers];

    if (mockUser && mockUser.password === credentials.password) {
      const mockResponse: LoginResponse = {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: credentials.rememberMe ? 'mock-refresh-token-' + Date.now() : undefined,
        user: mockUser.user,
        expiresIn: credentials.rememberMe ? 604800 : 3600,
        tokenType: 'Bearer',
      };

      // Store token in localStorage
      localStorage.setItem('auth_token', mockResponse.access_token);
      if (mockResponse.refresh_token) {
        localStorage.setItem('refresh_token', mockResponse.refresh_token);
      }
      localStorage.setItem('user', JSON.stringify(mockResponse.user));

      return mockResponse;
    }

    throw new Error('Invalid credentials');
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
    return !!localStorage.getItem('auth_token');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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
