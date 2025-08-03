import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if user session exists
    if (request.session && request.session.user) {
      return true;
    }
    
    throw new UnauthorizedException('Session not found or expired');
  }
}
