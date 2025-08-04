import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between, In } from 'typeorm';
import { AuditLog, AuditAction, AuditResult, RiskLevel } from '../auth/entities/audit-log.entity';

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: number;
  username?: string;
  action?: AuditAction;
  result?: AuditResult;
  resourceType?: string;
  resourceId?: string;
  riskLevel?: RiskLevel;
  startDate?: Date;
  endDate?: Date;
  clientIp?: string;
  search?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  successfulActions: number;
  highRiskEvents: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ username: string; count: number }>;
  riskDistribution: Array<{ riskLevel: string; count: number }>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params: AuditLogQueryParams): Promise<AuditLogResponse> {
    const {
      page = 1,
      limit = 50,
      userId,
      username,
      action,
      result,
      resourceType,
      resourceId,
      riskLevel,
      startDate,
      endDate,
      clientIp,
      search,
    } = params;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }

    if (username) {
      queryBuilder.andWhere('audit.username ILIKE :username', { username: `%${username}%` });
    }

    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    if (result) {
      queryBuilder.andWhere('audit.result = :result', { result });
    }

    if (resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', { resourceType });
    }

    if (resourceId) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', { resourceId });
    }

    if (riskLevel) {
      queryBuilder.andWhere('audit.riskLevel = :riskLevel', { riskLevel });
    }

    if (clientIp) {
      queryBuilder.andWhere('audit.clientIp = :clientIp', { clientIp });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('audit.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate });
    }

    // Search across multiple fields
    if (search) {
      queryBuilder.andWhere(
        '(audit.description ILIKE :search OR audit.username ILIKE :search OR audit.resourceType ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const data = await queryBuilder
      .orderBy('audit.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(): Promise<AuditLogStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total logs
    const totalLogs = await this.auditLogRepository.count();

    // Today's logs
    const todayLogs = await this.auditLogRepository.count({
      where: {
        timestamp: Between(today, tomorrow),
      },
    });

    // Failed vs successful actions
    const failedActions = await this.auditLogRepository.count({
      where: { result: AuditResult.FAILURE },
    });

    const successfulActions = await this.auditLogRepository.count({
      where: { result: AuditResult.SUCCESS },
    });

    // High risk events
    const highRiskEvents = await this.auditLogRepository.count({
      where: { riskLevel: RiskLevel.HIGH },
    });

    // Top actions
    const topActionsQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topActions = topActionsQuery.map(item => ({
      action: item.action,
      count: parseInt(item.count),
    }));

    // Top users
    const topUsersQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.username', 'username')
      .addSelect('COUNT(*)', 'count')
      .where('audit.username IS NOT NULL')
      .groupBy('audit.username')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topUsers = topUsersQuery.map(item => ({
      username: item.username,
      count: parseInt(item.count),
    }));

    // Risk distribution
    const riskDistributionQuery = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.riskLevel')
      .getRawMany();

    const riskDistribution = riskDistributionQuery.map(item => ({
      riskLevel: item.riskLevel,
      count: parseInt(item.count),
    }));

    return {
      totalLogs,
      todayLogs,
      failedActions,
      successfulActions,
      highRiskEvents,
      topActions,
      topUsers,
      riskDistribution,
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
    });

    if (!auditLog) {
      throw new Error('Audit log not found');
    }

    return auditLog;
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(auditLogData: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(auditLogData);
    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Get audit logs for specific user
   */
  async getUserAuditLogs(userId: number, limit: number = 50): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs for specific resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Export audit logs (for compliance)
   */
  async exportAuditLogs(params: AuditLogQueryParams): Promise<AuditLog[]> {
    const { data } = await this.getAuditLogs({ ...params, limit: 10000 });
    return data;
  }
}
