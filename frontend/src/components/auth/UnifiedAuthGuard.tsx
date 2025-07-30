'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface AuthRequirements {
  // Basic auth
  requireAuth?: boolean;
  
  // Role-based
  requireRoles?: string[];
  requireAnyRole?: string[];
  
  // Permission-based
  requirePermissions?: string[];
  requireAnyPermission?: string[];
  
  // Domain-based
  requireDomain?: string;
  requireOwnDomain?: boolean;
  
  // Security clearance
  requireMinimumClearance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Business hours
  requireBusinessHours?: boolean;
  
  // Custom authorization
  customAuth?: (user: any, permissions: any) => boolean;
}

export interface UnifiedAuthGuardProps extends AuthRequirements {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  showError?: boolean;
  onUnauthorized?: () => void;
}

/**
 * Unified Auth Guard Component
 * Replaces AuthGuard and ProtectedRoute with enhanced functionality
 */
export const UnifiedAuthGuard: React.FC<UnifiedAuthGuardProps> = ({
  children,
  requireAuth = true,
  requireRoles,
  requireAnyRole,
  requirePermissions,
  requireAnyPermission,
  requireDomain,
  requireOwnDomain,
  requireMinimumClearance,
  requireBusinessHours,
  customAuth,
  redirectTo = '/login',
  fallback,
  showError = true,
  onUnauthorized,
}) => {
  const { user, isAuthenticated, isLoading, tokenValidation } = useEnhancedAuth();
  const permissions = useEnhancedPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Check all authorization requirements
   */
  const authorizationResult = useMemo(() => {
    // Not authenticated
    if (requireAuth && (!isAuthenticated || !user)) {
      return {
        authorized: false,
        reason: 'Authentication required',
        action: 'redirect'
      };
    }

    // Skip further checks if auth not required
    if (!requireAuth) {
      return { authorized: true, reason: null, action: null };
    }

    // Token validation
    if (tokenValidation && !tokenValidation.isValid) {
      return {
        authorized: false,
        reason: tokenValidation.error || 'Invalid token',
        action: 'redirect'
      };
    }

    // Role checks
    if (requireRoles && !requireRoles.every(role => permissions.hasRole(role))) {
      return {
        authorized: false,
        reason: `Missing required roles: ${requireRoles.join(', ')}`,
        action: 'error'
      };
    }

    if (requireAnyRole && !requireAnyRole.some(role => permissions.hasRole(role))) {
      return {
        authorized: false,
        reason: `Missing any of required roles: ${requireAnyRole.join(', ')}`,
        action: 'error'
      };
    }

    // Permission checks
    if (requirePermissions && !requirePermissions.every(perm => permissions.hasPermission(perm))) {
      return {
        authorized: false,
        reason: `Missing required permissions: ${requirePermissions.join(', ')}`,
        action: 'error'
      };
    }

    if (requireAnyPermission && !requireAnyPermission.some(perm => permissions.hasPermission(perm))) {
      return {
        authorized: false,
        reason: `Missing any of required permissions: ${requireAnyPermission.join(', ')}`,
        action: 'error'
      };
    }

    // Domain checks
    if (requireDomain && user?.domainId !== requireDomain) {
      return {
        authorized: false,
        reason: `Access restricted to domain: ${requireDomain}`,
        action: 'error'
      };
    }

    if (requireOwnDomain && !permissions.canAccessDomain(user?.domainId || '')) {
      return {
        authorized: false,
        reason: 'Access restricted to own domain',
        action: 'error'
      };
    }

    // Security clearance check
    if (requireMinimumClearance) {
      const clearanceLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const userClearance = clearanceLevels[permissions.securityClearance as keyof typeof clearanceLevels] || 0;
      const requiredClearance = clearanceLevels[requireMinimumClearance];
      
      if (userClearance < requiredClearance) {
        return {
          authorized: false,
          reason: `Insufficient security clearance. Required: ${requireMinimumClearance}`,
          action: 'error'
        };
      }
    }

    // Business hours check
    if (requireBusinessHours) {
      const now = new Date();
      const hour = now.getHours();
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
      const isBusinessHours = isWeekday && hour >= 9 && hour < 17;
      
      if (!isBusinessHours) {
        return {
          authorized: false,
          reason: 'Access restricted to business hours (9 AM - 5 PM, weekdays)',
          action: 'error'
        };
      }
    }

    // Custom authorization
    if (customAuth && !customAuth(user, permissions)) {
      return {
        authorized: false,
        reason: 'Custom authorization failed',
        action: 'error'
      };
    }

    return { authorized: true, reason: null, action: null };
  }, [
    requireAuth, isAuthenticated, user, tokenValidation,
    requireRoles, requireAnyRole, requirePermissions, requireAnyPermission,
    requireDomain, requireOwnDomain, requireMinimumClearance,
    requireBusinessHours, customAuth, permissions
  ]);

  /**
   * Handle authorization result
   */
  useEffect(() => {
    if (isLoading) return;

    const { authorized, reason, action } = authorizationResult;

    if (!authorized) {
      setAuthError(reason);
      
      if (action === 'redirect') {
        const loginUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
        router.push(loginUrl);
        return;
      }
      
      if (onUnauthorized) {
        onUnauthorized();
      }
      
      setShouldRender(false);
    } else {
      setAuthError(null);
      setShouldRender(true);
    }
  }, [isLoading, authorizationResult, redirectTo, pathname, router, onUnauthorized]);

  /**
   * Handle already authenticated user on login page
   */
  useEffect(() => {
    if (!requireAuth && isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [requireAuth, isAuthenticated, pathname, router]);

  // Show loading
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (authError && showError && authorizationResult.action === 'error') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="font-medium mb-2">Access Denied</div>
              <div className="text-sm mb-4">{authError}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show redirecting
  if (!shouldRender) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Convenience components
export const ProtectedPage: React.FC<{ 
  children: React.ReactNode;
  requirements?: AuthRequirements;
}> = ({ children, requirements = {} }) => (
  <UnifiedAuthGuard requireAuth={true} {...requirements}>
    {children}
  </UnifiedAuthGuard>
);

export const PublicPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedAuthGuard requireAuth={false}>
    {children}
  </UnifiedAuthGuard>
);

export const AdminPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnifiedAuthGuard 
    requireAuth={true}
    requireAnyRole={['SuperAdmin', 'DomainAdmin']}
    requireMinimumClearance="HIGH"
  >
    {children}
  </UnifiedAuthGuard>
);
