import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
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
  @ApiOperation({ summary: 'Get FreeSWITCH health status' })
  @ApiResponse({ status: 200, description: 'FreeSWITCH health status' })
  async getFreeswitchHealth() {
    return this.healthService.getFreeswitchHealth();
  }
}
