import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../services/rbac.service';
import { ROLES_KEY, DOMAIN_SCOPE_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Convert user.id to number if it's a string (from JWT)
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

      this.logger.debug(`Checking roles for user ${userId}, required: ${requiredRoles.join(', ')}, user roles: ${user.roles?.join(', ') || 'none'}`);

      // TEMPORARY: Check user roles directly from JWT token first
      if (user.roles && Array.isArray(user.roles)) {
        const hasRoleInToken = requiredRoles.some(role => user.roles.includes(role));
        if (hasRoleInToken) {
          this.logger.debug(`User ${userId} has required role in JWT token`);
          // Continue to domain check if needed
        } else {
          this.logger.warn(`User ${userId} lacks required roles in JWT token: ${requiredRoles.join(', ')}`);
          throw new ForbiddenException('Insufficient role privileges');
        }
      } else {
        // Fallback to database check
        const hasRole = await this.rbacService.hasAnyRole(userId, requiredRoles);

        if (!hasRole) {
          this.logger.warn(`User ${userId} lacks required roles in database: ${requiredRoles.join(', ')}`);
          throw new ForbiddenException('Insufficient role privileges');
        }
      }

      // Check domain scope if specified
      const domainScope = this.reflector.getAllAndOverride<'own' | 'any' | 'global'>(DOMAIN_SCOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (domainScope && domainScope !== 'global') {
        const targetDomainId = this.extractDomainId(request);
        
        if (domainScope === 'own' && targetDomainId) {
          const canManageDomain = await this.rbacService.canManageDomain(userId, targetDomainId);

          if (!canManageDomain) {
            this.logger.warn(`User ${userId} cannot access domain ${targetDomainId}`);
            throw new ForbiddenException('Insufficient domain privileges');
          }
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Error in roles guard:', error);
      throw new ForbiddenException('Authorization check failed');
    }
  }

  private extractDomainId(request: any): string | null {
    // Try to extract domain ID from various sources
    return (
      request.params?.domainId ||
      request.body?.domainId ||
      request.query?.domainId ||
      request.user?.domainId ||
      null
    );
  }
}
