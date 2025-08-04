import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService, AuditLogQueryParams } from './audit.service';
import { HybridAuthGuard } from '../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditAction, AuditResult, RiskLevel } from '../auth/entities/audit-log.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs with filtering and pagination
   */
  @Get()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'username', required: false, type: String, description: 'Filter by username' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action' })
  @ApiQuery({ name: 'result', required: false, enum: AuditResult, description: 'Filter by result' })
  @ApiQuery({ name: 'resourceType', required: false, type: String, description: 'Filter by resource type' })
  @ApiQuery({ name: 'resourceId', required: false, type: String, description: 'Filter by resource ID' })
  @ApiQuery({ name: 'riskLevel', required: false, enum: RiskLevel, description: 'Filter by risk level' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'clientIp', required: false, type: String, description: 'Filter by client IP' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description, username, resource type' })
  async getAuditLogs(@Query() query: any) {
    try {
      const params: AuditLogQueryParams = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 50,
        userId: query.userId ? parseInt(query.userId) : undefined,
        username: query.username,
        action: query.action,
        result: query.result,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        riskLevel: query.riskLevel,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        clientIp: query.clientIp,
        search: query.search,
      };

      this.logger.log(`Getting audit logs with params: ${JSON.stringify(params)}`);
      return await this.auditService.getAuditLogs(params);
    } catch (error) {
      this.logger.error('Error getting audit logs:', error);
      throw new HttpException(
        'Failed to retrieve audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get audit log statistics
   */
  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({ status: 200, description: 'Audit log statistics retrieved successfully' })
  async getAuditLogStats() {
    try {
      this.logger.log('Getting audit log statistics');
      return await this.auditService.getAuditLogStats();
    } catch (error) {
      this.logger.error('Error getting audit log statistics:', error);
      throw new HttpException(
        'Failed to retrieve audit log statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get specific audit log by ID
   */
  @Get(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get specific audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(@Param('id') id: string) {
    try {
      this.logger.log(`Getting audit log by ID: ${id}`);
      return await this.auditService.getAuditLogById(id);
    } catch (error) {
      this.logger.error(`Error getting audit log ${id}:`, error);
      if (error.message === 'Audit log not found') {
        throw new HttpException('Audit log not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to retrieve audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get audit logs for specific user
   */
  @Get('user/:userId')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get audit logs for specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 50)' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const userIdNum = parseInt(userId);
      const limitNum = limit ? parseInt(limit) : 50;
      
      this.logger.log(`Getting audit logs for user ${userIdNum}`);
      return await this.auditService.getUserAuditLogs(userIdNum, limitNum);
    } catch (error) {
      this.logger.error(`Error getting audit logs for user ${userId}:`, error);
      throw new HttpException(
        'Failed to retrieve user audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get audit logs for specific resource
   */
  @Get('resource/:resourceType/:resourceId')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get audit logs for specific resource' })
  @ApiParam({ name: 'resourceType', description: 'Resource type' })
  @ApiParam({ name: 'resourceId', description: 'Resource ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 50)' })
  @ApiResponse({ status: 200, description: 'Resource audit logs retrieved successfully' })
  async getResourceAuditLogs(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      
      this.logger.log(`Getting audit logs for resource ${resourceType}:${resourceId}`);
      return await this.auditService.getResourceAuditLogs(resourceType, resourceId, limitNum);
    } catch (error) {
      this.logger.error(`Error getting audit logs for resource ${resourceType}:${resourceId}:`, error);
      throw new HttpException(
        'Failed to retrieve resource audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Export audit logs for compliance
   */
  @Get('export/csv')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Export audit logs as CSV for compliance' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  async exportAuditLogs(@Query() query: any) {
    try {
      const params: AuditLogQueryParams = {
        userId: query.userId ? parseInt(query.userId) : undefined,
        action: query.action,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      this.logger.log(`Exporting audit logs with params: ${JSON.stringify(params)}`);
      const auditLogs = await this.auditService.exportAuditLogs(params);

      // Convert to CSV format
      const csvHeader = [
        'ID',
        'Timestamp',
        'User ID',
        'Username',
        'Action',
        'Result',
        'Description',
        'Resource Type',
        'Resource ID',
        'Client IP',
        'Risk Level',
        'Risk Score',
      ].join(',');

      const csvRows = auditLogs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId || '',
        log.username || '',
        log.action,
        log.result,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        log.resourceType || '',
        log.resourceId || '',
        log.clientIp || '',
        log.riskLevel || '',
        log.riskScore || '',
      ].join(','));

      const csv = [csvHeader, ...csvRows].join('\n');

      return {
        data: csv,
        filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      };
    } catch (error) {
      this.logger.error('Error exporting audit logs:', error);
      throw new HttpException(
        'Failed to export audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
