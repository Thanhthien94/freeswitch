import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Number of active calls' })
  @IsNumber()
  activeCalls: number;

  @ApiProperty({ description: 'Total calls today' })
  @IsNumber()
  todaysCalls: number;

  @ApiProperty({ description: 'Number of team members' })
  @IsNumber()
  teamMembers: number;

  @ApiProperty({ description: 'Monthly cost in USD' })
  @IsNumber()
  monthlyCost: number;

  @ApiProperty({ description: 'Call quality percentage' })
  @IsNumber()
  callQuality: number;

  @ApiProperty({ description: 'System health percentage' })
  @IsNumber()
  systemHealth: number;

  @ApiProperty({ description: 'Average call duration in seconds' })
  @IsNumber()
  avgCallDuration: number;

  @ApiProperty({ description: 'Calls per hour' })
  @IsNumber()
  callsPerHour: number;

  @ApiProperty({ description: 'Peak hours range' })
  @IsString()
  peakHours: string;

  @ApiProperty({ description: 'Number of busy extensions' })
  @IsNumber()
  busyExtensions: number;
}

export class CallCenterStatsDto {
  @ApiProperty({ description: 'Number of queued calls' })
  @IsNumber()
  queuedCalls: number;

  @ApiProperty({ description: 'Average wait time in seconds' })
  @IsNumber()
  averageWaitTime: number;

  @ApiProperty({ description: 'Number of agents online' })
  @IsNumber()
  agentsOnline: number;

  @ApiProperty({ description: 'Number of available agents' })
  @IsNumber()
  agentsAvailable: number;

  @ApiProperty({ description: 'Number of busy agents' })
  @IsNumber()
  agentsBusy: number;

  @ApiProperty({ description: 'Number of calls answered' })
  @IsNumber()
  callsAnswered: number;

  @ApiProperty({ description: 'Number of calls abandoned' })
  @IsNumber()
  callsAbandoned: number;

  @ApiProperty({ description: 'Service level percentage' })
  @IsNumber()
  serviceLevel: number;

  @ApiProperty({ description: 'Average handle time in seconds' })
  @IsNumber()
  avgHandleTime: number;
}

export class SystemStatusDto {
  @ApiProperty({ description: 'FreeSWITCH status', enum: ['online', 'offline', 'degraded'] })
  @IsString()
  freeswitchStatus: 'online' | 'offline' | 'degraded';

  @ApiProperty({ description: 'Database status', enum: ['online', 'offline', 'degraded'] })
  @IsString()
  databaseStatus: 'online' | 'offline' | 'degraded';

  @ApiProperty({ description: 'Redis status', enum: ['online', 'offline', 'degraded'] })
  @IsString()
  redisStatus: 'online' | 'offline' | 'degraded';

  @ApiProperty({ description: 'RabbitMQ status', enum: ['online', 'offline', 'degraded'] })
  @IsString()
  rabbitmqStatus: 'online' | 'offline' | 'degraded';

  @ApiProperty({ description: 'CPU usage percentage' })
  @IsNumber()
  cpuUsage: number;

  @ApiProperty({ description: 'Memory usage percentage' })
  @IsNumber()
  memoryUsage: number;

  @ApiProperty({ description: 'Disk usage percentage' })
  @IsNumber()
  diskUsage: number;

  @ApiProperty({ description: 'Network latency in milliseconds' })
  @IsNumber()
  networkLatency: number;

  @ApiProperty({ description: 'System uptime in seconds' })
  @IsNumber()
  uptime: number;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Activity type', enum: ['call', 'registration', 'system', 'user', 'error'] })
  @IsString()
  type: 'call' | 'registration' | 'system' | 'user' | 'error';

  @ApiProperty({ description: 'Activity message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Activity severity', enum: ['info', 'warning', 'error', 'success'] })
  @IsString()
  severity: 'info' | 'warning' | 'error' | 'success';

  @ApiProperty({ description: 'User ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'User name', required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ description: 'Additional details', required: false })
  @IsOptional()
  details?: Record<string, any>;
}

export class AlertDto {
  @ApiProperty({ description: 'Alert ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Alert type', enum: ['system', 'security', 'performance', 'business'] })
  @IsString()
  type: 'system' | 'security' | 'performance' | 'business';

  @ApiProperty({ description: 'Alert severity', enum: ['low', 'medium', 'high', 'critical'] })
  @IsString()
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Alert timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Whether alert is acknowledged' })
  acknowledged: boolean;

  @ApiProperty({ description: 'Alert resolution timestamp', required: false })
  @IsOptional()
  resolvedAt?: Date;

  @ApiProperty({ description: 'Additional details', required: false })
  @IsOptional()
  details?: Record<string, any>;
}

export class LiveMetricsDto {
  @ApiProperty({ description: 'Metrics timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Number of active calls' })
  @IsNumber()
  activeCalls: number;

  @ApiProperty({ description: 'Calls per minute' })
  @IsNumber()
  callsPerMinute: number;

  @ApiProperty({ description: 'System load percentage' })
  @IsNumber()
  systemLoad: number;

  @ApiProperty({ description: 'Memory usage percentage' })
  @IsNumber()
  memoryUsage: number;

  @ApiProperty({ description: 'Network latency in milliseconds' })
  @IsNumber()
  networkLatency: number;
}

export class DashboardDataDto {
  @ApiProperty({ description: 'Dashboard statistics' })
  stats: DashboardStatsDto;

  @ApiProperty({ description: 'Call center statistics' })
  callCenterStats: CallCenterStatsDto;

  @ApiProperty({ description: 'System status' })
  systemStatus: SystemStatusDto;

  @ApiProperty({ description: 'Recent activity list' })
  recentActivity: RecentActivityDto[];

  @ApiProperty({ description: 'Active alerts list' })
  alerts: AlertDto[];
}
