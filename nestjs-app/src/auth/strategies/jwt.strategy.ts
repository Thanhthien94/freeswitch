import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

export interface JwtPayload {
  sub: number; // user id
  username: string;
  email: string;
  domainId: string;
  roles: string[];
  permissions: string[];
  primaryRole: string;
  iat: number;
  exp?: number; // Optional since JWT library will set this
  sessionId?: string;
  tokenType?: string; // For WebSocket tokens
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload): Promise<any> {
    // Validate payload structure
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Get user from database with relations
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
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

    // Get current active roles and permissions
    const activeUserRoles = user.getActiveRoles();
    const currentRoles = activeUserRoles.map(ur => ur.role.name);
    const currentPermissions = activeUserRoles
      .flatMap(ur => ur.role.permissions || [])
      .filter(p => p.isActive)
      .map(p => p.fullPermission);

    // Verify roles haven't changed significantly (optional security check)
    const tokenRoles = payload.roles || [];
    const hasRoleChanges = this.hasSignificantRoleChanges(tokenRoles, currentRoles);
    
    if (hasRoleChanges) {
      // Log potential security issue
      console.warn(`Role changes detected for user ${user.id}. Token may need refresh.`);
      // In strict mode, you might want to reject the token here
    }

    // Build enhanced user object for request context
    const enhancedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      domainId: user.domainId,
      departmentId: user.departmentId,
      teamId: user.teamId,
      managerId: user.managerId,
      extension: user.extension,
      isActive: user.isActive,
      
      // Current roles and permissions (from database)
      roles: currentRoles,
      permissions: currentPermissions,
      
      // Token information
      tokenRoles: tokenRoles,
      tokenPermissions: payload.permissions || [],
      sessionId: payload.sessionId,
      tokenIssuedAt: new Date(payload.iat * 1000),
      tokenExpiresAt: new Date(payload.exp * 1000),
      
      // Domain information
      domain: user.domain ? {
        id: user.domain.id,
        name: user.domain.name,
        displayName: user.domain.displayName,
      } : null,
      
      // Role objects for detailed access
      userRoles: activeUserRoles,
      
      // Helper methods
      hasRole: (roleName: string) => currentRoles.includes(roleName),
      hasPermission: (permission: string) => currentPermissions.includes(permission),
      hasAnyRole: (roleNames: string[]) => roleNames.some(role => currentRoles.includes(role)),
      hasAnyPermission: (permissions: string[]) => permissions.some(perm => currentPermissions.includes(perm)),
      
      // Primary role
      primaryRole: user.getPrimaryRole()?.role?.name || null,
      
      // Security context
      lastLogin: user.updatedAt, // This would be better tracked separately
      accountAge: Date.now() - user.createdAt.getTime(),
    };

    return enhancedUser;
  }

  private hasSignificantRoleChanges(tokenRoles: string[], currentRoles: string[]): boolean {
    // Check if there are significant role changes that might indicate
    // the token needs to be refreshed
    
    const tokenRoleSet = new Set(tokenRoles);
    const currentRoleSet = new Set(currentRoles);
    
    // Check for removed high-privilege roles
    const removedRoles = tokenRoles.filter(role => !currentRoleSet.has(role));
    const highPrivilegeRoles = ['SuperAdmin', 'DomainAdmin', 'SystemAdmin', 'SecurityAdmin'];
    
    const removedHighPrivilegeRoles = removedRoles.filter(role => 
      highPrivilegeRoles.includes(role)
    );
    
    // If high-privilege roles were removed, consider it significant
    if (removedHighPrivilegeRoles.length > 0) {
      return true;
    }
    
    // Check for major role count changes (more than 50% difference)
    const changeRatio = Math.abs(tokenRoles.length - currentRoles.length) / Math.max(tokenRoles.length, 1);
    if (changeRatio > 0.5) {
      return true;
    }
    
    return false;
  }
}
