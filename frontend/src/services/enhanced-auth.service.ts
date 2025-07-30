import { api } from '@/lib/api-client';
import { validateToken, shouldRefreshToken, getUserFromToken, TokenValidationResult } from '@/utils/jwt.utils';
import { User, LoginRequest, LoginResponse } from './auth.service';

/**
 * Enhanced Authentication Service
 * With JWT validation, auto-refresh, and security improvements
 */

class EnhancedAuthService {
  private refreshPromise: Promise<LoginResponse> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Enhanced authentication check with JWT validation
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const validation = validateToken(token);
    return validation.isValid;
  }

  /**
   * Get token validation result
   */
  getTokenValidation(): TokenValidationResult {
    const token = this.getToken();
    return validateToken(token);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  /**
   * Store tokens securely
   */
  private storeTokens(accessToken: string, refreshToken?: string): void {
    try {
      localStorage.setItem('auth_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Get user from token or storage
   */
  getStoredUser(): User | null {
    try {
      // Try to get from token first
      const token = this.getToken();
      const userFromToken = getUserFromToken(token);
      
      if (userFromToken) {
        // Convert token payload to User format
        return {
          id: parseInt(userFromToken.sub || '0'),
          username: userFromToken.username || '',
          email: userFromToken.email || '',
          displayName: userFromToken.username || '',
          domainId: userFromToken.domainId || '',
          roles: userFromToken.roles || [],
          permissions: userFromToken.permissions || [],
          primaryRole: userFromToken.primaryRole || '',
        } as User;
      }

      // Fallback to localStorage
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Login with enhanced token management
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Store tokens
      this.storeTokens(response.access_token, response.refresh_token);
      
      // Store user data
      if (response.user) {
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }

      // Setup auto-refresh
      this.setupAutoRefresh();

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout with cleanup
   */
  async logout(): Promise<void> {
    try {
      // Clear refresh timer
      this.clearAutoRefresh();
      
      // Call logout API if token exists
      const token = this.getToken();
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearTokens();
    }
  }

  /**
   * Refresh token with deduplication
   */
  async refreshToken(): Promise<LoginResponse> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<LoginResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<LoginResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      // Store new tokens
      this.storeTokens(response.access_token, response.refresh_token);
      
      // Update user data if provided
      if (response.user) {
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }

      // Setup auto-refresh for new token
      this.setupAutoRefresh();

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    this.clearAutoRefresh();

    const token = this.getToken();
    if (!token) return;

    const validation = validateToken(token);
    if (!validation.isValid) return;

    // Schedule refresh 5 minutes before expiry
    const refreshIn = Math.max(0, validation.expiresIn - 300) * 1000;
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        // Could trigger logout or show notification
      }
    }, refreshIn);
  }

  /**
   * Clear auto-refresh timer
   */
  private clearAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Ensure valid token (refresh if needed)
   */
  async ensureValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    // Check if token needs refresh
    if (shouldRefreshToken(token)) {
      try {
        const response = await this.refreshToken();
        return response.access_token;
      } catch {
        return null;
      }
    }

    const validation = validateToken(token);
    return validation.isValid ? token : null;
  }

  /**
   * Get current user with fresh data
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    
    // Update stored user data
    localStorage.setItem('user_data', JSON.stringify(response));
    
    return response;
  }

  /**
   * Initialize service (call on app start)
   */
  initialize(): void {
    // Setup auto-refresh if authenticated
    if (this.isAuthenticated()) {
      this.setupAutoRefresh();
    }
  }
}

// Export singleton instance
export const enhancedAuthService = new EnhancedAuthService();
