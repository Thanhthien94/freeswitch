import {
  Controller,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HybridAuthGuard } from '../../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemStatusService } from '../services/system-status.service';

@ApiTags('System Status')
@ApiBearerAuth()
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('system/status')
export class SystemStatusController {
  private readonly logger = new Logger(SystemStatusController.name);

  constructor(
    private readonly systemStatusService: SystemStatusService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  @ApiOperation({ 
    summary: 'Get comprehensive system status',
    description: 'Retrieve real-time system health, metrics, and service status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System status retrieved successfully'
  })
  async getSystemStatus() {
    try {
      this.logger.log('Getting comprehensive system status');
      
      const systemStatus = await this.systemStatusService.getComprehensiveStatus();
      
      return {
        success: true,
        data: systemStatus,
        timestamp: new Date().toISOString(),
        message: 'System status retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get system status: ${error.message}`);
      throw error;
    }
  }

  @Get('metrics')
  @Roles('superadmin', 'admin')
  @ApiOperation({ 
    summary: 'Get system metrics only',
    description: 'Retrieve CPU, memory, disk, and network metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System metrics retrieved successfully'
  })
  async getSystemMetrics() {
    try {
      this.logger.log('Getting system metrics');
      
      const metrics = await this.systemStatusService.getSystemMetrics();
      
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
        message: 'System metrics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`);
      throw error;
    }
  }

  @Get('services')
  @Roles('superadmin', 'admin')
  @ApiOperation({ 
    summary: 'Get services status only',
    description: 'Retrieve status of all system services'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Services status retrieved successfully'
  })
  async getServicesStatus() {
    try {
      this.logger.log('Getting services status');
      
      const services = await this.systemStatusService.getServicesStatus();
      
      return {
        success: true,
        data: services,
        timestamp: new Date().toISOString(),
        message: 'Services status retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get services status: ${error.message}`);
      throw error;
    }
  }

  @Get('freeswitch')
  @Roles('superadmin', 'admin')
  @ApiOperation({ 
    summary: 'Get FreeSWITCH specific status',
    description: 'Retrieve FreeSWITCH calls, extensions, and performance data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'FreeSWITCH status retrieved successfully'
  })
  async getFreeSwitchStatus() {
    try {
      this.logger.log('Getting FreeSWITCH status');
      
      const freeswitchStatus = await this.systemStatusService.getFreeSwitchStatus();
      
      return {
        success: true,
        data: freeswitchStatus,
        timestamp: new Date().toISOString(),
        message: 'FreeSWITCH status retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get FreeSWITCH status: ${error.message}`);
      throw error;
    }
  }
}
