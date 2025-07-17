import { useState, useEffect, useCallback } from 'react';
import { authService, User, LoginRequest, RegisterRequest } from '@/services/auth.service';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getStoredUser();
        const token = authService.getToken();

        setAuthState({
          user,
          isAuthenticated,
          isLoading: false,
          error: null,
          token,
        });
      } catch {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
          token: null,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.login(credentials);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: response.access_token,
      });
      
      return response;
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

  // Register function
  const register = useCallback(async (userData: RegisterRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.register(userData);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: null, // Register doesn't return token in this flow
      });
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
      });
    } catch {
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
      });
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const user = await authService.getCurrentUser();
      setAuthState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [authState.isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };
};
