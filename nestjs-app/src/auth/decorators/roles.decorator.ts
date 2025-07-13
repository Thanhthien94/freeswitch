import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const POLICIES_KEY = 'policies';
export const DOMAIN_SCOPE_KEY = 'domain_scope';
export const RESOURCE_KEY = 'resource';

/**
 * Decorator to require specific roles for accessing an endpoint
 * @param roles - Array of role names required
 */
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to require specific permissions for accessing an endpoint
 * @param permissions - Array of permissions in format "resource:action"
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to require policy evaluation for accessing an endpoint
 * @param policies - Array of policy names to evaluate
 */
export const RequirePolicies = (...policies: string[]) => 
  SetMetadata(POLICIES_KEY, policies);

/**
 * Decorator to specify domain scope for the endpoint
 * @param scope - Domain scope: 'own' | 'any' | 'global'
 */
export const DomainScope = (scope: 'own' | 'any' | 'global') => 
  SetMetadata(DOMAIN_SCOPE_KEY, scope);

/**
 * Decorator to specify the resource type for ABAC evaluation
 * @param resourceType - Type of resource being accessed
 */
export const Resource = (resourceType: string) => 
  SetMetadata(RESOURCE_KEY, resourceType);

/**
 * Combined decorator for common admin operations
 */
export const RequireAdmin = () => RequireRoles('SuperAdmin', 'DomainAdmin', 'SystemAdmin');

/**
 * Combined decorator for domain admin operations
 */
export const RequireDomainAdmin = () => RequireRoles('SuperAdmin', 'DomainAdmin');

/**
 * Combined decorator for manager level operations
 */
export const RequireManager = () => RequireRoles('SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'CallCenterManager');

/**
 * Combined decorator for supervisor level operations
 */
export const RequireSupervisor = () => RequireRoles('SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor', 'TeamLead');

/**
 * Decorator for operations that require domain ownership or global admin
 */
export const RequireDomainOwnership = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequireRoles('SuperAdmin', 'DomainAdmin')(target, propertyKey, descriptor);
    DomainScope('own')(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for read-only operations
 */
export const RequireReadAccess = (resource: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`${resource}:read`)(target, propertyKey, descriptor);
    Resource(resource)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for write operations
 */
export const RequireWriteAccess = (resource: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`${resource}:create`, `${resource}:update`)(target, propertyKey, descriptor);
    Resource(resource)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for delete operations
 */
export const RequireDeleteAccess = (resource: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`${resource}:delete`)(target, propertyKey, descriptor);
    Resource(resource)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for management operations (full access)
 */
export const RequireManageAccess = (resource: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`${resource}:manage`)(target, propertyKey, descriptor);
    Resource(resource)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for CDR access with time-based restrictions
 */
export const RequireCDRAccess = (action: 'read' | 'export' | 'delete') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`cdr:${action}`)(target, propertyKey, descriptor);
    RequirePolicies('BusinessHoursOnly', 'DomainIsolation')(target, propertyKey, descriptor);
    Resource('cdr')(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for recording access with security clearance
 */
export const RequireRecordingAccess = (action: 'read' | 'download' | 'delete') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequirePermissions(`recordings:${action}`)(target, propertyKey, descriptor);
    RequirePolicies('HighSecurityDataAccess', 'DomainIsolation')(target, propertyKey, descriptor);
    Resource('recordings')(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for system configuration access
 */
export const RequireSystemConfig = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    RequireRoles('SuperAdmin', 'SystemAdmin')(target, propertyKey, descriptor);
    RequirePermissions('system:manage', 'config:update')(target, propertyKey, descriptor);
    RequirePolicies('OfficeNetworkOnly')(target, propertyKey, descriptor);
    Resource('system')(target, propertyKey, descriptor);
  };
};

/**
 * Decorator for user management operations
 */
export const RequireUserManagement = (action: 'read' | 'create' | 'update' | 'delete') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (action === 'read') {
      RequireRoles('SuperAdmin', 'DomainAdmin', 'DepartmentManager', 'Supervisor')(target, propertyKey, descriptor);
    } else {
      RequireRoles('SuperAdmin', 'DomainAdmin', 'DepartmentManager')(target, propertyKey, descriptor);
    }
    RequirePermissions(`users:${action}`)(target, propertyKey, descriptor);
    RequirePolicies('DomainIsolation', 'ManagerCanAccessSubordinates')(target, propertyKey, descriptor);
    Resource('users')(target, propertyKey, descriptor);
  };
};
