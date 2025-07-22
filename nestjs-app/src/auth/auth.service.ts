import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { RBACService } from './services/rbac.service';
import { ABACService } from './services/abac.service';
import { AuditLog, AuditAction, AuditResult, RiskLevel } from './entities/audit-log.entity';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string;
    domainId: string;
    roles: string[];
    permissions: string[];
    primaryRole: string;
  };
  expiresIn: number;
  tokenType: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RBACService,
    private readonly abacService: ABACService,
  ) {}

  async login(loginDto: LoginDto, clientIp?: string, userAgent?: string): Promise<LoginResponse> {
    try {

      // Find user by email or username - step by step to avoid complex query error
      const user = await this.userRepository.findOne({
        where: [
          { email: loginDto.emailOrUsername },
          { username: loginDto.emailOrUsername },
        ],
      });

      if (!user) {
        await this.logFailedLogin(loginDto.emailOrUsername, 'User not found', clientIp, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        await this.logFailedLogin(user.username, 'Account inactive', clientIp, userAgent);
        throw new UnauthorizedException('Account is inactive');
      }

      // Validate password
      const isPasswordValid = await user.validatePassword(loginDto.password);

      if (!isPasswordValid) {
        await this.logFailedLogin(user.username, 'Invalid password', clientIp, userAgent);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Load user roles separately to avoid complex query error
      let roles: string[] = [];
      let permissions: string[] = [];
      let primaryRole = 'user';

      try {
        // Load user with relations separately
        const userWithRoles = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['userRoles', 'userRoles.role'],
        });

        if (userWithRoles && userWithRoles.userRoles) {
          const activeRoles = userWithRoles.userRoles.filter(ur => ur.isActive);
          roles = activeRoles.map(ur => ur.role.name);
          primaryRole = activeRoles.find(ur => ur.isPrimary)?.role?.name || roles[0] || 'user';

          // Assign permissions based on roles - compatible with frontend logic
          if (roles.includes('superadmin')) {
            permissions = [
              '*:manage', // Wildcard manage permission
              'users:manage', 'cdr:manage', 'recordings:manage', 'billing:manage',
              'reports:manage', 'analytics:manage', 'system:manage', 'config:manage',
              'security:manage', 'monitoring:manage', 'extensions:manage', 'calls:manage'
            ];
          } else if (roles.includes('admin')) {
            permissions = [
              'users:read', 'users:create', 'users:update', 'users:delete',
              'cdr:read', 'cdr:execute', 'recordings:read', 'recordings:download',
              'config:read', 'config:update', 'monitoring:read'
            ];
          } else {
            permissions = ['cdr:read', 'recordings:read', 'users:read'];
          }
        }
      } catch (roleError) {
        this.logger.warn('Error loading roles, using defaults:', roleError.message);
        roles = ['user'];
        permissions = ['read'];
        primaryRole = 'user';
      }

      // Generate session ID
      const sessionId = this.generateSessionId();

      // Create JWT payload
      const payload: JwtPayload = {
        sub: user.id.toString(),
        username: user.username,
        email: user.email,
        domainId: user.domainId,
        roles,
        permissions,
        primaryRole,
        sessionId,
        tokenType: 'access', // Add tokenType for WebSocket authentication
        iat: Math.floor(Date.now() / 1000),
      };

      // Generate tokens
      try {
        const accessToken = this.jwtService.sign(payload, {
          expiresIn: this.getTokenExpiry(loginDto.rememberMe),
        });
        const refreshToken = loginDto.rememberMe ? this.generateRefreshToken(user.id, sessionId) : undefined;

        // Log successful login
        await this.logSuccessfulLogin(user, clientIp, userAgent, sessionId);

        // Return response
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            domainId: user.domainId,
            roles,
            permissions,
            primaryRole,
          },
          expiresIn: this.getTokenExpiry(loginDto.rememberMe),
          tokenType: 'Bearer',
        };
      } catch (jwtError) {
        throw new UnauthorizedException('Token generation failed');
      }

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Login error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async register(registerDto: RegisterDto, createdBy?: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });

      if (existingUser) {
        if (existingUser.email === registerDto.email) {
          throw new BadRequestException('Email already exists');
        }
        if (existingUser.username === registerDto.username) {
          throw new BadRequestException('Username already exists');
        }
      }

      // Create new user
      const user = this.userRepository.create({
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password, // Will be hashed by entity hook
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        // Role will be assigned via RBAC system
      });

      const savedUser = await this.userRepository.save(user);

      // Assign default role
      await this.rbacService.assignRole(
        savedUser.id,
        await this.getDefaultRoleId(),
        createdBy || 'system',
        { isPrimary: true, reason: 'Default role assignment during registration' }
      );

      // Log registration
      await this.createAuditLog(
        savedUser.id,
        AuditAction.LOGIN,
        AuditResult.SUCCESS,
        'User registered successfully',
        { registeredBy: createdBy }
      );

      return savedUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Registration error:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async logout(userId: number, sessionId?: string): Promise<void> {
    try {
      // In a production system, you would:
      // 1. Invalidate the session in Redis/database
      // 2. Add token to blacklist
      // 3. Clear any cached permissions

      // Log logout
      await this.createAuditLog(
        userId,
        AuditAction.LOGOUT,
        AuditResult.SUCCESS,
        'User logged out successfully',
        { sessionId }
      );

      this.logger.debug(`User ${userId} logged out successfully`);
    } catch (error) {
      this.logger.error('Logout error:', error);
      // Don't throw error for logout - it should always succeed
    }
  }

  // ==================== UTILITY METHODS ====================

  private async getDefaultRoleId(): Promise<string> {
    // This would fetch the default role ID from database
    // For now, return a placeholder
    return 'default-user-role-id';
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private getTokenExpiry(rememberMe?: boolean): number {
    const defaultExpiry = this.configService.get<number>('JWT_EXPIRY', 3600); // 1 hour
    const extendedExpiry = this.configService.get<number>('JWT_EXTENDED_EXPIRY', 604800); // 7 days

    return rememberMe ? extendedExpiry : defaultExpiry;
  }

  private generateRefreshToken(userId: number, sessionId: string): string {
    const payload = {
      sub: userId,
      sessionId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }

  private async logSuccessfulLogin(
    user: User,
    clientIp?: string,
    userAgent?: string,
    sessionId?: string,
  ): Promise<void> {
    await this.createAuditLog(
      user.id,
      AuditAction.LOGIN,
      AuditResult.SUCCESS,
      'User logged in successfully',
      {
        username: user.username,
        domainId: user.domainId,
        clientIp,
        userAgent,
        sessionId,
      }
    );
  }

  private async logFailedLogin(
    identifier: string,
    reason: string,
    clientIp?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.auditLogRepository.save({
      action: AuditAction.LOGIN,
      result: AuditResult.FAILURE,
      description: `Login failed: ${reason}`,
      username: identifier,
      clientIp,
      userAgent,
      riskLevel: RiskLevel.MEDIUM,
      metadata: { reason, identifier },
    });
  }

  private async createAuditLog(
    userId: number,
    action: AuditAction,
    result: AuditResult,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      result,
      description,
      metadata,
    });

    await this.auditLogRepository.save(auditLog);
  }

  // Alias for createAuditLog for consistency
  private async logAuditEvent(
    userId: number,
    action: AuditAction,
    result: AuditResult,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.createAuditLog(userId, action, result, description, metadata);
  }

  async generateWebSocketToken(user: any): Promise<{ token: string; expiresIn: number }> {
    try {
      // Create a short-lived token specifically for WebSocket connections
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        domainId: user.domainId,
        roles: user.roles?.map(role => role.name) || [],
        permissions: user.permissions || [],
        primaryRole: user.primaryRole,
        iat: Math.floor(Date.now() / 1000),
        tokenType: 'websocket', // Mark as WebSocket token
      };

      const expiresIn = 3600; // 1 hour
      const token = this.jwtService.sign(payload, {
        expiresIn: `${expiresIn}s`,
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.logger.log(`WebSocket token generated for user: ${user.username}`);

      // Log audit trail
      await this.logAuditEvent(
        user.id,
        AuditAction.WEBSOCKET_TOKEN_GENERATED,
        AuditResult.SUCCESS,
        'WebSocket token generated successfully',
        {
          expiresIn,
          tokenType: 'websocket',
        },
      );

      return {
        token,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to generate WebSocket token for user ${user.username}:`, error);

      // Log audit trail for failure
      await this.logAuditEvent(
        user.id,
        AuditAction.WEBSOCKET_TOKEN_GENERATED,
        AuditResult.FAILURE,
        'Failed to generate WebSocket token',
        {
          error: error.message,
        },
      );

      throw new BadRequestException('Failed to generate WebSocket token');
    }
  }

  async validateWebSocketToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Accept both access and websocket tokens for WebSocket connections
      console.log('🔍 WebSocket token payload:', { tokenType: payload.tokenType, sub: payload.sub });
      if (payload.tokenType !== 'websocket' && payload.tokenType !== 'access') {
        console.log('❌ Invalid token type:', payload.tokenType);
        throw new UnauthorizedException('Invalid token type for WebSocket');
      }

      // Get fresh user data - simplified query first
      console.log('🔍 Looking for user with ID:', payload.sub);
      try {
        // First try simple query without relations
        const user = await this.userRepository.findOne({
          where: { id: payload.sub },
        });

        console.log('🔍 User found (simple):', user ? `${user.username} (ID: ${user.id})` : 'null');
        if (!user) {
          console.log('❌ User not found in database');
          throw new UnauthorizedException('User not found');
        }

        console.log('✅ User validation successful');

        // Return user data for WebSocket authentication
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          domainId: user.domainId,
          roles: [], // Simplified for now - no relations loaded
          permissions: [], // Simplified for now - no relations loaded
          primaryRole: payload.primaryRole,
        };
      } catch (error) {
        console.log('❌ Database query error:', error.message);
        throw new UnauthorizedException('Database error during user lookup');
      }
    } catch (error) {
      this.logger.error('WebSocket token validation failed:', error);
      throw new UnauthorizedException('Invalid WebSocket token');
    }
  }


}
