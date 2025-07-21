import { SetMetadata } from '@nestjs/common';

/**
 * Professional Authentication Decorators
 * Unified decorators for authentication, authorization, and security
 */

// ==================== AUTHENTICATION ====================

/**
 * Mark endpoints as public (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ==================== AUTHORIZATION ====================

/**
 * Require specific permissions
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Require specific roles
 */
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => 
  SetMetadata(ROLES_KEY, roles);

/**
 * Require category-specific permissions
 */
export const CATEGORY_PERMISSIONS_KEY = 'categoryPermissions';
export const RequireCategoryPermissions = (...permissions: string[]) => 
  SetMetadata(CATEGORY_PERMISSIONS_KEY, permissions);

// ==================== RATE LIMITING ====================

/**
 * Custom rate limit configuration
 */
export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (config: {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Skip rate limiting for this endpoint
 */
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

// ==================== PREDEFINED RATE LIMITS ====================

/**
 * Sync operation rate limit (5 requests per 5 minutes)
 */
export const SyncRateLimit = () => 
  RateLimit({ windowMs: 300000, maxRequests: 5 });

/**
 * Backup operation rate limit (3 requests per 10 minutes)
 */
export const BackupRateLimit = () => 
  RateLimit({ windowMs: 600000, maxRequests: 3 });

/**
 * Sensitive operation rate limit (10 requests per 5 minutes)
 */
export const SensitiveRateLimit = () => 
  RateLimit({ windowMs: 300000, maxRequests: 10 });

/**
 * Upload operation rate limit (10 requests per minute)
 */
export const UploadRateLimit = () => 
  RateLimit({ windowMs: 60000, maxRequests: 10 });

/**
 * Login rate limit (5 attempts per 15 minutes)
 */
export const LoginRateLimit = () => 
  RateLimit({ windowMs: 900000, maxRequests: 5 });

// ==================== SECURITY ====================

/**
 * Mark operation as sensitive (requires additional security validation)
 */
export const SENSITIVE_KEY = 'sensitive';
export const Sensitive = () => SetMetadata(SENSITIVE_KEY, true);

/**
 * Require domain-specific access
 */
export const DOMAIN_ACCESS_KEY = 'domainAccess';
export const RequireDomainAccess = (domain?: string) => 
  SetMetadata(DOMAIN_ACCESS_KEY, domain);

// ==================== COMBINED DECORATORS ====================

/**
 * Admin only access (admin + superadmin roles)
 */
export const AdminOnly = () => RequireRoles('admin', 'superadmin');

/**
 * Superadmin only access
 */
export const SuperAdminOnly = () => RequireRoles('superadmin');

/**
 * Operator level access (operator + admin + superadmin)
 */
export const OperatorAccess = () => RequireRoles('operator', 'admin', 'superadmin');

/**
 * Read-only access (all authenticated users)
 */
export const ReadOnlyAccess = () => RequirePermissions('read');

/**
 * Configuration management access
 */
export const ConfigAccess = () => RequirePermissions('config:read');

/**
 * Configuration modification access
 */
export const ConfigModify = () => RequirePermissions('config:update');

/**
 * Configuration deletion access
 */
export const ConfigDelete = () => RequirePermissions('config:delete');

/**
 * System administration access
 */
export const SystemAdmin = () => RequirePermissions('system:audit');

/**
 * Security management access
 */
export const SecurityAccess = () => RequirePermissions('security:read');

/**
 * Security management modification
 */
export const SecurityManage = () => RequirePermissions('security:manage');

// ==================== OPERATION-SPECIFIC DECORATORS ====================

/**
 * Sync operation protection
 */
export const SyncOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequirePermissions('config:sync')(target, propertyKey, descriptor);
    SyncRateLimit()(target, propertyKey, descriptor);
    Sensitive()(target, propertyKey, descriptor);
  };
};

/**
 * Backup operation protection
 */
export const BackupOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequirePermissions('config:backup:create')(target, propertyKey, descriptor);
    BackupRateLimit()(target, propertyKey, descriptor);
    Sensitive()(target, propertyKey, descriptor);
  };
};

/**
 * Restore operation protection
 */
export const RestoreOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequirePermissions('config:backup:restore')(target, propertyKey, descriptor);
    SensitiveRateLimit()(target, propertyKey, descriptor);
    Sensitive()(target, propertyKey, descriptor);
  };
};

/**
 * Security operation protection
 */
export const SecurityOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequirePermissions('security:manage')(target, propertyKey, descriptor);
    SensitiveRateLimit()(target, propertyKey, descriptor);
    Sensitive()(target, propertyKey, descriptor);
  };
};

/**
 * User management operation protection
 */
export const UserManagement = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequirePermissions('user:update')(target, propertyKey, descriptor);
    SensitiveRateLimit()(target, propertyKey, descriptor);
    Sensitive()(target, propertyKey, descriptor);
  };
};

// ==================== PERMISSION CONSTANTS ====================

/**
 * Standard permission constants for consistency
 */
export const PERMISSIONS = {
  // Basic CRUD
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Configuration
  CONFIG_READ: 'config:read',
  CONFIG_CREATE: 'config:create',
  CONFIG_UPDATE: 'config:update',
  CONFIG_DELETE: 'config:delete',
  CONFIG_SYNC: 'config:sync',
  CONFIG_SYNC_FORCE: 'config:sync:force',
  
  // Backup
  BACKUP_CREATE: 'config:backup:create',
  BACKUP_RESTORE: 'config:backup:restore',
  BACKUP_DELETE: 'config:backup:delete',
  
  // System
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_METRICS: 'system:metrics',
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_LOGS: 'system:logs',
  
  // Security
  SECURITY_READ: 'security:read',
  SECURITY_MANAGE: 'security:manage',
  SECURITY_ENCRYPTION: 'security:encryption',
  SECURITY_COMPLIANCE: 'security:compliance',
  
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLES: 'user:roles',
  
  // Notifications
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_MANAGE: 'notifications:manage',
  
  // Scheduler
  SCHEDULER_VIEW: 'scheduler:view',
  SCHEDULER_MANAGE: 'scheduler:manage',
} as const;

/**
 * Standard role constants for consistency
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Create custom permission decorator
 */
export const CreatePermissionDecorator = (permission: string) => 
  () => RequirePermissions(permission);

/**
 * Create custom role decorator
 */
export const CreateRoleDecorator = (...roles: string[]) => 
  () => RequireRoles(...roles);

/**
 * Create custom rate limit decorator
 */
export const CreateRateLimitDecorator = (windowMs: number, maxRequests: number) => 
  () => RateLimit({ windowMs, maxRequests });

/**
 * Combine multiple decorators
 */
export const CombineDecorators = (...decorators: any[]) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    decorators.forEach(decorator => {
      if (typeof decorator === 'function') {
        decorator(target, propertyKey, descriptor);
      }
    });
  };
};
