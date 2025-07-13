import React from 'react';
import { usePermissions, PermissionHookResult } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/services/auth.service';

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
  
  // Business hours gate
  requireBusinessHours?: boolean;
  
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
  requireBusinessHours,
  customAuth,
  fallback = null,
  showLoading = false,
  invert = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const permissions = usePermissions();

  // Show loading if requested
  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
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
  if (requireDomain && !permissions.canAccessDomain(requireDomain)) {
    hasAccess = false;
  }

  if (requireOwnDomain && requireDomain && user.domainId !== requireDomain) {
    hasAccess = false;
  }

  // Check security clearance
  if (requireMinimumClearance && !permissions.hasMinimumClearance(requireMinimumClearance)) {
    hasAccess = false;
  }

  // Check business hours
  if (requireBusinessHours && !isBusinessHours()) {
    hasAccess = false;
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

  function isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday to Friday, 9 AM to 6 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }
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

export const BusinessHoursGate: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireBusinessHours fallback={fallback}>
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
    requireBusinessHours 
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
    requireBusinessHours
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
