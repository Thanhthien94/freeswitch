import { useMemo } from 'react';
import { authService } from '@/services/auth.service';
import { useAuth } from './useAuth';

export interface PermissionHookResult {
  // Role checks
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  isAdmin: boolean;
  isDomainAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isAgent: boolean;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  
  // Resource-specific permissions
  canReadUsers: boolean;
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canManageUsers: boolean;
  
  canReadCDR: boolean;
  canExportCDR: boolean;
  canDeleteCDR: boolean;
  
  canReadRecordings: boolean;
  canDownloadRecordings: boolean;
  canDeleteRecordings: boolean;
  
  canReadBilling: boolean;
  canManageBilling: boolean;
  
  canReadReports: boolean;
  canCreateReports: boolean;
  canExecuteReports: boolean;
  
  canReadAnalytics: boolean;
  canExecuteAnalytics: boolean;
  
  canReadSystem: boolean;
  canManageSystem: boolean;
  
  canReadConfig: boolean;
  canUpdateConfig: boolean;
  
  canReadSecurity: boolean;
  canManageSecurity: boolean;
  
  canReadMonitoring: boolean;
  canExecuteMonitoring: boolean;
  
  // Domain and security
  canAccessDomain: (domainId: string) => boolean;
  hasMinimumClearance: (level: string) => boolean;
  securityClearance: string;
  
  // Business logic permissions
  canManageSubordinates: boolean;
  canAccessFinancialData: boolean;
  canPerformCriticalOperations: boolean;
  canAccessAuditLogs: boolean;
}

export const usePermissions = (): PermissionHookResult => {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    if (!isAuthenticated || !user) {
      // Return all false permissions for unauthenticated users
      return {
        hasRole: () => false,
        hasAnyRole: () => false,
        isAdmin: false,
        isDomainAdmin: false,
        isManager: false,
        isSupervisor: false,
        isAgent: false,
        
        hasPermission: () => false,
        hasAnyPermission: () => false,
        
        canReadUsers: false,
        canCreateUsers: false,
        canUpdateUsers: false,
        canDeleteUsers: false,
        canManageUsers: false,
        
        canReadCDR: false,
        canExportCDR: false,
        canDeleteCDR: false,
        
        canReadRecordings: false,
        canDownloadRecordings: false,
        canDeleteRecordings: false,
        
        canReadBilling: false,
        canManageBilling: false,
        
        canReadReports: false,
        canCreateReports: false,
        canExecuteReports: false,
        
        canReadAnalytics: false,
        canExecuteAnalytics: false,
        
        canReadSystem: false,
        canManageSystem: false,
        
        canReadConfig: false,
        canUpdateConfig: false,
        
        canReadSecurity: false,
        canManageSecurity: false,
        
        canReadMonitoring: false,
        canExecuteMonitoring: false,
        
        canAccessDomain: () => false,
        hasMinimumClearance: () => false,
        securityClearance: 'LOW',
        
        canManageSubordinates: false,
        canAccessFinancialData: false,
        canPerformCriticalOperations: false,
        canAccessAuditLogs: false,
      };
    }

    // Helper functions
    const hasRole = (roleName: string) => authService.hasRole(roleName);
    const hasAnyRole = (roleNames: string[]) => authService.hasAnyRole(roleNames);
    const hasPermission = (permission: string) => authService.hasPermission(permission);
    const hasAnyPermission = (permissions: string[]) => authService.hasAnyPermission(permissions);
    const canAccessDomain = (domainId: string) => authService.canAccessDomain(domainId);
    const hasMinimumClearance = (level: string) => authService.hasMinimumClearance(level);

    // Role checks
    const isAdmin = hasAnyRole(['SuperAdmin', 'SystemAdmin', 'DomainAdmin']);
    const isDomainAdmin = hasAnyRole(['SuperAdmin', 'DomainAdmin']);
    const isManager = hasAnyRole(['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'CallCenterManager']);
    const isSupervisor = hasAnyRole(['SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor', 'TeamLead']);
    const isAgent = hasAnyRole(['Agent', 'SeniorAgent', 'Operator', 'Receptionist']);

    // Resource permissions
    const canReadUsers = hasPermission('users:read');
    const canCreateUsers = hasPermission('users:create');
    const canUpdateUsers = hasPermission('users:update');
    const canDeleteUsers = hasPermission('users:delete');
    const canManageUsers = hasPermission('users:manage');

    const canReadCDR = hasPermission('cdr:read');
    const canExportCDR = hasPermission('cdr:execute');
    const canDeleteCDR = hasPermission('cdr:delete');

    const canReadRecordings = hasPermission('recordings:read');
    const canDownloadRecordings = hasPermission('recordings:execute');
    const canDeleteRecordings = hasPermission('recordings:delete');

    const canReadBilling = hasPermission('billing:read');
    const canManageBilling = hasPermission('billing:manage');

    const canReadReports = hasPermission('reports:read');
    const canCreateReports = hasPermission('reports:create');
    const canExecuteReports = hasPermission('reports:execute');

    const canReadAnalytics = hasPermission('analytics:read');
    const canExecuteAnalytics = hasPermission('analytics:execute');

    const canReadSystem = hasPermission('system:read');
    const canManageSystem = hasPermission('system:manage');

    const canReadConfig = hasPermission('config:read');
    const canUpdateConfig = hasPermission('config:update');

    const canReadSecurity = hasPermission('security:read');
    const canManageSecurity = hasPermission('security:manage');

    const canReadMonitoring = hasPermission('monitoring:read');
    const canExecuteMonitoring = hasPermission('monitoring:execute');

    // Business logic permissions
    const canManageSubordinates = isManager || isSupervisor;
    const canAccessFinancialData = hasAnyRole(['SuperAdmin', 'BillingAdmin', 'DomainAdmin']) && 
                                   hasMinimumClearance('HIGH');
    const canPerformCriticalOperations = hasAnyRole(['SuperAdmin', 'SystemAdmin']) && 
                                        hasMinimumClearance('CRITICAL');
    const canAccessAuditLogs = hasAnyRole(['SuperAdmin', 'SecurityAdmin', 'DomainAdmin']);

    const securityClearance = authService.getSecurityClearance();

    return {
      hasRole,
      hasAnyRole,
      isAdmin,
      isDomainAdmin,
      isManager,
      isSupervisor,
      isAgent,
      
      hasPermission,
      hasAnyPermission,
      
      canReadUsers,
      canCreateUsers,
      canUpdateUsers,
      canDeleteUsers,
      canManageUsers,
      
      canReadCDR,
      canExportCDR,
      canDeleteCDR,
      
      canReadRecordings,
      canDownloadRecordings,
      canDeleteRecordings,
      
      canReadBilling,
      canManageBilling,
      
      canReadReports,
      canCreateReports,
      canExecuteReports,
      
      canReadAnalytics,
      canExecuteAnalytics,
      
      canReadSystem,
      canManageSystem,
      
      canReadConfig,
      canUpdateConfig,
      
      canReadSecurity,
      canManageSecurity,
      
      canReadMonitoring,
      canExecuteMonitoring,
      
      canAccessDomain,
      hasMinimumClearance,
      securityClearance,
      
      canManageSubordinates,
      canAccessFinancialData,
      canPerformCriticalOperations,
      canAccessAuditLogs,
    };
  }, [user, isAuthenticated]);
};
