import { api } from '@/lib/api-client';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

// Auth Service
export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // MOCK LOGIN FOR TESTING - Remove when API is ready
    if (credentials.email === 'admin@example.com' && credentials.password === 'password123') {
      const mockResponse: LoginResponse = {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        user: {
          id: '1',
          email: credentials.email,
          name: 'Admin User',
          role: 'admin',
          permissions: [
            'dashboard:read',
            'calls:read',
            'cdr:read',
            'recordings:read',
            'analytics:read',
            'users:read',
            'extensions:read',
            'reports:read',
            'system:read',
            'database:read',
            'security:read',
            'settings:read'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      // Store token in localStorage
      localStorage.setItem('auth_token', mockResponse.access_token);
      localStorage.setItem('refresh_token', mockResponse.refresh_token);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));

      return mockResponse;
    }

    // Real API call (commented out due to CORS issues)
    // const response = await api.post<LoginResponse>('/auth/login', credentials);
    //
    // // Store token in localStorage
    // if (response.data.access_token) {
    //   localStorage.setItem('auth_token', response.data.access_token);
    //   localStorage.setItem('refresh_token', response.data.refresh_token);
    //   localStorage.setItem('user', JSON.stringify(response.data.user));
    // }
    //
    // return response.data;

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
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    // Update tokens
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
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
};
