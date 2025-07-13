import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../services/rbac.service';
import { PERMISSIONS_KEY, RESOURCE_KEY } from '../decorators/roles.decorator';
import { PermissionAction } from '../entities/permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Get resource type from decorator or request
      const resourceType = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.extractResourceType(request);

      // Check each required permission
      const permissionChecks = await Promise.all(
        requiredPermissions.map(async (permission) => {
          const [resource, action] = permission.split(':');
          
          if (!action || !Object.values(PermissionAction).includes(action as PermissionAction)) {
            this.logger.warn(`Invalid permission format: ${permission}`);
            return { permission, allowed: false, reason: 'Invalid permission format' };
          }

          const result = await this.rbacService.hasPermission(
            user.id,
            resource,
            action as PermissionAction,
            this.buildPermissionContext(request, resourceType),
          );

          return { permission, ...result };
        })
      );

      // Check if any permission is granted (OR logic)
      const hasAnyPermission = permissionChecks.some(check => check.allowed);

      if (!hasAnyPermission) {
        const deniedPermissions = permissionChecks
          .filter(check => !check.allowed)
          .map(check => check.permission);

        this.logger.warn(
          `User ${user.id} lacks required permissions: ${deniedPermissions.join(', ')}`
        );

        throw new ForbiddenException('Insufficient permissions');
      }

      // Log successful permission check
      const grantedPermissions = permissionChecks
        .filter(check => check.allowed)
        .map(check => check.permission);

      this.logger.debug(
        `User ${user.id} granted permissions: ${grantedPermissions.join(', ')}`
      );

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Error in permissions guard:', error);
      throw new ForbiddenException('Permission check failed');
    }
  }

  private extractResourceType(request: any): string {
    // Try to extract resource type from URL path
    const path = request.route?.path || request.url;
    
    if (path.includes('/users')) return 'users';
    if (path.includes('/calls')) return 'calls';
    if (path.includes('/cdr')) return 'cdr';
    if (path.includes('/recordings')) return 'recordings';
    if (path.includes('/extensions')) return 'extensions';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/billing')) return 'billing';
    if (path.includes('/config')) return 'config';
    if (path.includes('/system')) return 'system';
    if (path.includes('/security')) return 'security';
    if (path.includes('/monitoring')) return 'monitoring';
    
    return 'unknown';
  }

  private buildPermissionContext(request: any, resourceType?: string): Record<string, any> {
    return {
      method: request.method,
      path: request.route?.path || request.url,
      params: request.params,
      query: request.query,
      body: request.body,
      resourceType,
      userAgent: request.headers['user-agent'],
      clientIp: this.getClientIp(request),
    };
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
