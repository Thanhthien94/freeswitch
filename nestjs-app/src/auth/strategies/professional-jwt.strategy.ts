import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Professional JWT Strategy
 * Enhanced JWT validation with comprehensive user data loading
 */
@Injectable()
export class ProfessionalJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(ProfessionalJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Pass request object to validate method
    });
  }

  /**
   * Validate JWT payload and return user information
   */
  async validate(request: any, payload: JwtPayload): Promise<any> {
    this.logger.debug(`JWT validation for user: ${payload.username} (${payload.sub})`);

    try {
      // Validate payload structure
      if (!payload.sub || !payload.username) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      // Get user from database with all necessary relations
      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub) : payload.sub;
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
          isActive: true
        },
        relations: [
          'domain',
          'userRoles',
          'userRoles.role',
          'userRoles.role.permissions',
        ],
      });

      if (!user) {
        this.logger.warn(`User not found or inactive: ${payload.sub}`);
        throw new UnauthorizedException('User not found or inactive');
      }

      // Verify domain consistency
      if (payload.domainId && user.domainId !== payload.domainId) {
        this.logger.warn(`Domain mismatch for user ${payload.sub}: token=${payload.domainId}, user=${user.domainId}`);
        throw new UnauthorizedException('Domain mismatch detected');
      }

      // Verify session consistency if provided
      if (payload.sessionId && user.currentSessionId && user.currentSessionId !== payload.sessionId) {
        this.logger.warn(`Session mismatch for user ${payload.sub}: token=${payload.sessionId}, user=${user.currentSessionId}`);
        throw new UnauthorizedException('Session expired or invalid');
      }

      // Get active roles and permissions
      const activeRoles = user.getActiveRoles();
      const roles = activeRoles.map(ur => ur.role.name);
      const permissions = activeRoles
        .flatMap(ur => ur.role.permissions || [])
        .filter(p => p.isActive)
        .map(p => p.fullPermission);

      // Get primary role
      const primaryRole = user.getPrimaryRole()?.role?.name || roles[0] || 'viewer';

      // Extract client information
      const clientIp = this.getClientIp(request);
      const userAgent = request.headers['user-agent'] || 'unknown';

      // Create comprehensive user object
      const userInfo = {
        // Basic user information
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        
        // Domain information
        domainId: user.domainId,
        domain: user.domain ? {
          id: user.domain.id,
          name: user.domain.name,
          displayName: user.domain.displayName,
        } : null,
        
        // Role and permission information
        roles,
        permissions,
        primaryRole,
        
        // Session information
        sessionId: payload.sessionId,
        tokenType: payload.tokenType || 'access',
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        
        // Client information
        clientIp,
        userAgent,
        
        // Additional metadata
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        
        // Security flags
        requirePasswordChange: user.requirePasswordChange,
        mfaEnabled: user.mfaEnabled,
        
        // Preferences
        language: user.language || 'en',
        timezone: user.timezone || 'UTC',
        
        // Helper methods
        hasRole: (role: string) => roles.includes(role),
        hasPermission: (permission: string) => permissions.includes(permission),
        hasAnyRole: (...checkRoles: string[]) => checkRoles.some(role => roles.includes(role)),
        hasAnyPermission: (...checkPermissions: string[]) => checkPermissions.some(perm => permissions.includes(perm)),
        isSuperAdmin: () => roles.includes('superadmin'),
        isAdmin: () => roles.includes('admin') || roles.includes('superadmin'),
        isOperator: () => roles.includes('operator') || roles.includes('admin') || roles.includes('superadmin'),
      };

      // Log successful validation
      this.logger.debug(`JWT validation successful for user: ${user.username} (${user.id}) with roles: ${roles.join(', ')}`);

      // Update last activity (optional - can be disabled for performance)
      if (this.configService.get<boolean>('UPDATE_LAST_ACTIVITY', true)) {
        await this.updateLastActivity(user, clientIp, userAgent);
      }

      return userInfo;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`JWT validation error for payload ${JSON.stringify(payload)}:`, error);
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Update user's last activity
   */
  private async updateLastActivity(user: User, clientIp: string, userAgent: string): Promise<void> {
    try {
      await this.userRepository.update(user.id, {
        lastActivityAt: new Date(),
        lastActivityIp: clientIp,
        lastActivityUserAgent: userAgent,
      });
    } catch (error) {
      this.logger.warn(`Failed to update last activity for user ${user.id}:`, error);
      // Don't throw error - this is not critical
    }
  }

  /**
   * Extract client IP address
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
