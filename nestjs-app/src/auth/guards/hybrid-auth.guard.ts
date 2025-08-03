import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class HybridAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Try session authentication first (for NextJS frontend)
    if (request.session && request.session.user) {
      request.user = request.session.user;
      return true;
    }

    // Try JWT authentication (for API testing, mobile apps)
    const token = this.extractTokenFromHeader(request);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request.user = {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
          domainId: payload.domainId,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          primaryRole: payload.primaryRole || 'user',
        };
        return true;
      } catch (error) {
        // JWT verification failed, continue to throw unauthorized
      }
    }

    throw new UnauthorizedException('Authentication required');
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
