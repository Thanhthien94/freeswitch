import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TimeRange {
  ONE_HOUR = '1h',
  SIX_HOURS = '6h',
  TWENTY_FOUR_HOURS = '24h',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d'
}

export enum MetricInterval {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  ONE_DAY = '1d'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

export class GetRecentActivityDto {
  @ApiProperty({ description: 'Maximum number of activities to return', required: false, default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({ description: 'Activity type filter', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Activity severity filter', required: false })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({ description: 'User ID filter', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class GetHistoricalMetricsDto {
  @ApiProperty({ description: 'Metric name to retrieve' })
  @IsString()
  metric: string;

  @ApiProperty({ description: 'Time range for metrics', enum: TimeRange })
  @IsEnum(TimeRange)
  range: TimeRange;

  @ApiProperty({ description: 'Data interval', enum: MetricInterval, required: false, default: MetricInterval.FIVE_MINUTES })
  @IsOptional()
  @IsEnum(MetricInterval)
  interval?: MetricInterval = MetricInterval.FIVE_MINUTES;
}

export class ExportDashboardDataDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Time range for export', enum: TimeRange })
  @IsEnum(TimeRange)
  range: TimeRange;

  @ApiProperty({ description: 'Include detailed data', required: false, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDetails?: boolean = false;
}

export class GetTrendingDataDto {
  @ApiProperty({ description: 'Metric name for trending analysis' })
  @IsString()
  metric: string;

  @ApiProperty({ description: 'Analysis period', enum: ['24h', '7d', '30d'] })
  @IsEnum(['24h', '7d', '30d'])
  period: '24h' | '7d' | '30d';
}

export class UpdateDashboardConfigDto {
  @ApiProperty({ description: 'Dashboard configuration object' })
  config: Record<string, any>;
}

export class AcknowledgeAlertDto {
  @ApiProperty({ description: 'Alert ID to acknowledge' })
  @IsString()
  alertId: string;

  @ApiProperty({ description: 'Acknowledgment note', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveAlertDto {
  @ApiProperty({ description: 'Alert ID to resolve' })
  @IsString()
  alertId: string;

  @ApiProperty({ description: 'Resolution note', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;
}

export class MetricDataPoint {
  @ApiProperty({ description: 'Data point timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  value: number;
}

export class HistoricalMetricsResponseDto {
  @ApiProperty({ description: 'Metric name' })
  @IsString()
  metric: string;

  @ApiProperty({ description: 'Time range' })
  @IsString()
  range: string;

  @ApiProperty({ description: 'Data interval' })
  @IsString()
  interval: string;

  @ApiProperty({ description: 'Data points array', type: [MetricDataPoint] })
  data: MetricDataPoint[];

  @ApiProperty({ description: 'Total data points' })
  @IsNumber()
  totalPoints: number;
}

export class TrendingDataResponseDto {
  @ApiProperty({ description: 'Metric name' })
  @IsString()
  metric: string;

  @ApiProperty({ description: 'Analysis period' })
  @IsString()
  period: string;

  @ApiProperty({ description: 'Trend direction', enum: ['up', 'down', 'stable'] })
  @IsString()
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Percentage change' })
  @IsNumber()
  changePercentage: number;

  @ApiProperty({ description: 'Current value' })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ description: 'Previous value' })
  @IsNumber()
  previousValue: number;

  @ApiProperty({ description: 'Peak value in period' })
  @IsNumber()
  peakValue: number;

  @ApiProperty({ description: 'Low value in period' })
  @IsNumber()
  lowValue: number;

  @ApiProperty({ description: 'Average value in period' })
  @IsNumber()
  averageValue: number;
}

export class DashboardConfigResponseDto {
  @ApiProperty({ description: 'Dashboard configuration' })
  config: Record<string, any>;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Configuration version' })
  @IsString()
  version: string;
}
