import { useMemo } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from './useAuth';

export interface PermissionHookResult {
  // Basic checks
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  // Convenience checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDomainAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isAgent: boolean;
  isUser: boolean;

  // Resource-specific permissions
  canReadUsers: boolean;
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canManageUsers: boolean;

  canReadCDR: boolean;
  canExportCDR: boolean;
  canDeleteCDR: boolean;
  canManageCDR: boolean;

  canReadRecordings: boolean;
  canDownloadRecordings: boolean;
  canDeleteRecordings: boolean;
  canManageRecordings: boolean;

  canReadBilling: boolean;
  canManageBilling: boolean;

  canReadReports: boolean;
  canCreateReports: boolean;
  canExecuteReports: boolean;
  canManageReports: boolean;

  canReadAnalytics: boolean;
  canExecuteAnalytics: boolean;
  canManageAnalytics: boolean;

  canReadSystem: boolean;
  canManageSystem: boolean;

  canReadConfig: boolean;
  canUpdateConfig: boolean;
  canManageConfig: boolean;

  canReadSecurity: boolean;
  canManageSecurity: boolean;

  canReadMonitoring: boolean;
  canExecuteMonitoring: boolean;
  canManageMonitoring: boolean;

  canReadExtensions: boolean;
  canManageExtensions: boolean;
  canReadCalls: boolean;
  canManageCalls: boolean;

  // Domain and security
  canAccessDomain: (domainId: string) => boolean;
  securityClearance: string;
  hasMinimumClearance: (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => boolean;

  // Business logic
  isBusinessHours: boolean;
  canAccessDuringBusinessHours: boolean;
  canManageSubordinates: boolean;
  canAccessFinancialData: boolean;
  canPerformCriticalOperations: boolean;
  canAccessAuditLogs: boolean;

  // User info
  userRoles: string[];
  userPermissions: string[];
  primaryRole: string;
  domainId: string;
}

export const usePermissions = (): PermissionHookResult => {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    if (!isAuthenticated || !user) {
      // Return all false permissions for unauthenticated users
      return {
        hasRole: () => false,
        hasPermission: () => false,
        hasAnyRole: () => false,
        hasAnyPermission: () => false,
        hasAllRoles: () => false,
        hasAllPermissions: () => false,
        isAdmin: false,
        isSuperAdmin: false,
        isDomainAdmin: false,
        isManager: false,
        isSupervisor: false,
        isAgent: false,
        isUser: false,
        
        canReadUsers: false,
        canCreateUsers: false,
        canUpdateUsers: false,
        canDeleteUsers: false,
        canManageUsers: false,
        
        canReadCDR: false,
        canExportCDR: false,
        canDeleteCDR: false,
        canManageCDR: false,
        
        canReadRecordings: false,
        canDownloadRecordings: false,
        canDeleteRecordings: false,
        canManageRecordings: false,
        
        canReadBilling: false,
        canManageBilling: false,
        
        canReadReports: false,
        canCreateReports: false,
        canExecuteReports: false,
        canManageReports: false,
        
        canReadAnalytics: false,
        canExecuteAnalytics: false,
        canManageAnalytics: false,
        
        canReadSystem: false,
        canManageSystem: false,
        
        canReadConfig: false,
        canUpdateConfig: false,
        canManageConfig: false,
        
        canReadSecurity: false,
        canManageSecurity: false,
        
        canReadMonitoring: false,
        canExecuteMonitoring: false,
        canManageMonitoring: false,

        canReadExtensions: false,
        canManageExtensions: false,
        canReadCalls: false,
        canManageCalls: false,

        canAccessDomain: () => false,
        securityClearance: 'LOW',
        hasMinimumClearance: () => false,

        isBusinessHours: false,
        canAccessDuringBusinessHours: false,
        canManageSubordinates: false,
        canAccessFinancialData: false,
        canPerformCriticalOperations: false,
        canAccessAuditLogs: false,

        userRoles: [],
        userPermissions: [],
        primaryRole: '',
        domainId: '',
      };
    }

    // Helper functions
    const hasRole = (roleName: string) => authService.hasRole(roleName);
    const hasAnyRole = (roleNames: string[]) => authService.hasAnyRole(roleNames);
    const hasPermission = (permission: string) => authService.hasPermission(permission);
    const hasAnyPermission = (permissions: string[]) => authService.hasAnyPermission(permissions);
    const hasAllRoles = (roles: string[]) => roles.every(role => hasRole(role));
    const hasAllPermissions = (permissions: string[]) => permissions.every(perm => hasPermission(perm));
    const canAccessDomain = (domainId: string) => authService.canAccessDomain(domainId);
    const hasMinimumClearance = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => authService.hasMinimumClearance(level);

    // Role checks
    const isSuperAdmin = hasRole('SuperAdmin');
    const isAdmin = hasAnyRole(['SuperAdmin', 'SystemAdmin', 'DomainAdmin']);
    const isDomainAdmin = hasAnyRole(['SuperAdmin', 'DomainAdmin']);
    const isManager = hasAnyRole(['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'CallCenterManager']);
    const isSupervisor = hasAnyRole(['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor', 'TeamLead']);
    const isAgent = hasAnyRole(['Agent', 'SeniorAgent', 'Operator', 'Receptionist']);
    const isUser = hasRole('User');

    // Resource permissions
    const canReadUsers = hasPermission('users:read');
    const canCreateUsers = hasPermission('users:create');
    const canUpdateUsers = hasPermission('users:update');
    const canDeleteUsers = hasPermission('users:delete');
    const canManageUsers = hasPermission('users:manage');

    const canReadCDR = hasPermission('cdr:read');
    const canExportCDR = hasPermission('cdr:execute');
    const canDeleteCDR = hasPermission('cdr:delete');
    const canManageCDR = hasPermission('cdr:manage');

    const canReadRecordings = hasPermission('recordings:read');
    const canDownloadRecordings = hasPermission('recordings:execute');
    const canDeleteRecordings = hasPermission('recordings:delete');
    const canManageRecordings = hasPermission('recordings:manage');

    const canReadBilling = hasPermission('billing:read');
    const canManageBilling = hasPermission('billing:manage');

    const canReadReports = hasPermission('reports:read');
    const canCreateReports = hasPermission('reports:create');
    const canExecuteReports = hasPermission('reports:execute');
    const canManageReports = hasPermission('reports:manage');

    const canReadAnalytics = hasPermission('analytics:read');
    const canExecuteAnalytics = hasPermission('analytics:execute');
    const canManageAnalytics = hasPermission('analytics:manage');

    const canReadSystem = hasPermission('system:read');
    const canManageSystem = hasPermission('system:manage');

    const canReadConfig = hasPermission('config:read');
    const canUpdateConfig = hasPermission('config:update');
    const canManageConfig = hasPermission('config:manage');

    const canReadSecurity = hasPermission('security:read');
    const canManageSecurity = hasPermission('security:manage');

    const canReadMonitoring = hasPermission('monitoring:read');
    const canExecuteMonitoring = hasPermission('monitoring:execute');
    const canManageMonitoring = hasPermission('monitoring:manage');

    // Extensions and calls permissions
    const canReadExtensions = hasPermission('extensions:read');
    const canManageExtensions = hasPermission('extensions:manage');
    const canReadCalls = hasPermission('calls:read');
    const canManageCalls = hasPermission('calls:manage');

    // Business logic permissions
    const canManageSubordinates = isManager || isSupervisor;
    const canAccessFinancialData = hasAnyRole(['SuperAdmin', 'BillingAdmin', 'DomainAdmin']) && 
                                   hasMinimumClearance('HIGH');
    const canPerformCriticalOperations = hasAnyRole(['SuperAdmin', 'SystemAdmin']) && 
                                        hasMinimumClearance('CRITICAL');
    const canAccessAuditLogs = hasAnyRole(['SuperAdmin', 'SecurityAdmin', 'DomainAdmin']);

    const securityClearance = authService.getSecurityClearance();

    // Business hours logic
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isBusinessHours = isWeekday && hour >= 9 && hour < 17;
    const canAccessDuringBusinessHours = isBusinessHours || isSuperAdmin;

    // User info
    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];
    const primaryRole = user?.primaryRole || '';
    const domainId = user?.domainId || '';

    return {
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAnyPermission,
      hasAllRoles,
      hasAllPermissions,

      isAdmin,
      isSuperAdmin,
      isDomainAdmin,
      isManager,
      isSupervisor,
      isAgent,
      isUser,
      
      canReadUsers,
      canCreateUsers,
      canUpdateUsers,
      canDeleteUsers,
      canManageUsers,
      
      canReadCDR,
      canExportCDR,
      canDeleteCDR,
      canManageCDR,
      
      canReadRecordings,
      canDownloadRecordings,
      canDeleteRecordings,
      canManageRecordings,
      
      canReadBilling,
      canManageBilling,
      
      canReadReports,
      canCreateReports,
      canExecuteReports,
      canManageReports,
      
      canReadAnalytics,
      canExecuteAnalytics,
      canManageAnalytics,
      
      canReadSystem,
      canManageSystem,
      
      canReadConfig,
      canUpdateConfig,
      canManageConfig,
      
      canReadSecurity,
      canManageSecurity,
      
      canReadMonitoring,
      canExecuteMonitoring,
      canManageMonitoring,

      canReadExtensions,
      canManageExtensions,
      canReadCalls,
      canManageCalls,
      
      canAccessDomain,
      securityClearance,
      hasMinimumClearance,

      isBusinessHours,
      canAccessDuringBusinessHours,
      canManageSubordinates,
      canAccessFinancialData,
      canPerformCriticalOperations,
      canAccessAuditLogs,

      userRoles,
      userPermissions,
      primaryRole,
      domainId,
    };
  }, [user, isAuthenticated]);
};
