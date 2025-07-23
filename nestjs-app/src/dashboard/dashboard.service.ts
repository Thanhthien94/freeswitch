import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  MetricDataPoint
} from './dto/dashboard-query.dto';
import { CallDetailRecord } from '../cdr/cdr.entity';
import { FreeSwitchExtension } from '../freeswitch/entities/freeswitch-extension.entity';
import { Domain } from '../freeswitch/entities/domain.entity';
import { FreeSwitchEslService } from '../freeswitch/services/freeswitch-esl.service';
import * as os from 'os';
import * as fs from 'fs';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(CallDetailRecord)
    private cdrRepository: Repository<CallDetailRecord>,
    @InjectRepository(FreeSwitchExtension)
    private extensionRepository: Repository<FreeSwitchExtension>,
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private freeswitchService: FreeSwitchEslService,
  ) {}

  async getDashboardData(): Promise<DashboardDataDto> {
    this.logger.log('Getting comprehensive dashboard data');

    const [stats, callCenterStats, systemStatus, recentActivity, alerts] = await Promise.all([
      this.getStats(),
      this.getCallCenterStats(),
      this.getSystemStatus(),
      this.getRecentActivity({ limit: 50 }),
      this.getAlerts()
    ]);

    return {
      stats,
      callCenterStats,
      systemStatus,
      recentActivity,
      alerts
    };
  }

  async getStats(): Promise<DashboardStatsDto> {
    this.logger.log('Getting dashboard statistics');

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get active calls from FreeSWITCH
      const activeCalls = await this.getActiveCallsCount();

      // Get today's calls from CDR
      const todaysCalls = await this.cdrRepository.count({
        where: {
          callCreatedAt: {
            gte: today,
            lt: tomorrow
          } as any
        }
      });

      // Get total extensions (team members)
      const teamMembers = await this.extensionRepository.count();

      // Calculate average call duration for today
      const avgDurationResult = await this.cdrRepository
        .createQueryBuilder('cdr')
        .select('AVG(cdr.totalDuration)', 'avgDuration')
        .where('cdr.callCreatedAt >= :today', { today })
        .andWhere('cdr.callCreatedAt < :tomorrow', { tomorrow })
        .getRawOne();

      const avgCallDuration = Math.round(avgDurationResult?.avgDuration || 0);

      // Calculate calls per hour
      const callsPerHour = Math.round(todaysCalls / 24);

      return {
        activeCalls,
        todaysCalls,
        teamMembers,
        monthlyCost: 2450, // Mock data - implement billing calculation
        callQuality: 95, // Mock data - implement quality calculation
        systemHealth: 98, // Mock data - implement health calculation
        avgCallDuration,
        callsPerHour,
        peakHours: '10:00-12:00', // Mock data - implement peak hours calculation
        busyExtensions: Math.floor(activeCalls * 0.6) // Estimate based on active calls
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      // Return mock data on error
      return {
        activeCalls: 0,
        todaysCalls: 0,
        teamMembers: 0,
        monthlyCost: 0,
        callQuality: 0,
        systemHealth: 0,
        avgCallDuration: 0,
        callsPerHour: 0,
        peakHours: '00:00-00:00',
        busyExtensions: 0
      };
    }
  }

  async getCallCenterStats(): Promise<CallCenterStatsDto> {
    this.logger.log('Getting call center statistics');

    try {
      // Get active calls
      const activeCalls = await this.getActiveCallsCount();
      
      // Get online extensions
      const agentsOnline = await this.extensionRepository.count();

      // Estimate available vs busy agents
      const agentsBusy = Math.min(activeCalls, agentsOnline);
      const agentsAvailable = agentsOnline - agentsBusy;

      // Get today's answered calls
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const callsAnswered = await this.cdrRepository.count({
        where: {
          callCreatedAt: {
            gte: today,
            lt: tomorrow
          } as any,
          hangupCause: 'NORMAL_CLEARING'
        }
      });

      const totalCalls = await this.cdrRepository.count({
        where: {
          callCreatedAt: {
            gte: today,
            lt: tomorrow
          } as any
        }
      });

      const callsAbandoned = totalCalls - callsAnswered;
      const serviceLevel = totalCalls > 0 ? Math.round((callsAnswered / totalCalls) * 100) : 100;

      return {
        queuedCalls: 0, // Mock - implement queue monitoring
        averageWaitTime: 45, // Mock - implement wait time calculation
        agentsOnline,
        agentsAvailable,
        agentsBusy,
        callsAnswered,
        callsAbandoned,
        serviceLevel,
        avgHandleTime: 240 // Mock - implement handle time calculation
      };
    } catch (error) {
      this.logger.error('Error getting call center stats:', error);
      return {
        queuedCalls: 0,
        averageWaitTime: 0,
        agentsOnline: 0,
        agentsAvailable: 0,
        agentsBusy: 0,
        callsAnswered: 0,
        callsAbandoned: 0,
        serviceLevel: 0,
        avgHandleTime: 0
      };
    }
  }

  async getSystemStatus(): Promise<SystemStatusDto> {
    this.logger.log('Getting system status');

    try {
      // Check FreeSWITCH status
      const freeswitchStatus = await this.checkFreeswitchStatus();
      
      // Get system metrics
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      const uptime = os.uptime();

      return {
        freeswitchStatus,
        databaseStatus: 'online', // Mock - implement DB health check
        redisStatus: 'online', // Mock - implement Redis health check
        rabbitmqStatus: 'online', // Mock - implement RabbitMQ health check
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkLatency: 12, // Mock - implement network latency check
        uptime
      };
    } catch (error) {
      this.logger.error('Error getting system status:', error);
      return {
        freeswitchStatus: 'offline',
        databaseStatus: 'offline',
        redisStatus: 'offline',
        rabbitmqStatus: 'offline',
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkLatency: 0,
        uptime: 0
      };
    }
  }

  async getRecentActivity(query: GetRecentActivityDto): Promise<RecentActivityDto[]> {
    this.logger.log('Getting recent activity');

    try {
      // Get recent CDR records for call activities
      const recentCalls = await this.cdrRepository.find({
        order: { callCreatedAt: 'DESC' },
        take: Math.min(query.limit || 50, 20),
        select: ['id', 'callerIdNumber', 'destinationNumber', 'callCreatedAt', 'hangupCause']
      });

      const activities: RecentActivityDto[] = [];

      // Convert CDR records to activities
      for (const call of recentCalls) {
        activities.push({
          id: call.id,
          type: 'call',
          message: `Call from ${call.callerIdNumber} to ${call.destinationNumber}`,
          timestamp: call.callCreatedAt,
          severity: call.hangupCause === 'NORMAL_CLEARING' ? 'success' : 'warning',
          details: {
            callerIdNumber: call.callerIdNumber,
            destinationNumber: call.destinationNumber,
            hangupCause: call.hangupCause
          }
        });
      }

      // Add some mock system activities
      const now = new Date();
      activities.push({
        id: 'sys-1',
        type: 'system',
        message: 'System backup completed successfully',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        severity: 'success'
      });

      return activities.slice(0, query.limit || 50);
    } catch (error) {
      this.logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  async getAlerts(): Promise<AlertDto[]> {
    this.logger.log('Getting system alerts');

    // Mock alerts - implement real alert system
    const alerts: AlertDto[] = [];

    // Check system metrics for alerts
    const cpuUsage = await this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();

    if (cpuUsage > 80) {
      alerts.push({
        id: 'cpu-high',
        type: 'performance',
        severity: 'high',
        title: 'High CPU Usage',
        message: `CPU usage is at ${cpuUsage}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (memoryUsage > 80) {
      alerts.push({
        id: 'memory-high',
        type: 'performance',
        severity: 'medium',
        title: 'High Memory Usage',
        message: `Memory usage is at ${memoryUsage}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    this.logger.log(`Acknowledging alert: ${alertId}`);
    // Implement alert acknowledgment logic
  }

  async resolveAlert(alertId: string): Promise<void> {
    this.logger.log(`Resolving alert: ${alertId}`);
    // Implement alert resolution logic
  }

  async getLiveMetrics(): Promise<LiveMetricsDto> {
    this.logger.log('Getting live metrics');

    const activeCalls = await this.getActiveCallsCount();
    const systemLoad = await this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();

    return {
      timestamp: new Date(),
      activeCalls,
      callsPerMinute: Math.round(activeCalls / 60), // Mock calculation
      systemLoad,
      memoryUsage,
      networkLatency: 12 // Mock value
    };
  }

  async getHistoricalMetrics(query: GetHistoricalMetricsDto): Promise<HistoricalMetricsResponseDto> {
    this.logger.log(`Getting historical metrics for ${query.metric}`);

    // Mock historical data - implement real metrics collection
    const data: MetricDataPoint[] = [];
    const now = new Date();
    const points = this.getDataPointsCount(query.range, query.interval);

    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * this.getIntervalMs(query.interval));
      const value = Math.random() * 100; // Mock data
      data.push({ timestamp, value });
    }

    return {
      metric: query.metric,
      range: query.range,
      interval: query.interval,
      data,
      totalPoints: data.length
    };
  }

  async exportDashboardData(query: ExportDashboardDataDto): Promise<any> {
    this.logger.log(`Exporting dashboard data in ${query.format} format`);

    const dashboardData = await this.getDashboardData();

    switch (query.format) {
      case 'json':
        return dashboardData;
      case 'csv':
        return this.convertToCSV(dashboardData);
      case 'pdf':
        return this.convertToPDF(dashboardData);
      default:
        return dashboardData;
    }
  }

  private getDataPointsCount(range: string, interval: string): number {
    const rangeMs = this.getRangeMs(range);
    const intervalMs = this.getIntervalMs(interval);
    return Math.floor(rangeMs / intervalMs);
  }

  private getRangeMs(range: string): number {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return 5 * 60 * 1000;
    }
  }

  private convertToCSV(data: any): string {
    // Implement CSV conversion
    return 'CSV data placeholder';
  }

  private convertToPDF(data: any): Buffer {
    // Implement PDF conversion
    return Buffer.from('PDF data placeholder');
  }

  // Helper methods
  private async getActiveCallsCount(): Promise<number> {
    try {
      // Mock data for now - implement FreeSWITCH integration later
      return Math.floor(Math.random() * 10);
    } catch (error) {
      this.logger.warn('Could not get active calls count from FreeSWITCH:', error.message);
      return 0;
    }
  }

  private async checkFreeswitchStatus(): Promise<'online' | 'offline' | 'degraded'> {
    try {
      // Mock data for now - implement FreeSWITCH integration later
      return 'online';
    } catch (error) {
      this.logger.warn('FreeSWITCH status check failed:', error.message);
      return 'offline';
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 100);
    });
  }

  private cpuAverage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    return { idle, total };
  }

  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const stats = fs.statSync('/');
      // This is a simplified calculation - implement proper disk usage check
      return 45; // Mock value
    } catch (error) {
      return 0;
    }
  }
}
