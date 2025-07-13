import { Controller, Post, Body, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Ip() clientIp: string,
  ) {
    const userAgent = request.headers['user-agent'];
    return this.authService.login(loginDto, clientIp, userAgent);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { userId: number; sessionId?: string }) {
    await this.authService.logout(body.userId, body.sessionId);
    return { message: 'Logout successful' };
  }
}
