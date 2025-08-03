import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealthStatus();
  }

  @Get('freeswitch')
  @Public()
  @ApiOperation({ summary: 'Get FreeSWITCH health status' })
  @ApiResponse({ status: 200, description: 'FreeSWITCH health status' })
  async getFreeswitchHealth() {
    return this.healthService.getFreeswitchHealth();
  }

  @Get('redis')
  @Public()
  @ApiOperation({ summary: 'Get Redis connection health status' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  async getRedisHealth() {
    return this.healthService.getRedisHealth();
  }
}
