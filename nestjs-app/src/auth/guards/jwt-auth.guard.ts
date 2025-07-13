import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark endpoints as public (no authentication required)
 */
export const Public = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
  if (propertyKey && descriptor) {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
  } else {
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, target);
  }
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || err?.message || 'Unknown error'}`);
      
      // Log failed authentication attempt
      this.logFailedAuth(request, info);
      
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    // Enhance user object with additional context
    user.clientIp = this.getClientIp(request);
    user.userAgent = request.headers['user-agent'];
    user.requestId = request.headers['x-request-id'] || this.generateRequestId();

    this.logger.debug(`User ${user.id} authenticated successfully`);
    
    return user;
  }

  private logFailedAuth(request: any, info: any): void {
    const clientIp = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const path = request.url;
    
    this.logger.warn(
      `Failed authentication attempt from ${clientIp} to ${path}. ` +
      `Reason: ${info?.message || 'Unknown'}. ` +
      `User-Agent: ${userAgent}`
    );
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

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
