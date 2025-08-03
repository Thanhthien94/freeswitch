import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';

export type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

@Injectable()
export class SessionAuthWsMiddleware {
  private readonly logger = new Logger(SessionAuthWsMiddleware.name);

  constructor(private readonly authService: AuthService) {}

  createMiddleware(): SocketMiddleware {
    return async (socket: Socket, next) => {
      try {
        // Get session cookie from handshake headers
        const cookies = socket.handshake.headers.cookie;
        
        if (!cookies) {
          this.logger.warn(`WebSocket connection rejected: No cookies provided from ${socket.handshake.address}`);
          return next(new Error('Session cookie is missing'));
        }

        // Parse session cookie
        const sessionCookie = this.extractSessionCookie(cookies);
        
        if (!sessionCookie) {
          this.logger.warn(`WebSocket connection rejected: No session cookie found from ${socket.handshake.address}`);
          return next(new Error('Session cookie is missing'));
        }

        // Validate session
        const user = await this.authService.validateSession(sessionCookie);

        if (!user) {
          this.logger.warn(`WebSocket connection rejected: Invalid session from ${socket.handshake.address}`);
          return next(new Error('Invalid session'));
        }

        // Attach user to socket for later use
        socket.data.user = user;
        socket.data.authenticated = true;

        this.logger.log(`WebSocket authenticated via session: ${user.username} (${user.id}) from ${socket.handshake.address}`);
        
        next();
      } catch (error) {
        this.logger.error(`WebSocket session authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    };
  }

  private extractSessionCookie(cookieHeader: string): string | null {
    try {
      // Parse cookies from header
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      // Look for session cookie (adjust name based on your session configuration)
      return cookies['connect.sid'] || cookies['session'] || cookies['sessionId'] || null;
    } catch (error) {
      this.logger.error(`Failed to parse cookies: ${error.message}`);
      return null;
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

  // Helper method to check user permissions
  static hasPermission(socket: Socket, permission: string): boolean {
    const user = SessionAuthWsMiddleware.getUser(socket);
    return user?.permissions?.includes(permission) || user?.permissions?.includes('*:manage') || false;
  }

  // Helper method to check user roles
  static hasRole(socket: Socket, role: string): boolean {
    const user = SessionAuthWsMiddleware.getUser(socket);
    return user?.roles?.includes(role) || false;
  }

  // Helper method to check domain access
  static canAccessDomain(socket: Socket, domainId: string): boolean {
    const user = SessionAuthWsMiddleware.getUser(socket);
    
    // SuperAdmin can access all domains
    if (user?.roles?.includes('superadmin')) {
      return true;
    }

    // Check if user belongs to the domain
    return user?.domainId === domainId;
  }
}
