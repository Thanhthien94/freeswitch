import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException, 
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../../users/user.entity';

/**
 * Professional Authentication Guard
 * Unified authentication system with JWT + RBAC + Rate Limiting + Security Validation
 */
@Injectable()
export class ProfessionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(ProfessionalAuthGuard.name);
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number; firstRequest: number }>();
  private readonly cleanupInterval: NodeJS.Timeout;

  // Role hierarchy: higher roles inherit permissions from lower roles
  private readonly roleHierarchy = {
    'superadmin': ['admin', 'operator', 'viewer'],
    'admin': ['operator', 'viewer'], 
    'operator': ['viewer'],
    'viewer': [],
  };

  // Comprehensive permission mappings
  private readonly permissionMappings = {
    // Basic CRUD operations
    'read': ['viewer', 'operator', 'admin', 'superadmin'],
    'create': ['operator', 'admin', 'superadmin'],
    'update': ['operator', 'admin', 'superadmin'],
    'delete': ['admin', 'superadmin'],
    
    // Configuration operations
    'config:read': ['viewer', 'operator', 'admin', 'superadmin'],
    'config:create': ['operator', 'admin', 'superadmin'],
    'config:update': ['operator', 'admin', 'superadmin'],
    'config:delete': ['admin', 'superadmin'],
    'config:sync': ['operator', 'admin', 'superadmin'],
    'config:sync:force': ['admin', 'superadmin'],
    
    // Backup operations
    'config:backup:create': ['operator', 'admin', 'superadmin'],
    'config:backup:restore': ['admin', 'superadmin'],
    'config:backup:delete': ['admin', 'superadmin'],
    
    // System operations
    'system:health': ['viewer', 'operator', 'admin', 'superadmin'],
    'system:metrics': ['operator', 'admin', 'superadmin'],
    'system:audit': ['admin', 'superadmin'],
    'system:logs': ['admin', 'superadmin'],
    
    // Security operations
    'security:read': ['admin', 'superadmin'],
    'security:manage': ['superadmin'],
    'security:encryption': ['superadmin'],
    'security:compliance': ['admin', 'superadmin'],
    
    // User management
    'user:read': ['operator', 'admin', 'superadmin'],
    'user:create': ['admin', 'superadmin'],
    'user:update': ['admin', 'superadmin'],
    'user:delete': ['superadmin'],
    'user:roles': ['admin', 'superadmin'],
    
    // Notification operations
    'notifications:read': ['viewer', 'operator', 'admin', 'superadmin'],
    'notifications:manage': ['admin', 'superadmin'],
    
    // Scheduler operations
    'scheduler:view': ['operator', 'admin', 'superadmin'],
    'scheduler:manage': ['admin', 'superadmin'],
  };

  // Role-based rate limits (requests per minute)
  private readonly roleLimits = {
    superadmin: { windowMs: 60000, maxRequests: 200 },
    admin: { windowMs: 60000, maxRequests: 120 },
    operator: { windowMs: 60000, maxRequests: 80 },
    viewer: { windowMs: 60000, maxRequests: 40 },
    default: { windowMs: 60000, maxRequests: 20 },
  };

  // Operation-specific rate limits
  private readonly operationLimits = {
    sync: { windowMs: 300000, maxRequests: 5 }, // 5 sync operations per 5 minutes
    backup: { windowMs: 600000, maxRequests: 3 }, // 3 backup operations per 10 minutes
    sensitive: { windowMs: 300000, maxRequests: 10 }, // 10 sensitive operations per 5 minutes
    upload: { windowMs: 60000, maxRequests: 10 }, // 10 uploads per minute
    login: { windowMs: 900000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Cleanup expired rate limit entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    try {
      // 1. Check if endpoint is public
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        this.logger.debug(`Public endpoint accessed: ${request.method} ${request.path}`);
        return true;
      }

      // 2. JWT Authentication
      const user = await this.authenticateJWT(request);

      // 3. RBAC Authorization
      await this.checkRBACAuthorization(request, context, user);

      // 4. Rate Limiting
      await this.checkRateLimit(request, context, user);

      // 5. Security Validation (for sensitive operations)
      await this.validateSecurity(request, context, user);

      // 6. Log successful access
      await this.logSuccessfulAccess(request, user, Date.now() - startTime);

      return true;

    } catch (error) {
      await this.logFailedAccess(request, error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * JWT Authentication
   */
  private async authenticateJWT(request: Request): Promise<any> {
    try {
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('Authentication token required');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Validate payload structure
      if (!payload.sub || !payload.username) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get user from database with relations for real-time validation
      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub) : payload.sub;
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        relations: [
          'domain',
          'userRoles',
          'userRoles.role',
          'userRoles.role.permissions',
        ],
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Verify domain consistency
      if (payload.domainId && user.domainId !== payload.domainId) {
        throw new UnauthorizedException('Domain mismatch');
      }

      // Get current roles and permissions
      const activeRoles = user.getActiveRoles();
      const roles = activeRoles.map(ur => ur.role.name);
      const permissions = activeRoles
        .flatMap(ur => ur.role.permissions || [])
        .filter(p => p.isActive)
        .map(p => p.fullPermission);

      // Attach comprehensive user info to request
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        domainId: user.domainId,
        roles,
        permissions,
        primaryRole: user.getPrimaryRole()?.role?.name || roles[0] || 'viewer',
        sessionId: payload.sessionId,
        tokenType: payload.tokenType,
        iat: payload.iat,
      };

      request['user'] = userInfo;
      request['userId'] = user.id;
      request['username'] = user.username;
      request['roles'] = roles;
      request['permissions'] = permissions;
      request['domainId'] = user.domainId;

      return userInfo;

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Authentication token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid authentication token');
      } else if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        this.logger.error('JWT authentication error:', error);
        throw new UnauthorizedException('Authentication failed');
      }
    }
  }

  /**
   * RBAC Authorization
   */
  private async checkRBACAuthorization(request: Request, context: ExecutionContext, user: any): Promise<void> {
    try {
      // Get required permissions from metadata
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
        context.getHandler(),
        context.getClass(),
      ]) || [];

      // Get required roles from metadata
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]) || [];

      // Skip authorization if no requirements
      if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
        return;
      }

      // Superadmin has access to everything
      if (user.roles.includes('superadmin')) {
        return;
      }

      // Check role-based permissions
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => 
          this.hasRole(user.roles, role)
        );
        if (!hasRequiredRole) {
          throw new ForbiddenException(`Insufficient role permissions. Required: ${requiredRoles.join(', ')}`);
        }
      }

      // Check explicit permissions
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(permission => 
          this.hasPermission(user.roles, user.permissions, permission)
        );
        if (!hasRequiredPermissions) {
          throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
        }
      }

      // Check domain-specific access
      const domain = this.extractDomainFromRequest(request);
      if (domain && !user.roles.includes('superadmin')) {
        const hasDomainAccess = await this.checkDomainAccess(user, domain);
        if (!hasDomainAccess) {
          throw new ForbiddenException('Insufficient domain access');
        }
      }

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('RBAC authorization error:', error);
      throw new ForbiddenException('Authorization failed');
    }
  }

  /**
   * Rate Limiting
   */
  private async checkRateLimit(request: Request, context: ExecutionContext, user: any): Promise<void> {
    try {
      // Check if rate limiting is disabled for this endpoint
      const skipRateLimit = this.reflector.getAllAndOverride<boolean>('skipRateLimit', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (skipRateLimit) {
        return;
      }

      // Get custom rate limit configuration
      const customRateLimit = this.reflector.getAllAndOverride<any>('rateLimit', [
        context.getHandler(),
        context.getClass(),
      ]);

      // Determine rate limit configuration
      const rateLimitConfig = this.getRateLimitConfig(request, user, customRateLimit);

      // Generate rate limit key
      const key = this.generateRateLimitKey(request, user, rateLimitConfig);

      // Check rate limit
      const isAllowed = this.checkRateLimitInternal(key, rateLimitConfig);

      if (!isAllowed) {
        const retryAfter = this.getRetryAfter(key, rateLimitConfig);
        
        await this.logRateLimitExceeded(request, user, rateLimitConfig);
        
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded',
            error: 'Too Many Requests',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Log warning if approaching limit
      const entry = this.rateLimitStore.get(key);
      if (entry && entry.count > rateLimitConfig.maxRequests * 0.8) {
        await this.logRateLimitWarning(request, user, rateLimitConfig, entry.count);
      }

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Rate limiting error:', error);
      // Allow request on rate limiting errors to prevent service disruption
    }
  }

  /**
   * Security Validation
   */
  private async validateSecurity(request: Request, context: ExecutionContext, user: any): Promise<void> {
    try {
      // Check if this is a sensitive operation
      const isSensitive = this.reflector.getAllAndOverride<boolean>('sensitive', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!isSensitive) {
        return;
      }

      // Additional security checks for sensitive operations
      const clientIp = this.getClientIp(request);
      const userAgent = request.headers['user-agent'];

      // Log sensitive operation access
      await this.eventEmitter.emitAsync('auth.sensitive_operation', {
        userId: user.id,
        username: user.username,
        operation: `${request.method} ${request.path}`,
        clientIp,
        userAgent,
        timestamp: new Date(),
      });

      // Additional validation can be added here
      // e.g., IP whitelist, time-based access, etc.

    } catch (error) {
      this.logger.error('Security validation error:', error);
      // Continue with request - security validation errors should not block access
    }
  }

  /**
   * Helper methods
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private hasRole(userRoles: string[], requiredRole: string): boolean {
    // Check direct role
    if (userRoles.includes(requiredRole)) {
      return true;
    }

    // Check inherited roles through hierarchy
    return userRoles.some(userRole => {
      const inheritedRoles = this.roleHierarchy[userRole] || [];
      return inheritedRoles.includes(requiredRole);
    });
  }

  private hasPermission(userRoles: string[], userPermissions: string[], requiredPermission: string): boolean {
    // Check explicit permission
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check role-based permission
    const allowedRoles = this.permissionMappings[requiredPermission] || [];
    return userRoles.some(role => allowedRoles.includes(role));
  }

  private async checkDomainAccess(user: any, domain: string): Promise<boolean> {
    const userDomains = user.domains || [];
    
    // Admin can access all domains within their scope
    if (user.roles.includes('admin')) {
      return userDomains.length === 0 || userDomains.includes(domain);
    }

    // Other roles need explicit domain access
    return userDomains.includes(domain) || user.domainId === domain;
  }

  private extractDomainFromRequest(request: Request): string | null {
    // Extract domain from URL path, query parameters, or headers
    const query = request.query;
    const headers = request.headers;

    // From query parameter
    if (query.domain) {
      return query.domain as string;
    }

    // From header
    if (headers['x-domain']) {
      return headers['x-domain'] as string;
    }

    // From URL path
    const domainMatch = request.path.match(/\/domains\/([^\/]+)/);
    if (domainMatch) {
      return domainMatch[1];
    }

    return null;
  }

  private getRateLimitConfig(request: Request, user: any, customRateLimit?: any): any {
    // Use custom rate limit if provided
    if (customRateLimit) {
      return customRateLimit;
    }

    // Determine rate limit based on endpoint and user role
    const path = request.path;
    const method = request.method;
    const userRole = user?.primaryRole || 'default';

    // Operation-specific limits
    if (path.includes('/sync')) {
      return this.operationLimits.sync;
    }

    if (path.includes('/backup')) {
      return this.operationLimits.backup;
    }

    if (path.includes('/security') || path.includes('/encryption') || 
        method === 'DELETE' || path.includes('/audit')) {
      return this.operationLimits.sensitive;
    }

    if (path.includes('/upload')) {
      return this.operationLimits.upload;
    }

    if (path.includes('/login')) {
      return this.operationLimits.login;
    }

    // Role-based limits
    return this.roleLimits[userRole] || this.roleLimits.default;
  }

  private generateRateLimitKey(request: Request, user: any, config: any): string {
    const userId = user?.id;
    const ip = this.getClientIp(request);
    const endpoint = `${request.method}:${request.route?.path || request.path}`;

    // Use user ID if available, otherwise fall back to IP
    const identifier = userId || ip;

    return `${identifier}:${endpoint}`;
  }

  private checkRateLimitInternal(key: string, config: any): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now,
      };
      this.rateLimitStore.set(key, entry);
    }

    // Check if request is within the current window
    if (entry.firstRequest < windowStart) {
      // Reset the window
      entry.count = 0;
      entry.firstRequest = now;
      entry.resetTime = now + config.windowMs;
    }

    // Increment request count
    entry.count++;

    // Check if limit is exceeded
    return entry.count <= config.maxRequests;
  }

  private getRetryAfter(key: string, config: any): number {
    const entry = this.rateLimitStore.get(key);
    if (!entry) {
      return Math.ceil(config.windowMs / 1000);
    }

    const retryAfterMs = entry.resetTime - Date.now();
    return Math.ceil(Math.max(retryAfterMs, 0) / 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private async logSuccessfulAccess(request: Request, user: any, duration: number): Promise<void> {
    try {
      const accessEvent = {
        userId: user.id,
        username: user.username,
        action: 'access_granted',
        resource: `${request.method} ${request.path}`,
        userRoles: user.roles,
        userPermissions: user.permissions,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        duration,
        timestamp: new Date(),
      };

      await this.eventEmitter.emitAsync('auth.access_granted', accessEvent);

    } catch (error) {
      this.logger.error('Failed to log successful access:', error);
    }
  }

  private async logFailedAccess(request: Request, error: any, duration: number): Promise<void> {
    try {
      const accessEvent = {
        action: 'access_denied',
        resource: `${request.method} ${request.path}`,
        error: error.message,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        duration,
        timestamp: new Date(),
      };

      await this.eventEmitter.emitAsync('auth.access_denied', accessEvent);

    } catch (logError) {
      this.logger.error('Failed to log failed access:', logError);
    }
  }

  private async logRateLimitExceeded(request: Request, user: any, config: any): Promise<void> {
    try {
      const rateLimitEvent = {
        userId: user?.id || 'anonymous',
        username: user?.username || 'anonymous',
        ipAddress: this.getClientIp(request),
        endpoint: `${request.method} ${request.path}`,
        userAgent: request.headers['user-agent'],
        rateLimitConfig: {
          windowMs: config.windowMs,
          maxRequests: config.maxRequests,
        },
        timestamp: new Date(),
        severity: 'warning',
      };

      await this.eventEmitter.emitAsync('auth.rate_limit_exceeded', rateLimitEvent);

    } catch (error) {
      this.logger.error('Failed to log rate limit exceeded event:', error);
    }
  }

  private async logRateLimitWarning(request: Request, user: any, config: any, currentCount: number): Promise<void> {
    try {
      const warningEvent = {
        userId: user?.id || 'anonymous',
        username: user?.username || 'anonymous',
        ipAddress: this.getClientIp(request),
        endpoint: `${request.method} ${request.path}`,
        currentCount,
        maxRequests: config.maxRequests,
        percentage: Math.round((currentCount / config.maxRequests) * 100),
        timestamp: new Date(),
      };

      await this.eventEmitter.emitAsync('auth.rate_limit_warning', warningEvent);

    } catch (error) {
      this.logger.error('Failed to log rate limit warning event:', error);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
