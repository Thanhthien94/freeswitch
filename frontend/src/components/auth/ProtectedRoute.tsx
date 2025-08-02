'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions, PermissionHookResult } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { User } from '@/services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Role-based protection
  requireRoles?: string[];
  requireAnyRole?: string[];
  
  // Permission-based protection
  requirePermissions?: string[];
  requireAnyPermission?: string[];
  
  // Domain-based protection
  requireDomain?: string;
  requireOwnDomain?: boolean;
  
  // Security clearance protection
  requireMinimumClearance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  

  
  // Custom authorization function
  customAuth?: (user: User, permissions: PermissionHookResult) => boolean;
  
  // Fallback component for unauthorized access
  fallback?: React.ReactNode;
  
  // Redirect path for unauthorized access
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRoles,
  requireAnyRole,
  requirePermissions,
  requireAnyPermission,
  requireDomain,
  requireOwnDomain,
  requireMinimumClearance,

  customAuth,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const permissions = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push(`${redirectTo}?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, user, router, redirectTo, pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check role requirements
  if (requireRoles && !requireRoles.every(role => permissions.hasRole(role))) {
    return renderUnauthorized(`Required roles: ${requireRoles.join(', ')}`);
  }

  if (requireAnyRole && !permissions.hasAnyRole(requireAnyRole)) {
    return renderUnauthorized(`Required any of roles: ${requireAnyRole.join(', ')}`);
  }

  // Check permission requirements
  if (requirePermissions && !requirePermissions.every(permission => permissions.hasPermission(permission))) {
    return renderUnauthorized(`Required permissions: ${requirePermissions.join(', ')}`);
  }

  if (requireAnyPermission && !permissions.hasAnyPermission(requireAnyPermission)) {
    return renderUnauthorized(`Required any of permissions: ${requireAnyPermission.join(', ')}`);
  }

  // Check domain requirements
  if (requireDomain && !permissions.canAccessDomain(requireDomain)) {
    return renderUnauthorized(`Access to domain '${requireDomain}' is required`);
  }

  if (requireOwnDomain && requireDomain && user.domainId !== requireDomain) {
    return renderUnauthorized('Access to your own domain is required');
  }

  // Check security clearance
  if (requireMinimumClearance && !permissions.hasMinimumClearance(requireMinimumClearance)) {
    return renderUnauthorized(`Minimum security clearance '${requireMinimumClearance}' is required`);
  }



  // Check custom authorization
  if (customAuth && !customAuth(user, permissions)) {
    return renderUnauthorized('Custom authorization check failed');
  }

  // All checks passed, render children
  return <>{children}</>;

  function renderUnauthorized(reason: string) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm">{reason}</p>
                <div className="text-xs text-muted-foreground">
                  <p>Current user: {user?.displayName} ({user?.primaryRole})</p>
                  <p>Security clearance: {permissions.securityClearance}</p>
                  <p>Domain: {user?.domain?.displayName}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }


};

// Convenience components for common protection patterns
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAnyRole={['SuperAdmin', 'SystemAdmin', 'DomainAdmin']}>
    {children}
  </ProtectedRoute>
);

export const DomainAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAnyRole={['SuperAdmin', 'DomainAdmin']}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAnyRole={['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'CallCenterManager']}>
    {children}
  </ProtectedRoute>
);

export const SupervisorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAnyRole={['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor', 'TeamLead']}>
    {children}
  </ProtectedRoute>
);

export const HighSecurityRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireMinimumClearance="HIGH">
    {children}
  </ProtectedRoute>
);

export const CriticalSecurityRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireMinimumClearance="CRITICAL">
    {children}
  </ProtectedRoute>
);



export const CDRRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute
    requireAnyPermission={['cdr:read', 'cdr:execute']}
  >
    {children}
  </ProtectedRoute>
);

export const RecordingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requireAnyPermission={['recordings:read', 'recordings:execute']}
    requireMinimumClearance="HIGH"
  >
    {children}
  </ProtectedRoute>
);

export const BillingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute
    requireAnyPermission={['billing:read', 'billing:manage']}
    requireMinimumClearance="HIGH"
  >
    {children}
  </ProtectedRoute>
);

export const SystemConfigRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requireAnyRole={['SuperAdmin', 'SystemAdmin']}
    requireAnyPermission={['system:manage', 'config:update']}
    requireMinimumClearance="CRITICAL"
  >
    {children}
  </ProtectedRoute>
);
