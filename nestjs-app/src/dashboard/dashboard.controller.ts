import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Query, 
  Param, 
  Body, 
  UseGuards, 
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ProfessionalAuthGuard } from '../auth/guards/professional-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { 
  DashboardStatsDto, 
  CallCenterStatsDto, 
  SystemStatusDto, 
  RecentActivityDto, 
  AlertDto, 
  LiveMetricsDto,
  DashboardDataDto 
} from './dto/dashboard-stats.dto';
import { 
  GetRecentActivityDto, 
  GetHistoricalMetricsDto, 
  ExportDashboardDataDto,
  HistoricalMetricsResponseDto,
  TrendingDataResponseDto,
  AcknowledgeAlertDto,
  ResolveAlertDto
} from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get comprehensive dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: DashboardDataDto })
  async getDashboardData(): Promise<DashboardDataDto> {
    try {
      this.logger.log('Getting dashboard data');
      return await this.dashboardService.getDashboardData();
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw new HttpException('Failed to get dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: DashboardStatsDto })
  async getStats(): Promise<DashboardStatsDto> {
    try {
      this.logger.log('Getting dashboard stats');
      return await this.dashboardService.getStats();
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      throw new HttpException('Failed to get dashboard stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('call-center')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get call center statistics' })
  @ApiResponse({ status: 200, description: 'Call center stats retrieved successfully', type: CallCenterStatsDto })
  async getCallCenterStats(): Promise<CallCenterStatsDto> {
    try {
      this.logger.log('Getting call center stats');
      return await this.dashboardService.getCallCenterStats();
    } catch (error) {
      this.logger.error('Error getting call center stats:', error);
      throw new HttpException('Failed to get call center stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('system-status')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get system status and health metrics' })
  @ApiResponse({ status: 200, description: 'System status retrieved successfully', type: SystemStatusDto })
  async getSystemStatus(): Promise<SystemStatusDto> {
    try {
      this.logger.log('Getting system status');
      return await this.dashboardService.getSystemStatus();
    } catch (error) {
      this.logger.error('Error getting system status:', error);
      throw new HttpException('Failed to get system status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('activity')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get recent activity feed' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully', type: [RecentActivityDto] })
  async getRecentActivity(@Query() query: GetRecentActivityDto): Promise<RecentActivityDto[]> {
    try {
      this.logger.log('Getting recent activity');
      return await this.dashboardService.getRecentActivity(query);
    } catch (error) {
      this.logger.error('Error getting recent activity:', error);
      throw new HttpException('Failed to get recent activity', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('alerts')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get active alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully', type: [AlertDto] })
  async getAlerts(): Promise<AlertDto[]> {
    try {
      this.logger.log('Getting alerts');
      return await this.dashboardService.getAlerts();
    } catch (error) {
      this.logger.error('Error getting alerts:', error);
      throw new HttpException('Failed to get alerts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('alerts/:id/acknowledge')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  async acknowledgeAlert(@Param('id') alertId: string): Promise<{ message: string }> {
    try {
      this.logger.log(`Acknowledging alert: ${alertId}`);
      await this.dashboardService.acknowledgeAlert(alertId);
      return { message: 'Alert acknowledged successfully' };
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw new HttpException('Failed to acknowledge alert', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('alerts/:id/resolve')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolveAlert(@Param('id') alertId: string): Promise<{ message: string }> {
    try {
      this.logger.log(`Resolving alert: ${alertId}`);
      await this.dashboardService.resolveAlert(alertId);
      return { message: 'Alert resolved successfully' };
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      throw new HttpException('Failed to resolve alert', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('live-metrics')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get live metrics for real-time charts' })
  @ApiResponse({ status: 200, description: 'Live metrics retrieved successfully', type: LiveMetricsDto })
  async getLiveMetrics(): Promise<LiveMetricsDto> {
    try {
      this.logger.log('Getting live metrics');
      return await this.dashboardService.getLiveMetrics();
    } catch (error) {
      this.logger.error('Error getting live metrics:', error);
      throw new HttpException('Failed to get live metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metrics/:metric')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get historical metrics for charts' })
  @ApiResponse({ status: 200, description: 'Historical metrics retrieved successfully', type: HistoricalMetricsResponseDto })
  async getHistoricalMetrics(
    @Param('metric') metric: string,
    @Query() query: Omit<GetHistoricalMetricsDto, 'metric'>
  ): Promise<HistoricalMetricsResponseDto> {
    try {
      this.logger.log(`Getting historical metrics for: ${metric}`);
      return await this.dashboardService.getHistoricalMetrics({ ...query, metric });
    } catch (error) {
      this.logger.error('Error getting historical metrics:', error);
      throw new HttpException('Failed to get historical metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Export dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data exported successfully' })
  async exportDashboardData(@Query() query: ExportDashboardDataDto): Promise<any> {
    try {
      this.logger.log(`Exporting dashboard data in ${query.format} format`);
      return await this.dashboardService.exportDashboardData(query);
    } catch (error) {
      this.logger.error('Error exporting dashboard data:', error);
      throw new HttpException('Failed to export dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('domain/:domainId')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get domain-specific dashboard data' })
  @ApiResponse({ status: 200, description: 'Domain dashboard data retrieved successfully', type: DashboardDataDto })
  async getDomainDashboard(@Param('domainId') domainId: string): Promise<DashboardDataDto> {
    try {
      this.logger.log(`Getting dashboard data for domain: ${domainId}`);
      // Implement domain-specific dashboard logic
      return await this.dashboardService.getDashboardData();
    } catch (error) {
      this.logger.error('Error getting domain dashboard data:', error);
      throw new HttpException('Failed to get domain dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user')
  @Roles(Role.USER, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get user-specific dashboard data' })
  @ApiResponse({ status: 200, description: 'User dashboard data retrieved successfully', type: DashboardDataDto })
  async getUserDashboard(): Promise<DashboardDataDto> {
    try {
      this.logger.log('Getting user dashboard data');
      // Implement user-specific dashboard logic
      return await this.dashboardService.getDashboardData();
    } catch (error) {
      this.logger.error('Error getting user dashboard data:', error);
      throw new HttpException('Failed to get user dashboard data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
