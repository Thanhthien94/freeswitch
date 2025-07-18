import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';

export type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

@Injectable()
export class AuthWsMiddleware {
  private readonly logger = new Logger(AuthWsMiddleware.name);

  constructor(private readonly authService: AuthService) {}

  createMiddleware(): SocketMiddleware {
    return async (socket: Socket, next) => {
      try {
        // Get token from handshake auth
        const token = socket.handshake?.auth?.token;

        if (!token) {
          this.logger.warn(`WebSocket connection rejected: No token provided from ${socket.handshake.address}`);
          return next(new Error('Authorization token is missing'));
        }

        // Validate WebSocket token
        const user = await this.authService.validateWebSocketToken(token);

        if (!user) {
          this.logger.warn(`WebSocket connection rejected: Invalid token from ${socket.handshake.address}`);
          return next(new Error('Invalid authorization token'));
        }

        // Attach user to socket for later use
        socket.data.user = user;
        socket.data.authenticated = true;

        this.logger.log(`WebSocket authenticated: ${user.username} (${user.id}) from ${socket.handshake.address}`);
        
        next();
      } catch (error) {
        this.logger.error(`WebSocket authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    };
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
    const user = AuthWsMiddleware.getUser(socket);
    return user?.permissions?.includes(permission) || false;
  }

  // Helper method to check user roles
  static hasRole(socket: Socket, role: string): boolean {
    const user = AuthWsMiddleware.getUser(socket);
    return user?.roles?.includes(role) || false;
  }

  // Helper method to check domain access
  static canAccessDomain(socket: Socket, domainId: string): boolean {
    const user = AuthWsMiddleware.getUser(socket);
    
    // SuperAdmin can access all domains
    if (user?.roles?.includes('SuperAdmin')) {
      return true;
    }

    // Check if user belongs to the domain
    return user?.domainId === domainId;
  }
}
