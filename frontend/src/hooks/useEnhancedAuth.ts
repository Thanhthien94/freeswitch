import { useState, useEffect, useCallback, useMemo } from 'react';
import { enhancedAuthService } from '@/services/enhanced-auth.service';
import { User, LoginRequest } from '@/services/auth.service';
import { TokenValidationResult } from '@/utils/jwt.utils';

export interface EnhancedAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  tokenValidation: TokenValidationResult | null;
}

export interface UseEnhancedAuthReturn extends EnhancedAuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  ensureValidToken: () => Promise<string | null>;
}

/**
 * Enhanced useAuth hook with JWT validation and auto-refresh
 */
export const useEnhancedAuth = (): UseEnhancedAuthReturn => {
  const [authState, setAuthState] = useState<EnhancedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: null,
    tokenValidation: null,
  });

  /**
   * Initialize auth state
   */
  const initializeAuth = useCallback(() => {
    try {
      const isAuthenticated = enhancedAuthService.isAuthenticated();
      const user = enhancedAuthService.getStoredUser();
      const token = enhancedAuthService.getToken();
      const tokenValidation = enhancedAuthService.getTokenValidation();

      setAuthState({
        user,
        isAuthenticated,
        isLoading: false,
        error: null,
        token,
        tokenValidation,
      });

      // Initialize auto-refresh
      enhancedAuthService.initialize();
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
        token: null,
        tokenValidation: null,
      });
    }
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await enhancedAuthService.login(credentials);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: response.access_token,
        tokenValidation: enhancedAuthService.getTokenValidation(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await enhancedAuthService.logout();
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        tokenValidation: null,
      });
    }
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const user = await enhancedAuthService.getCurrentUser();
      setAuthState(prev => ({ 
        ...prev, 
        user,
        tokenValidation: enhancedAuthService.getTokenValidation(),
      }));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails due to auth issues, logout
      if (error instanceof Error && error.message.includes('401')) {
        await logout();
      }
    }
  }, [authState.isAuthenticated, logout]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Ensure valid token
   */
  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await enhancedAuthService.ensureValidToken();
      
      // Update state if token changed
      if (token !== authState.token) {
        setAuthState(prev => ({
          ...prev,
          token,
          tokenValidation: enhancedAuthService.getTokenValidation(),
        }));
      }
      
      return token;
    } catch (error) {
      console.error('Failed to ensure valid token:', error);
      await logout();
      return null;
    }
  }, [authState.token, logout]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Listen for storage changes (multi-tab support)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user_data') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  /**
   * Periodic token validation
   */
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(() => {
      const currentValidation = enhancedAuthService.getTokenValidation();
      
      // Update validation state
      setAuthState(prev => ({
        ...prev,
        tokenValidation: currentValidation,
      }));

      // Auto-logout if token is invalid
      if (!currentValidation.isValid) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, logout]);

  /**
   * Memoized return value to prevent unnecessary re-renders
   */
  const returnValue = useMemo((): UseEnhancedAuthReturn => ({
    ...authState,
    login,
    logout,
    refreshUser,
    clearError,
    ensureValidToken,
  }), [authState, login, logout, refreshUser, clearError, ensureValidToken]);

  return returnValue;
};
