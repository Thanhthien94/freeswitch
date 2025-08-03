import React from 'react';
import { useUser, usePermissions } from '@/components/providers/UserProvider';
import type { User } from '@/lib/auth';

// Define PermissionHookResult type for compatibility
interface PermissionHookResult {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  permissions: string[];
  roles: string[];
  primaryRole: string | null;
}

interface PermissionGateProps {
  children: React.ReactNode;
  
  // Role-based gates
  requireRoles?: string[];
  requireAnyRole?: string[];
  
  // Permission-based gates
  requirePermissions?: string[];
  requireAnyPermission?: string[];
  
  // Domain-based gates
  requireDomain?: string;
  requireOwnDomain?: boolean;
  
  // Security clearance gates
  requireMinimumClearance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  

  
  // Custom authorization function
  customAuth?: (user: User, permissions: PermissionHookResult) => boolean;
  
  // Fallback component when access is denied
  fallback?: React.ReactNode;
  
  // Show loading state
  showLoading?: boolean;
  
  // Invert the logic (show when NOT authorized)
  invert?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requireRoles,
  requireAnyRole,
  requirePermissions,
  requireAnyPermission,
  requireDomain,
  requireOwnDomain,
  requireMinimumClearance,

  customAuth,
  fallback = null,
  showLoading = false,
  invert = false,
}) => {
  const { user, isLoading } = useUser();
  const permissions = usePermissions();

  // Show loading if requested
  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  // Not authenticated
  if (!user) {
    return invert ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Check role requirements
  if (requireRoles && !requireRoles.every(role => permissions.hasRole(role))) {
    hasAccess = false;
  }

  if (requireAnyRole && !permissions.hasAnyRole(requireAnyRole)) {
    hasAccess = false;
  }

  // Check permission requirements
  if (requirePermissions && !requirePermissions.every(permission => permissions.hasPermission(permission))) {
    hasAccess = false;
  }

  if (requireAnyPermission && !permissions.hasAnyPermission(requireAnyPermission)) {
    hasAccess = false;
  }

  // Check domain requirements
  if (requireDomain && user.domainId !== requireDomain) {
    hasAccess = false;
  }

  if (requireOwnDomain && requireDomain && user.domainId !== requireDomain) {
    hasAccess = false;
  }

  // Check security clearance (simplified - always allow for now)
  if (requireMinimumClearance) {
    // TODO: Implement security clearance check
    // For now, allow all access
  }



  // Check custom authorization
  if (customAuth && !customAuth(user, permissions)) {
    hasAccess = false;
  }

  // Apply invert logic
  if (invert) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;


};

// Convenience components for common permission patterns
export const AdminGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireAnyRole={['SuperAdmin', 'SystemAdmin', 'DomainAdmin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const DomainAdminGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireAnyRole={['SuperAdmin', 'DomainAdmin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const ManagerGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireAnyRole={['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'CallCenterManager']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const SupervisorGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireAnyRole={['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor', 'TeamLead']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const HighSecurityGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireMinimumClearance="HIGH" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CriticalSecurityGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireMinimumClearance="CRITICAL" fallback={fallback}>
    {children}
  </PermissionGate>
);



// Resource-specific gates
export const UserManagementGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'create' | 'update' | 'delete' | 'manage';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate requirePermissions={[`users:${action}`]} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CDRGate: React.FC<{
  children: React.ReactNode;
  action?: 'read' | 'execute' | 'delete';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate
    requirePermissions={[`cdr:${action}`]}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const RecordingGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'execute' | 'delete';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate 
    requirePermissions={[`recordings:${action}`]} 
    requireMinimumClearance="HIGH" 
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const BillingGate: React.FC<{
  children: React.ReactNode;
  action?: 'read' | 'manage';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate
    requirePermissions={[`billing:${action}`]}
    requireMinimumClearance="HIGH"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const ReportsGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'create' | 'execute';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate requirePermissions={[`reports:${action}`]} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const AnalyticsGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'execute';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate requirePermissions={[`analytics:${action}`]} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const SystemGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'manage';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate 
    requirePermissions={[`system:${action}`]} 
    requireAnyRole={['SuperAdmin', 'SystemAdmin']}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const ConfigGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'update';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate requirePermissions={[`config:${action}`]} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const SecurityGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'manage';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate 
    requirePermissions={[`security:${action}`]} 
    requireMinimumClearance="HIGH"
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

export const MonitoringGate: React.FC<{ 
  children: React.ReactNode; 
  action?: 'read' | 'execute';
  fallback?: React.ReactNode;
}> = ({ children, action = 'read', fallback }) => (
  <PermissionGate requirePermissions={[`monitoring:${action}`]} fallback={fallback}>
    {children}
  </PermissionGate>
);
