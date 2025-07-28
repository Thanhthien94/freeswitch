import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEnum, Min, Max, IsIP } from 'class-validator';
import { NetworkConfigStatus } from '../entities/global-network-config.entity';

export class CreateGlobalNetworkConfigDto {
  @ApiPropertyOptional({ description: 'Configuration name', example: 'default' })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({ description: 'Display name for the configuration' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'External IP address', example: 'auto' })
  @IsOptional()
  @IsString()
  externalIp?: string;

  @ApiPropertyOptional({ description: 'Bind server IP address', example: 'auto' })
  @IsOptional()
  @IsString()
  bindServerIp?: string;

  @ApiPropertyOptional({ description: 'Domain name', example: 'localhost' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'SIP port', example: 5060 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  sipPort?: number;

  @ApiPropertyOptional({ description: 'External SIP port' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  externalSipPort?: number;

  @ApiPropertyOptional({ description: 'TLS port', example: 5061 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  tlsPort?: number;

  @ApiPropertyOptional({ description: 'External TLS port' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  externalTlsPort?: number;

  @ApiPropertyOptional({ description: 'RTP start port', example: 16384 })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  rtpStartPort?: number;

  @ApiPropertyOptional({ description: 'RTP end port', example: 16484 })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  rtpEndPort?: number;

  @ApiPropertyOptional({ description: 'External RTP IP address' })
  @IsOptional()
  @IsString()
  externalRtpIp?: string;

  @ApiPropertyOptional({ description: 'STUN server URL', example: 'stun:stun.freeswitch.org' })
  @IsOptional()
  @IsString()
  stunServer?: string;

  @ApiPropertyOptional({ description: 'Enable STUN', example: true })
  @IsOptional()
  @IsBoolean()
  stunEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Global codec preferences', example: 'OPUS,G722,PCMU,PCMA' })
  @IsOptional()
  @IsString()
  globalCodecPrefs?: string;

  @ApiPropertyOptional({ description: 'Outbound codec preferences', example: 'OPUS,G722,PCMU,PCMA' })
  @IsOptional()
  @IsString()
  outboundCodecPrefs?: string;

  @ApiPropertyOptional({ description: 'Transport protocols', example: ['udp', 'tcp'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transportProtocols?: string[];

  @ApiPropertyOptional({ description: 'Enable TLS', example: false })
  @IsOptional()
  @IsBoolean()
  enableTls?: boolean;

  @ApiPropertyOptional({ description: 'Enable NAT detection', example: true })
  @IsOptional()
  @IsBoolean()
  natDetection?: boolean;

  @ApiPropertyOptional({ description: 'Enable auto NAT', example: true })
  @IsOptional()
  @IsBoolean()
  autoNat?: boolean;

  @ApiPropertyOptional({ description: 'Auto apply configuration changes', example: false })
  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Configuration tags' })
  @IsOptional()
  tags?: any;
}

export class UpdateGlobalNetworkConfigDto extends CreateGlobalNetworkConfigDto {}

export class NetworkConfigValidationResult {
  @ApiProperty({ description: 'Whether the configuration is valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors: string[];

  @ApiProperty({ description: 'Validation warnings', type: [String] })
  warnings: string[];
}

export class ApplyConfigResult {
  @ApiProperty({ description: 'Whether the apply operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Apply operation message' })
  message: string;

  @ApiPropertyOptional({ description: 'Apply operation errors', type: [String] })
  errors?: string[];

  @ApiProperty({ description: 'When the configuration was applied' })
  appliedAt: Date;

  @ApiPropertyOptional({ description: 'Path to configuration backup' })
  configBackup?: string;
}

export class ExternalIpDetectionResult {
  @ApiProperty({ description: 'Detected external IP address' })
  detectedIp: string;

  @ApiProperty({ description: 'Detection method used', enum: ['stun', 'http', 'manual'] })
  method: 'stun' | 'http' | 'manual';

  @ApiProperty({ description: 'Whether detection was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if detection failed' })
  error?: string;
}

export class NetworkConfigResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Network configuration data' })
  data?: any;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Error messages', type: [String] })
  errors?: string[];
}

export class ValidationResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Validation result data' })
  data?: NetworkConfigValidationResult;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;
}

export class ApplyConfigResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Apply result data' })
  data?: ApplyConfigResult;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;
}

export class IpDetectionResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'IP detection result data' })
  data?: ExternalIpDetectionResult;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;
}

export class NetworkConfigStatusDto {
  @ApiProperty({ description: 'Configuration ID' })
  configId: number;

  @ApiProperty({ description: 'Configuration status', enum: NetworkConfigStatus })
  status: NetworkConfigStatus;

  @ApiPropertyOptional({ description: 'When configuration was last applied' })
  lastAppliedAt?: Date;

  @ApiPropertyOptional({ description: 'Who last applied the configuration' })
  lastAppliedBy?: string;

  @ApiProperty({ description: 'Whether configuration is valid' })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'Validation errors', type: [String] })
  validationErrors?: string[];

  @ApiPropertyOptional({ description: 'Validation warnings', type: [String] })
  validationWarnings?: string[];
}
