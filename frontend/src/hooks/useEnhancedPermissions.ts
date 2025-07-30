import { useMemo } from 'react';
import { useEnhancedAuth } from './useEnhancedAuth';
import { hasPermissionFromToken, hasRoleFromToken } from '@/utils/jwt.utils';

export interface EnhancedPermissionHookResult {
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
  isUser: boolean;
  
  // Resource-specific permissions
  canReadUsers: boolean;
  canManageUsers: boolean;
  canReadCDR: boolean;
  canManageCDR: boolean;
  canReadRecordings: boolean;
  canManageRecordings: boolean;
  canReadBilling: boolean;
  canManageBilling: boolean;
  canReadReports: boolean;
  canManageReports: boolean;
  canReadAnalytics: boolean;
  canManageAnalytics: boolean;
  canReadSystem: boolean;
  canManageSystem: boolean;
  canReadConfig: boolean;
  canManageConfig: boolean;
  canReadSecurity: boolean;
  canManageSecurity: boolean;
  canReadMonitoring: boolean;
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
  
  // User info
  userRoles: string[];
  userPermissions: string[];
  primaryRole: string;
  domainId: string;
}

/**
 * Enhanced permissions hook with caching and performance optimization
 */
export const useEnhancedPermissions = (): EnhancedPermissionHookResult => {
  const { user, token, isAuthenticated } = useEnhancedAuth();

  /**
   * Memoized permission calculations
   */
  const permissions = useMemo((): EnhancedPermissionHookResult => {
    // Default values for unauthenticated users
    if (!isAuthenticated || !user) {
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
        isUser: false,
        canReadUsers: false,
        canManageUsers: false,
        canReadCDR: false,
        canManageCDR: false,
        canReadRecordings: false,
        canManageRecordings: false,
        canReadBilling: false,
        canManageBilling: false,
        canReadReports: false,
        canManageReports: false,
        canReadAnalytics: false,
        canManageAnalytics: false,
        canReadSystem: false,
        canManageSystem: false,
        canReadConfig: false,
        canManageConfig: false,
        canReadSecurity: false,
        canManageSecurity: false,
        canReadMonitoring: false,
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
        userRoles: [],
        userPermissions: [],
        primaryRole: '',
        domainId: '',
      };
    }

    // Helper functions using token for performance
    const hasRole = (roleName: string): boolean => {
      return hasRoleFromToken(token, roleName) || user.roles.includes(roleName);
    };

    const hasPermission = (permission: string): boolean => {
      return hasPermissionFromToken(token, permission) || 
             user.permissions.includes(permission) ||
             user.permissions.includes('*:manage');
    };

    const hasAnyRole = (roles: string[]): boolean => {
      return roles.some(role => hasRole(role));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
      return permissions.some(perm => hasPermission(perm));
    };

    const hasAllRoles = (roles: string[]): boolean => {
      return roles.every(role => hasRole(role));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
      return permissions.every(perm => hasPermission(perm));
    };

    // Role checks
    const isSuperAdmin = hasRole('SuperAdmin');
    const isDomainAdmin = hasRole('DomainAdmin');
    const isUser = hasRole('User');
    const isAdmin = isSuperAdmin || isDomainAdmin;

    // Resource permissions
    const canReadUsers = hasPermission('users:read');
    const canManageUsers = hasPermission('users:manage');
    const canReadCDR = hasPermission('cdr:read');
    const canManageCDR = hasPermission('cdr:manage');
    const canReadRecordings = hasPermission('recordings:read');
    const canManageRecordings = hasPermission('recordings:manage');
    const canReadBilling = hasPermission('billing:read');
    const canManageBilling = hasPermission('billing:manage');
    const canReadReports = hasPermission('reports:read');
    const canManageReports = hasPermission('reports:manage');
    const canReadAnalytics = hasPermission('analytics:read');
    const canManageAnalytics = hasPermission('analytics:manage');
    const canReadSystem = hasPermission('system:read');
    const canManageSystem = hasPermission('system:manage');
    const canReadConfig = hasPermission('config:read');
    const canManageConfig = hasPermission('config:manage');
    const canReadSecurity = hasPermission('security:read');
    const canManageSecurity = hasPermission('security:manage');
    const canReadMonitoring = hasPermission('monitoring:read');
    const canManageMonitoring = hasPermission('monitoring:manage');
    const canReadExtensions = hasPermission('extensions:read');
    const canManageExtensions = hasPermission('extensions:manage');
    const canReadCalls = hasPermission('calls:read');
    const canManageCalls = hasPermission('calls:manage');

    // Domain access
    const canAccessDomain = (domainId: string): boolean => {
      if (isSuperAdmin) return true;
      return user.domainId === domainId;
    };

    // Security clearance
    const securityClearance = user.securityClearance || 'LOW';
    const hasMinimumClearance = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): boolean => {
      const clearanceLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const userLevel = clearanceLevels[securityClearance as keyof typeof clearanceLevels] || 1;
      const requiredLevel = clearanceLevels[level];
      return userLevel >= requiredLevel;
    };

    // Business hours
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isBusinessHours = isWeekday && hour >= 9 && hour < 17;
    const canAccessDuringBusinessHours = isBusinessHours || isSuperAdmin;

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
      isUser,
      canReadUsers,
      canManageUsers,
      canReadCDR,
      canManageCDR,
      canReadRecordings,
      canManageRecordings,
      canReadBilling,
      canManageBilling,
      canReadReports,
      canManageReports,
      canReadAnalytics,
      canManageAnalytics,
      canReadSystem,
      canManageSystem,
      canReadConfig,
      canManageConfig,
      canReadSecurity,
      canManageSecurity,
      canReadMonitoring,
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
      userRoles: user.roles,
      userPermissions: user.permissions,
      primaryRole: user.primaryRole,
      domainId: user.domainId,
    };
  }, [user, token, isAuthenticated]);

  return permissions;
};
