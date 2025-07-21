import { Controller, Post, Body, Req, Ip, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ProfessionalAuthGuard } from './guards/professional-auth.guard';
import { Public } from './decorators/auth.decorators';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ProfessionalAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: ExpressRequest,
    @Ip() clientIp: string,
  ) {
    const userAgent = request.headers['user-agent'];
    return this.authService.login(loginDto, clientIp, userAgent);
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
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { userId: number; sessionId?: string }) {
    await this.authService.logout(body.userId, body.sessionId);
    return { message: 'Logout successful' };
  }
}
