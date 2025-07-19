import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, IsIP, IsPort, IsIn } from 'class-validator';

export class UpdateConfigDto {
  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Configuration description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Whether configuration is active', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ description: 'Whether configuration requires restart', required: false })
  @IsOptional()
  @IsBoolean()
  requires_restart?: boolean;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  sort_order?: number;
}

export class UpdateNetworkConfigDto {
  @ApiProperty({ description: 'External IP mode', enum: ['auto', 'stun', 'manual'] })
  @IsOptional()
  @IsIn(['auto', 'stun', 'manual'])
  external_ip_mode?: string;

  @ApiProperty({ description: 'External IP address (for manual mode)', required: false })
  @IsOptional()
  @IsIP()
  external_ip?: string;

  @ApiProperty({ description: 'STUN server URL (for STUN mode)', required: false })
  @IsOptional()
  @IsString()
  stun_server?: string;

  @ApiProperty({ description: 'RTP start port' })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  rtp_start_port?: number;

  @ApiProperty({ description: 'RTP end port' })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  rtp_end_port?: number;

  @ApiProperty({ description: 'Internal SIP port' })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  internal_sip_port?: number;

  @ApiProperty({ description: 'Internal TLS port' })
  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(65535)
  internal_tls_port?: number;

  @ApiProperty({ description: 'Bind server IP' })
  @IsOptional()
  @IsString()
  bind_server_ip?: string;
}
