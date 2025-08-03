import { Controller, Post, Body, Req, Ip, UseGuards, Request, Get, Session } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { HybridAuthGuard } from './guards/hybrid-auth.guard';
import { Public } from './decorators/auth.decorators';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(HybridAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login with JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful with JWT token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: ExpressRequest,
    @Ip() clientIp: string,
  ) {
    const userAgent = request.headers['user-agent'];
    return this.authService.login(loginDto, clientIp, userAgent);
  }

  @Post('session-login')
  @Public()
  @ApiOperation({ summary: 'User login with session (for NextJS frontend)' })
  @ApiResponse({ status: 200, description: 'Login successful with session' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sessionLogin(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
    @Req() request: ExpressRequest,
    @Ip() clientIp: string,
  ) {
    const userAgent = request.headers['user-agent'];
    return this.authService.sessionLogin(loginDto, session, clientIp, userAgent);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info (works with both JWT and session)' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req, @Session() session: Record<string, any>) {
    // HybridAuthGuard already sets req.user from either JWT or session
    return { user: req.user };
  }

  // Already protected by controller-level guard
  @Post('websocket-token')
  @ApiOperation({ summary: 'Generate WebSocket token' })
  @ApiResponse({ status: 200, description: 'WebSocket token generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWebSocketToken(@Request() req, @Body() body: { userId: number }) {
    // Verify user can only get token for themselves
    if (req.user.id !== body.userId) {
      throw new Error('Unauthorized: Cannot get token for another user');
    }

    return this.authService.generateWebSocketToken(req.user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout (JWT-based)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { userId: number; sessionId?: string }) {
    await this.authService.logout(body.userId, body.sessionId);
    return { message: 'Logout successful' };
  }

  @Post('session-logout')
  @ApiOperation({ summary: 'User logout (session-based)' })
  @ApiResponse({ status: 200, description: 'Session logout successful' })
  async sessionLogout(@Session() session: Record<string, any>) {
    return this.authService.sessionLogout(session);
  }


}
