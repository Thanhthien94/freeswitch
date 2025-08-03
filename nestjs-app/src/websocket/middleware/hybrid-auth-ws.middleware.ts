import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

@Injectable()
export class HybridAuthWsMiddleware {
  private readonly logger = new Logger(HybridAuthWsMiddleware.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createMiddleware(): SocketMiddleware {
    return async (socket: Socket, next) => {
      try {
        this.logger.log(`🔍 WebSocket connection attempt from ${socket.handshake.address}`);
        
        // Try multiple authentication methods
        let user = null;
        let authMethod = 'none';

        // Method 1: JWT Token from handshake auth
        const token = socket.handshake?.auth?.token;
        if (token && token !== 'session-auth' && token !== 'guest-auth') {
          try {
            this.logger.log('🔍 Attempting JWT authentication...');
            user = await this.validateJWTToken(token);
            if (user) {
              authMethod = 'jwt';
              this.logger.log(`✅ JWT authentication successful for user: ${user.username}`);
            }
          } catch (error) {
            this.logger.warn(`❌ JWT authentication failed: ${error.message}`);
          }
        }

        // Method 2: Session Cookie from headers
        if (!user) {
          const cookies = socket.handshake.headers.cookie;
          if (cookies) {
            try {
              this.logger.log('🔍 Attempting session authentication...');
              user = await this.validateSessionCookie(cookies);
              if (user) {
                authMethod = 'session';
                this.logger.log(`✅ Session authentication successful for user: ${user.username}`);
              }
            } catch (error) {
              this.logger.warn(`❌ Session authentication failed: ${error.message}`);
            }
          }
        }

        // Method 3: Allow unauthenticated connections for public data
        if (!user) {
          // For now, allow unauthenticated connections but mark them as guest
          this.logger.log('⚠️ Allowing unauthenticated WebSocket connection as guest');
          user = {
            id: 'guest',
            username: 'guest',
            email: 'guest@localhost',
            domainId: 'localhost',
            roles: ['guest'],
            permissions: ['system:view'],
            primaryRole: 'guest',
            isGuest: true
          };
          authMethod = 'guest';
        }

        // Attach user to socket for later use
        socket.data.user = user;
        socket.data.authenticated = !user.isGuest;
        socket.data.authMethod = authMethod;

        this.logger.log(`🎯 WebSocket authenticated via ${authMethod}: ${user.username} (${user.id}) from ${socket.handshake.address}`);
        
        next();
      } catch (error) {
        this.logger.error(`💥 WebSocket authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    };
  }

  private async validateJWTToken(token: string): Promise<any> {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Accept both access and websocket tokens
      if (payload.tokenType !== 'websocket' && payload.tokenType !== 'access') {
        throw new Error('Invalid token type for WebSocket');
      }

      // Get user from database
      const user = await this.authService.findUserById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        domainId: user.domainId,
        roles: user.roles || [],
        permissions: user.permissions || [],
        primaryRole: user.primaryRole || 'user',
        isGuest: false
      };
    } catch (error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
  }

  private async validateSessionCookie(cookieHeader: string): Promise<any> {
    try {
      // Parse cookies from header
      const cookies = this.parseCookies(cookieHeader);
      
      // Look for session cookie
      const sessionId = cookies['pbx.session.id'] || cookies['connect.sid'] || cookies['session'];
      
      if (!sessionId) {
        throw new Error('No session cookie found');
      }

      // For now, we'll use a simplified approach
      // In production, you'd validate against your session store (Redis)
      this.logger.log(`🔍 Session ID found: ${sessionId.substring(0, 10)}...`);
      
      // Since we don't have direct session validation, we'll return null
      // This will fall back to guest authentication
      throw new Error('Session validation not implemented');
      
    } catch (error) {
      throw new Error(`Session validation failed: ${error.message}`);
    }
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    try {
      return cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      this.logger.error(`Failed to parse cookies: ${error.message}`);
      return {};
    }
  }

  // Helper method to get authenticated user from socket
  static getUser(socket: Socket): any {
    return socket.data?.user;
  }

  // Helper method to check if socket is authenticated
  static isAuthenticated(socket: Socket): boolean {
    return socket.data?.authenticated === true;
  }

  // Helper method to check if socket is guest
  static isGuest(socket: Socket): boolean {
    const user = HybridAuthWsMiddleware.getUser(socket);
    return user?.isGuest === true;
  }

  // Helper method to check user permissions
  static hasPermission(socket: Socket, permission: string): boolean {
    const user = HybridAuthWsMiddleware.getUser(socket);
    if (!user) return false;
    
    // SuperAdmin has all permissions
    if (user.permissions?.includes('*:manage')) return true;
    
    // Check specific permission
    return user.permissions?.includes(permission) || false;
  }

  // Helper method to check user roles
  static hasRole(socket: Socket, role: string): boolean {
    const user = HybridAuthWsMiddleware.getUser(socket);
    return user?.roles?.includes(role) || false;
  }

  // Helper method to check domain access
  static canAccessDomain(socket: Socket, domainId: string): boolean {
    const user = HybridAuthWsMiddleware.getUser(socket);
    
    // SuperAdmin can access all domains
    if (user?.roles?.includes('superadmin')) {
      return true;
    }

    // Check if user belongs to the domain
    return user?.domainId === domainId;
  }

  // Helper method to get auth method
  static getAuthMethod(socket: Socket): string {
    return socket.data?.authMethod || 'none';
  }
}
