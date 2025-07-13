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
      // Check if user has any of the required roles
      const hasRole = await this.rbacService.hasAnyRole(user.id, requiredRoles);
      
      if (!hasRole) {
        this.logger.warn(`User ${user.id} lacks required roles: ${requiredRoles.join(', ')}`);
        throw new ForbiddenException('Insufficient role privileges');
      }

      // Check domain scope if specified
      const domainScope = this.reflector.getAllAndOverride<'own' | 'any' | 'global'>(DOMAIN_SCOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (domainScope && domainScope !== 'global') {
        const targetDomainId = this.extractDomainId(request);
        
        if (domainScope === 'own' && targetDomainId) {
          const canManageDomain = await this.rbacService.canManageDomain(user.id, targetDomainId);
          
          if (!canManageDomain) {
            this.logger.warn(`User ${user.id} cannot access domain ${targetDomainId}`);
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
