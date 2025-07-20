import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsNumber, IsString, Min, Max, Matches, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FreeSwitchConfigService } from '../services/freeswitch-config.service';
import { FreeSwitchDirectoryService } from '../services/freeswitch-directory.service';
import { FreeSwitchImportService } from '../services/freeswitch-import.service';
import { FreeSwitchConfig, ExternalIpMode } from '../entities/freeswitch-config.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

// DTOs
export class UpdateConfigDto {
  value: string;
}

export class BulkUpdateConfigDto {
  configs: Array<{
    category: string;
    name: string;
    value: string;
  }>;
}

export class AclRuleDto {
  @ApiProperty({ description: 'Rule type', enum: ['allow', 'deny'] })
  @IsEnum(['allow', 'deny'])
  type: 'allow' | 'deny';

  @ApiProperty({ description: 'CIDR notation (e.g., 192.168.1.0/24)' })
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, { message: 'Invalid CIDR format' })
  cidr: string;

  @ApiProperty({ description: 'Rule description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AclConfigDto {
  @ApiProperty({ description: 'Domain access rules', type: [AclRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AclRuleDto)
  domains: AclRuleDto[];

  @ApiProperty({ description: 'ESL access rules', type: [AclRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AclRuleDto)
  esl_access: AclRuleDto[];

  @ApiProperty({ description: 'SIP profiles access rules', type: [AclRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AclRuleDto)
  sip_profiles: AclRuleDto[];
}

export class SipProfileConfigDto {
  @ApiProperty({ description: 'Profile name' })
  name: string;

  @ApiProperty({ description: 'Profile enabled status' })
  enabled: boolean;

  @ApiProperty({ description: 'Profile description' })
  description: string;

  @ApiProperty({ description: 'SIP IP address' })
  sip_ip: string;

  @ApiProperty({ description: 'SIP port' })
  sip_port: number;

  @ApiProperty({ description: 'SIP TLS port' })
  sip_port_tls: number;

  @ApiProperty({ description: 'RTP IP address' })
  rtp_ip: string;

  @ApiProperty({ description: 'External RTP IP' })
  ext_rtp_ip: string;

  @ApiProperty({ description: 'External SIP IP' })
  ext_sip_ip: string;

  @ApiProperty({ description: 'RTP start port' })
  rtp_start_port: number;

  @ApiProperty({ description: 'RTP end port' })
  rtp_end_port: number;

  @ApiProperty({ description: 'RTP timer name' })
  rtp_timer_name: string;

  @ApiProperty({ description: 'RTP timeout in seconds' })
  rtp_timeout_sec: number;

  @ApiProperty({ description: 'RTP hold timeout in seconds' })
  rtp_hold_timeout_sec: number;

  @ApiProperty({ description: 'Authenticate calls' })
  auth_calls: boolean;

  @ApiProperty({ description: 'Accept blind registration' })
  accept_blind_reg: boolean;

  @ApiProperty({ description: 'Accept blind authentication' })
  accept_blind_auth: boolean;

  @ApiProperty({ description: 'Apply inbound ACL' })
  apply_inbound_acl: string;

  @ApiProperty({ description: 'Apply register ACL' })
  apply_register_acl: string;

  @ApiProperty({ description: 'Dialplan context' })
  context: string;

  @ApiProperty({ description: 'Dialplan type' })
  dialplan: string;

  @ApiProperty({ description: 'DTMF duration' })
  dtmf_duration: number;

  @ApiProperty({ description: 'Codec preferences' })
  codec_prefs: string;

  @ApiProperty({ description: 'Inbound codec preferences' })
  inbound_codec_prefs: string;

  @ApiProperty({ description: 'Outbound codec preferences' })
  outbound_codec_prefs: string;

  @ApiProperty({ description: 'NAT options ping' })
  nat_options_ping: boolean;

  @ApiProperty({ description: 'Aggressive NAT detection' })
  aggressive_nat_detection: boolean;

  @ApiProperty({ description: 'STUN enabled' })
  stun_enabled: boolean;

  @ApiProperty({ description: 'STUN auto disable' })
  stun_auto_disable: boolean;
}

export class SipProfilesConfigDto {
  @ApiProperty({ description: 'Internal SIP profile configuration', type: SipProfileConfigDto })
  internal: SipProfileConfigDto;

  @ApiProperty({ description: 'External SIP profile configuration', type: SipProfileConfigDto })
  external: SipProfileConfigDto;
}

export class EventMulticastConfigDto {
  @ApiProperty({ description: 'Multicast address', default: '225.1.1.1' })
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}$/, { message: 'Invalid IP address format' })
  address: string;

  @ApiProperty({ description: 'Multicast port', default: 4242 })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port: number;

  @ApiProperty({ description: 'Event bindings', default: 'all' })
  @IsString()
  bindings: string;

  @ApiProperty({ description: 'TTL (Time To Live)', default: 1 })
  @IsNumber()
  @Min(1)
  @Max(255)
  ttl: number;

  @ApiProperty({ description: 'Enable loopback', default: false, required: false })
  @IsOptional()
  loopback?: boolean;

  @ApiProperty({ description: 'Pre-shared key for encryption', required: false })
  @IsOptional()
  @IsString()
  psk?: string;
}

export class VertoConfigDto {
  @ApiProperty({ description: 'Enable Verto WebRTC', default: false })
  enabled: boolean;

  @ApiProperty({ description: 'Verto port', default: 8081 })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port: number;

  @ApiProperty({ description: 'Verto secure port (WSS)', default: 8082 })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  securePort: number;

  @ApiProperty({ description: 'Multicast IP for Verto', default: '224.1.1.1' })
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}$/, { message: 'Invalid IP address format' })
  mcastIp: string;

  @ApiProperty({ description: 'Multicast port for Verto', default: 1337 })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  mcastPort: number;

  @ApiProperty({ description: 'Enable user authentication', default: true })
  userAuth: boolean;

  @ApiProperty({ description: 'Dialplan context', default: 'default' })
  @IsString()
  context: string;

  @ApiProperty({ description: 'Outbound codec string', default: 'opus,vp8' })
  @IsString()
  outboundCodecs: string;

  @ApiProperty({ description: 'Inbound codec string', default: 'opus,vp8' })
  @IsString()
  inboundCodecs: string;

  @ApiProperty({ description: 'RTP timeout in seconds', default: 300 })
  @IsNumber()
  @Min(30)
  @Max(3600)
  rtpTimeout: number;

  @ApiProperty({ description: 'RTP hold timeout in seconds', default: 1800 })
  @IsNumber()
  @Min(60)
  @Max(7200)
  rtpHoldTimeout: number;

  @ApiProperty({ description: 'Enable 3PCC (Third Party Call Control)', default: true })
  enable3pcc: boolean;
}

export class NetworkConfigDto {
  @ApiProperty({ enum: ['auto', 'stun', 'manual'], description: 'External IP detection mode' })
  @IsEnum(['auto', 'stun', 'manual'])
  external_ip_mode: ExternalIpMode;

  @ApiProperty({ required: false, description: 'Manual external IP address' })
  @IsOptional()
  @IsString()
  @Matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^stun:[a-zA-Z0-9.-]+$|^host:[a-zA-Z0-9.-]+$/, {
    message: 'External IP must be a valid IP address, STUN server (stun:server.com), or host (host:domain.com)'
  })
  external_ip?: string;

  @ApiProperty({ required: false, description: 'Server bind IP address' })
  @IsOptional()
  @IsString()
  bind_server_ip?: string;

  @ApiProperty({ description: 'RTP port range start' })
  @IsNumber()
  @Min(1024, { message: 'RTP start port must be at least 1024' })
  @Max(65535, { message: 'RTP start port must be at most 65535' })
  rtp_start_port: number;

  @ApiProperty({ description: 'RTP port range end' })
  @IsNumber()
  @Min(1024, { message: 'RTP end port must be at least 1024' })
  @Max(65535, { message: 'RTP end port must be at most 65535' })
  rtp_end_port: number;
}

@ApiTags('FreeSWITCH Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('freeswitch-config')
export class FreeSwitchConfigController {
  constructor(
    private readonly configService: FreeSwitchConfigService,
    private readonly directoryService: FreeSwitchDirectoryService,
    private readonly importService: FreeSwitchImportService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all FreeSWITCH configurations' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getAllConfigs(@Query('category') category?: string): Promise<FreeSwitchConfig[]> {
    if (category) {
      return this.configService.getConfigsByCategory(category);
    }
    return this.configService.getAllConfigs();
  }

  @Get('structured')
  @ApiOperation({ summary: 'Get structured FreeSWITCH configuration' })
  @ApiResponse({ status: 200, description: 'Structured configuration retrieved successfully' })
  async getStructuredConfig() {
    return this.configService.getFreeSwitchConfiguration();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available configuration categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<string[]> {
    const configs = await this.configService.getAllConfigs();
    const categories = [...new Set(configs.map(config => config.category))];
    return categories.sort();
  }

  @Get('network')
  @ApiOperation({ summary: 'Get network configuration' })
  @ApiResponse({ status: 200, description: 'Network configuration retrieved successfully' })
  async getNetworkConfig() {
    const configs = await this.configService.getConfigsByCategory('network');
    const networkConfig: any = {};
    
    configs.forEach(config => {
      let value: any = config.value;
      if (config.type === 'number') {
        value = parseInt(config.value, 10);
      } else if (config.type === 'boolean') {
        value = config.value.toLowerCase() === 'true';
      }
      networkConfig[config.name] = value;
    });

    return networkConfig;
  }

  @Put('network')
  @ApiOperation({ summary: 'Update network configuration' })
  @ApiResponse({ status: 200, description: 'Network configuration updated successfully' })
  async updateNetworkConfig(
    @Body() networkConfig: NetworkConfigDto,
    @Request() req: any,
  ) {
    const username = req.user?.username || 'system';

    try {
      // Validate port range
      if (networkConfig.rtp_start_port >= networkConfig.rtp_end_port) {
        throw new HttpException(
          'RTP start port must be less than end port',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate port range size (minimum 100 ports recommended)
      const portRange = networkConfig.rtp_end_port - networkConfig.rtp_start_port;
      if (portRange < 100) {
        throw new HttpException(
          'RTP port range should be at least 100 ports for proper operation',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate external IP based on mode
      if (networkConfig.external_ip_mode === 'manual' && !networkConfig.external_ip) {
        throw new HttpException(
          'External IP address is required when using manual mode',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update each network configuration
      await this.configService.setConfigValue('network', 'external_ip_mode', networkConfig.external_ip_mode, username);

      if (networkConfig.external_ip) {
        await this.configService.setConfigValue('network', 'external_ip', networkConfig.external_ip, username);
      }

      if (networkConfig.bind_server_ip) {
        await this.configService.setConfigValue('network', 'bind_server_ip', networkConfig.bind_server_ip, username);
      }

      await this.configService.setConfigValue('network', 'rtp_start_port', networkConfig.rtp_start_port.toString(), username);
      await this.configService.setConfigValue('network', 'rtp_end_port', networkConfig.rtp_end_port.toString(), username);

      // Apply configuration changes
      await this.configService.applyConfiguration();

      return {
        success: true,
        message: 'Network configuration updated successfully',
        requiresRestart: true,
        config: {
          external_ip_mode: networkConfig.external_ip_mode,
          external_ip: networkConfig.external_ip,
          rtp_start_port: networkConfig.rtp_start_port,
          rtp_end_port: networkConfig.rtp_end_port,
          port_range_size: portRange,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update network configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Specific routes MUST come before generic :category/:name routes
  @Get('vars-xml/preview')
  @ApiOperation({ summary: 'Preview generated vars.xml content' })
  @ApiResponse({ status: 200, description: 'vars.xml content generated successfully' })
  async previewVarsXml(): Promise<{ content: string }> {
    try {
      const content = await this.configService.generateVarsXml();
      return { content };
    } catch (error) {
      throw new HttpException(
        `Failed to generate vars.xml: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('switch-conf/preview')
  @ApiOperation({ summary: 'Preview generated switch.conf.xml content' })
  @ApiResponse({ status: 200, description: 'switch.conf.xml content generated successfully' })
  async previewSwitchConfXml(): Promise<{ content: string }> {
    try {
      const content = await this.configService.generateSwitchConfXml();
      return { content };
    } catch (error) {
      throw new HttpException(
        `Failed to generate switch.conf.xml: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('network/validate')
  @ApiOperation({ summary: 'Validate network configuration without applying' })
  @ApiResponse({ status: 200, description: 'Network configuration validation result' })
  async validateNetworkConfig(
    @Body() networkConfig: NetworkConfigDto,
  ) {
    try {
      const validationResult = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
        recommendations: [] as string[],
      };

      // Validate port range
      if (networkConfig.rtp_start_port >= networkConfig.rtp_end_port) {
        validationResult.valid = false;
        validationResult.errors.push('RTP start port must be less than end port');
      }

      // Check port range size
      const portRange = networkConfig.rtp_end_port - networkConfig.rtp_start_port;
      if (portRange < 100) {
        validationResult.warnings.push('RTP port range is less than 100 ports, which may limit concurrent calls');
      }

      if (portRange > 16384) {
        validationResult.warnings.push('Large RTP port range may impact firewall configuration');
      }

      // Validate external IP based on mode
      if (networkConfig.external_ip_mode === 'manual' && !networkConfig.external_ip) {
        validationResult.valid = false;
        validationResult.errors.push('External IP address is required when using manual mode');
      }

      // Recommendations
      if (networkConfig.external_ip_mode === 'stun') {
        validationResult.recommendations.push('STUN mode requires reliable internet connection to STUN server');
      }

      if (portRange >= 100 && portRange <= 1000) {
        validationResult.recommendations.push('Port range is suitable for small to medium deployments');
      }

      return {
        ...validationResult,
        config: {
          external_ip_mode: networkConfig.external_ip_mode,
          external_ip: networkConfig.external_ip,
          rtp_start_port: networkConfig.rtp_start_port,
          rtp_end_port: networkConfig.rtp_end_port,
          port_range_size: portRange,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to validate network configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':category/:name')
  @ApiOperation({ summary: 'Update specific configuration value' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfigValue(
    @Param('category') category: string,
    @Param('name') name: string,
    @Body() updateDto: UpdateConfigDto,
    @Request() req: any,
  ): Promise<FreeSwitchConfig> {
    const username = req.user?.username || 'system';
    return this.configService.setConfigValue(category, name, updateDto.value, username);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple configurations' })
  @ApiResponse({ status: 200, description: 'Configurations updated successfully' })
  async bulkUpdateConfigs(
    @Body() bulkUpdateDto: BulkUpdateConfigDto,
    @Request() req: any,
  ) {
    const username = req.user?.username || 'system';
    const results = [];

    try {
      for (const configUpdate of bulkUpdateDto.configs) {
        const result = await this.configService.setConfigValue(
          configUpdate.category,
          configUpdate.name,
          configUpdate.value,
          username,
        );
        results.push(result);
      }

      // Apply configuration changes
      await this.configService.applyConfiguration();

      return {
        success: true,
        message: 'Configurations updated successfully',
        updated: results.length,
        requiresRestart: true,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update configurations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('detect-external-ip')
  @ApiOperation({ summary: 'Auto-detect external IP address' })
  @ApiResponse({ status: 200, description: 'External IP detected successfully' })
  async detectExternalIp(): Promise<{ ip: string }> {
    try {
      const ip = await this.configService.detectExternalIp();
      return { ip };
    } catch (error) {
      throw new HttpException(
        `Failed to detect external IP: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sip-profiles')
  @ApiOperation({ summary: 'Get SIP profiles configuration' })
  @ApiResponse({ status: 200, description: 'SIP profiles configuration retrieved successfully' })
  async getSipProfiles(): Promise<SipProfilesConfigDto> {
    try {
      // Get internal profile configuration
      const internalConfigs = await this.configService.getConfigsByCategory('sip_profile_internal');
      const externalConfigs = await this.configService.getConfigsByCategory('sip_profile_external');

      const internal: SipProfileConfigDto = {
        name: 'internal',
        enabled: this.getConfigValueFromArray(internalConfigs, 'enabled', 'true') === 'true',
        description: this.getConfigValueFromArray(internalConfigs, 'description', 'Internal SIP profile for local extensions'),
        sip_ip: this.getConfigValueFromArray(internalConfigs, 'sip_ip', '0.0.0.0'),
        sip_port: parseInt(this.getConfigValueFromArray(internalConfigs, 'sip_port', '5060')),
        sip_port_tls: parseInt(this.getConfigValueFromArray(internalConfigs, 'sip_port_tls', '5061')),
        rtp_ip: this.getConfigValueFromArray(internalConfigs, 'rtp_ip', '0.0.0.0'),
        ext_rtp_ip: this.getConfigValueFromArray(internalConfigs, 'ext_rtp_ip', 'auto-nat'),
        ext_sip_ip: this.getConfigValueFromArray(internalConfigs, 'ext_sip_ip', 'auto-nat'),
        rtp_start_port: parseInt(this.getConfigValueFromArray(internalConfigs, 'rtp_start_port', '16384')),
        rtp_end_port: parseInt(this.getConfigValueFromArray(internalConfigs, 'rtp_end_port', '16484')),
        rtp_timer_name: this.getConfigValueFromArray(internalConfigs, 'rtp_timer_name', 'soft'),
        rtp_timeout_sec: parseInt(this.getConfigValueFromArray(internalConfigs, 'rtp_timeout_sec', '300')),
        rtp_hold_timeout_sec: parseInt(this.getConfigValueFromArray(internalConfigs, 'rtp_hold_timeout_sec', '1800')),
        auth_calls: this.getConfigValueFromArray(internalConfigs, 'auth_calls', 'true') === 'true',
        accept_blind_reg: this.getConfigValueFromArray(internalConfigs, 'accept_blind_reg', 'false') === 'true',
        accept_blind_auth: this.getConfigValueFromArray(internalConfigs, 'accept_blind_auth', 'false') === 'true',
        apply_inbound_acl: this.getConfigValueFromArray(internalConfigs, 'apply_inbound_acl', 'domains'),
        apply_register_acl: this.getConfigValueFromArray(internalConfigs, 'apply_register_acl', 'domains'),
        context: this.getConfigValueFromArray(internalConfigs, 'context', 'default'),
        dialplan: this.getConfigValueFromArray(internalConfigs, 'dialplan', 'XML'),
        dtmf_duration: parseInt(this.getConfigValueFromArray(internalConfigs, 'dtmf_duration', '2000')),
        codec_prefs: this.getConfigValueFromArray(internalConfigs, 'codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        inbound_codec_prefs: this.getConfigValueFromArray(internalConfigs, 'inbound_codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        outbound_codec_prefs: this.getConfigValueFromArray(internalConfigs, 'outbound_codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        nat_options_ping: this.getConfigValueFromArray(internalConfigs, 'nat_options_ping', 'true') === 'true',
        aggressive_nat_detection: this.getConfigValueFromArray(internalConfigs, 'aggressive_nat_detection', 'true') === 'true',
        stun_enabled: this.getConfigValueFromArray(internalConfigs, 'stun_enabled', 'true') === 'true',
        stun_auto_disable: this.getConfigValueFromArray(internalConfigs, 'stun_auto_disable', 'false') === 'true',
      };

      const external: SipProfileConfigDto = {
        name: 'external',
        enabled: this.getConfigValueFromArray(externalConfigs, 'enabled', 'true') === 'true',
        description: this.getConfigValueFromArray(externalConfigs, 'description', 'External SIP profile for outbound calls and providers'),
        sip_ip: this.getConfigValueFromArray(externalConfigs, 'sip_ip', '0.0.0.0'),
        sip_port: parseInt(this.getConfigValueFromArray(externalConfigs, 'sip_port', '5080')),
        sip_port_tls: parseInt(this.getConfigValueFromArray(externalConfigs, 'sip_port_tls', '5081')),
        rtp_ip: this.getConfigValueFromArray(externalConfigs, 'rtp_ip', '0.0.0.0'),
        ext_rtp_ip: this.getConfigValueFromArray(externalConfigs, 'ext_rtp_ip', 'auto-nat'),
        ext_sip_ip: this.getConfigValueFromArray(externalConfigs, 'ext_sip_ip', 'auto-nat'),
        rtp_start_port: parseInt(this.getConfigValueFromArray(externalConfigs, 'rtp_start_port', '16384')),
        rtp_end_port: parseInt(this.getConfigValueFromArray(externalConfigs, 'rtp_end_port', '16484')),
        rtp_timer_name: this.getConfigValueFromArray(externalConfigs, 'rtp_timer_name', 'soft'),
        rtp_timeout_sec: parseInt(this.getConfigValueFromArray(externalConfigs, 'rtp_timeout_sec', '300')),
        rtp_hold_timeout_sec: parseInt(this.getConfigValueFromArray(externalConfigs, 'rtp_hold_timeout_sec', '1800')),
        auth_calls: this.getConfigValueFromArray(externalConfigs, 'auth_calls', 'false') === 'true',
        accept_blind_reg: this.getConfigValueFromArray(externalConfigs, 'accept_blind_reg', 'false') === 'true',
        accept_blind_auth: this.getConfigValueFromArray(externalConfigs, 'accept_blind_auth', 'false') === 'true',
        apply_inbound_acl: this.getConfigValueFromArray(externalConfigs, 'apply_inbound_acl', 'providers'),
        apply_register_acl: this.getConfigValueFromArray(externalConfigs, 'apply_register_acl', 'providers'),
        context: this.getConfigValueFromArray(externalConfigs, 'context', 'public'),
        dialplan: this.getConfigValueFromArray(externalConfigs, 'dialplan', 'XML'),
        dtmf_duration: parseInt(this.getConfigValueFromArray(externalConfigs, 'dtmf_duration', '2000')),
        codec_prefs: this.getConfigValueFromArray(externalConfigs, 'codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        inbound_codec_prefs: this.getConfigValueFromArray(externalConfigs, 'inbound_codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        outbound_codec_prefs: this.getConfigValueFromArray(externalConfigs, 'outbound_codec_prefs', 'OPUS,G722,PCMU,PCMA'),
        nat_options_ping: this.getConfigValueFromArray(externalConfigs, 'nat_options_ping', 'true') === 'true',
        aggressive_nat_detection: this.getConfigValueFromArray(externalConfigs, 'aggressive_nat_detection', 'true') === 'true',
        stun_enabled: this.getConfigValueFromArray(externalConfigs, 'stun_enabled', 'true') === 'true',
        stun_auto_disable: this.getConfigValueFromArray(externalConfigs, 'stun_auto_disable', 'false') === 'true',
      };

      return { internal, external };
    } catch (error) {
      throw new HttpException(
        `Failed to get SIP profiles configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('sip-profiles')
  @ApiOperation({ summary: 'Update SIP profiles configuration' })
  @ApiResponse({ status: 200, description: 'SIP profiles configuration updated successfully' })
  async updateSipProfiles(@Body() sipProfilesConfig: SipProfilesConfigDto): Promise<{ success: boolean; message: string }> {
    try {
      // Update internal profile
      const internalProfile = sipProfilesConfig.internal;
      await this.updateProfileConfig('sip_profile_internal', internalProfile);

      // Update external profile
      const externalProfile = sipProfilesConfig.external;
      await this.updateProfileConfig('sip_profile_external', externalProfile);

      return {
        success: true,
        message: 'SIP profiles configuration updated successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update SIP profiles configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply configuration changes to FreeSWITCH' })
  @ApiResponse({ status: 200, description: 'Configuration applied successfully' })
  async applyConfiguration() {
    try {
      await this.configService.applyConfiguration();
      return {
        success: true,
        message: 'FreeSWITCH configuration applied successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to apply configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize default configuration values' })
  @ApiResponse({ status: 200, description: 'Default configuration initialized successfully' })
  async initializeDefaultConfig() {
    try {
      await this.configService.initializeDefaultConfig();
      return {
        success: true,
        message: 'Default configuration initialized successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to initialize default configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('acl/detect')
  @ApiOperation({ summary: 'Detect current network ranges for ACL configuration' })
  @ApiResponse({ status: 200, description: 'Network ranges detected successfully' })
  async detectNetworkRanges() {
    try {
      const networkInfo = await this.configService.detectNetworkRanges();
      return {
        success: true,
        data: networkInfo,
        message: 'Network ranges detected successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to detect network ranges: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('acl')
  @ApiOperation({ summary: 'Get current ACL configuration' })
  @ApiResponse({ status: 200, description: 'ACL configuration retrieved successfully' })
  async getAclConfig() {
    try {
      const config = await this.configService.getFreeSwitchConfiguration();
      const aclConfig = config.acl || await this.configService.getDefaultAclRules();

      return {
        success: true,
        data: aclConfig,
        message: 'ACL configuration retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get ACL configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('acl')
  @ApiOperation({ summary: 'Update ACL configuration' })
  @ApiResponse({ status: 200, description: 'ACL configuration updated successfully' })
  async updateAclConfig(@Body() aclConfig: AclConfigDto) {
    try {
      // Validate ACL rules
      this.validateAclConfig(aclConfig);

      // Save ACL configuration to database
      await this.configService.setConfigValue('security', 'acl_rules', JSON.stringify(aclConfig));

      // Apply configuration to FreeSWITCH
      await this.configService.applyConfiguration();

      return {
        success: true,
        message: 'ACL configuration updated and applied successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update ACL configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('acl/apply-detected')
  @ApiOperation({ summary: 'Apply detected network ranges to ACL configuration' })
  @ApiResponse({ status: 200, description: 'Detected ACL rules applied successfully' })
  async applyDetectedAcl() {
    try {
      const networkInfo = await this.configService.detectNetworkRanges();
      const detectedRanges = networkInfo.detectedRanges || [];

      // Create ACL configuration from detected ranges
      const aclConfig = {
        domains: detectedRanges,
        esl_access: [
          { type: 'allow', cidr: '127.0.0.1/32', description: 'Localhost' },
          { type: 'allow', cidr: '172.16.0.0/12', description: 'Docker networks' }
        ],
        sip_profiles: detectedRanges
      };

      // Save and apply
      await this.configService.setConfigValue('security', 'acl_rules', JSON.stringify(aclConfig));
      await this.configService.applyConfiguration();

      return {
        success: true,
        data: aclConfig,
        message: 'Detected ACL rules applied successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to apply detected ACL rules: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Get('multicast')
  @ApiOperation({ summary: 'Get event multicast configuration' })
  @ApiResponse({ status: 200, description: 'Event multicast configuration retrieved successfully' })
  async getMulticastConfig() {
    try {
      const configStr = await this.configService.getConfigValue('multicast', 'config');
      let config;

      if (configStr) {
        try {
          config = JSON.parse(configStr);
        } catch (error) {
          config = this.getDefaultMulticastConfig();
        }
      } else {
        config = this.getDefaultMulticastConfig();
      }

      return {
        success: true,
        data: config,
        message: 'Event multicast configuration retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get multicast configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('multicast')
  @ApiOperation({ summary: 'Update event multicast configuration' })
  @ApiResponse({ status: 200, description: 'Event multicast configuration updated successfully' })
  async updateMulticastConfig(@Body() config: EventMulticastConfigDto) {
    try {
      // Validate multicast configuration
      this.validateMulticastConfig(config);

      // Save configuration to database
      await this.configService.setConfigValue('multicast', 'config', JSON.stringify(config));

      // Apply configuration to FreeSWITCH
      await this.configService.applyConfiguration();

      return {
        success: true,
        message: 'Event multicast configuration updated and applied successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update multicast configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verto')
  @ApiOperation({ summary: 'Get Verto WebRTC configuration' })
  @ApiResponse({ status: 200, description: 'Verto configuration retrieved successfully' })
  async getVertoConfig() {
    try {
      const configStr = await this.configService.getConfigValue('webrtc', 'verto_config');
      let config;

      if (configStr) {
        try {
          config = JSON.parse(configStr);
        } catch (error) {
          config = this.getDefaultVertoConfig();
        }
      } else {
        config = this.getDefaultVertoConfig();
      }

      return {
        success: true,
        data: config,
        message: 'Verto configuration retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get Verto configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('verto')
  @ApiOperation({ summary: 'Update Verto WebRTC configuration' })
  @ApiResponse({ status: 200, description: 'Verto configuration updated successfully' })
  async updateVertoConfig(@Body() config: VertoConfigDto) {
    try {
      // Validate Verto configuration
      this.validateVertoConfig(config);

      // Save configuration to database
      await this.configService.setConfigValue('webrtc', 'verto_config', JSON.stringify(config));

      // Apply configuration to FreeSWITCH
      await this.configService.applyConfiguration();

      return {
        success: true,
        message: 'Verto configuration updated and applied successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update Verto configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get default multicast configuration
   */
  private getDefaultMulticastConfig(): EventMulticastConfigDto {
    return {
      address: '225.1.1.1',
      port: 4242,
      bindings: 'all',
      ttl: 1,
      loopback: false
    };
  }

  /**
   * Get default Verto configuration
   */
  private getDefaultVertoConfig(): VertoConfigDto {
    return {
      enabled: false,
      port: 8081,
      securePort: 8082,
      mcastIp: '224.1.1.1',
      mcastPort: 1337,
      userAuth: true,
      context: 'default',
      outboundCodecs: 'opus,vp8',
      inboundCodecs: 'opus,vp8',
      rtpTimeout: 300,
      rtpHoldTimeout: 1800,
      enable3pcc: true
    };
  }

  /**
   * Validate multicast configuration
   */
  private validateMulticastConfig(config: EventMulticastConfigDto): void {
    // Validate multicast IP range (224.0.0.0 to 239.255.255.255)
    const ipParts = config.address.split('.').map(Number);
    if (ipParts[0] < 224 || ipParts[0] > 239) {
      throw new Error('Multicast address must be in range 224.0.0.0 to 239.255.255.255');
    }

    if (config.port < 1024 || config.port > 65535) {
      throw new Error('Port must be between 1024 and 65535');
    }

    if (config.ttl < 1 || config.ttl > 255) {
      throw new Error('TTL must be between 1 and 255');
    }
  }

  /**
   * Validate Verto configuration
   */
  private validateVertoConfig(config: VertoConfigDto): void {
    if (config.port < 1024 || config.port > 65535) {
      throw new Error('Port must be between 1024 and 65535');
    }

    if (config.securePort < 1024 || config.securePort > 65535) {
      throw new Error('Secure port must be between 1024 and 65535');
    }

    if (config.port === config.securePort) {
      throw new Error('Port and secure port must be different');
    }

    if (config.mcastPort < 1024 || config.mcastPort > 65535) {
      throw new Error('Multicast port must be between 1024 and 65535');
    }

    // Validate multicast IP range
    const ipParts = config.mcastIp.split('.').map(Number);
    if (ipParts[0] < 224 || ipParts[0] > 239) {
      throw new Error('Multicast IP must be in range 224.0.0.0 to 239.255.255.255');
    }

    if (config.rtpTimeout < 30 || config.rtpTimeout > 3600) {
      throw new Error('RTP timeout must be between 30 and 3600 seconds');
    }

    if (config.rtpHoldTimeout < 60 || config.rtpHoldTimeout > 7200) {
      throw new Error('RTP hold timeout must be between 60 and 7200 seconds');
    }
  }

  /**
   * Validate ACL configuration
   */
  private validateAclConfig(aclConfig: AclConfigDto): void {
    const validateRules = (rules: AclRuleDto[], listName: string) => {
      if (!Array.isArray(rules)) {
        throw new Error(`${listName} must be an array`);
      }

      for (const rule of rules) {
        if (!['allow', 'deny'].includes(rule.type)) {
          throw new Error(`Invalid rule type: ${rule.type}`);
        }

        // Validate CIDR format
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        if (!cidrRegex.test(rule.cidr)) {
          throw new Error(`Invalid CIDR format: ${rule.cidr}`);
        }

        // Validate IP parts
        const [ip, prefix] = rule.cidr.split('/');
        const ipParts = ip.split('.').map(Number);

        if (ipParts.some(part => part < 0 || part > 255)) {
          throw new Error(`Invalid IP address: ${ip}`);
        }

        const prefixNum = parseInt(prefix);
        if (prefixNum < 0 || prefixNum > 32) {
          throw new Error(`Invalid prefix: ${prefix}`);
        }
      }
    };

    validateRules(aclConfig.domains, 'domains');
    validateRules(aclConfig.esl_access, 'esl_access');
    validateRules(aclConfig.sip_profiles, 'sip_profiles');
  }

  // Helper methods
  private getConfigValueFromArray(configs: any[], name: string, defaultValue: string): string {
    const config = configs.find(c => c.name === name);
    return config?.value || defaultValue;
  }

  private async updateProfileConfig(category: string, profile: SipProfileConfigDto): Promise<void> {
    const configUpdates = [
      { name: 'enabled', value: profile.enabled.toString() },
      { name: 'description', value: profile.description },
      { name: 'sip_ip', value: profile.sip_ip },
      { name: 'sip_port', value: profile.sip_port.toString() },
      { name: 'sip_port_tls', value: profile.sip_port_tls.toString() },
      { name: 'rtp_ip', value: profile.rtp_ip },
      { name: 'ext_rtp_ip', value: profile.ext_rtp_ip },
      { name: 'ext_sip_ip', value: profile.ext_sip_ip },
      { name: 'rtp_start_port', value: profile.rtp_start_port.toString() },
      { name: 'rtp_end_port', value: profile.rtp_end_port.toString() },
      { name: 'rtp_timer_name', value: profile.rtp_timer_name },
      { name: 'rtp_timeout_sec', value: profile.rtp_timeout_sec.toString() },
      { name: 'rtp_hold_timeout_sec', value: profile.rtp_hold_timeout_sec.toString() },
      { name: 'auth_calls', value: profile.auth_calls.toString() },
      { name: 'accept_blind_reg', value: profile.accept_blind_reg.toString() },
      { name: 'accept_blind_auth', value: profile.accept_blind_auth.toString() },
      { name: 'apply_inbound_acl', value: profile.apply_inbound_acl },
      { name: 'apply_register_acl', value: profile.apply_register_acl },
      { name: 'context', value: profile.context },
      { name: 'dialplan', value: profile.dialplan },
      { name: 'dtmf_duration', value: profile.dtmf_duration.toString() },
      { name: 'codec_prefs', value: profile.codec_prefs },
      { name: 'inbound_codec_prefs', value: profile.inbound_codec_prefs },
      { name: 'outbound_codec_prefs', value: profile.outbound_codec_prefs },
      { name: 'nat_options_ping', value: profile.nat_options_ping.toString() },
      { name: 'aggressive_nat_detection', value: profile.aggressive_nat_detection.toString() },
      { name: 'stun_enabled', value: profile.stun_enabled.toString() },
      { name: 'stun_auto_disable', value: profile.stun_auto_disable.toString() },
    ];

    for (const update of configUpdates) {
      await this.configService.setConfigValue(category, update.name, update.value);
    }
  }

  @Post('directory/sync')
  @ApiOperation({ summary: 'Sync FreeSWITCH directory from database' })
  @ApiResponse({ status: 200, description: 'Directory synchronized successfully' })
  async syncDirectory(): Promise<{ message: string }> {
    try {
      await this.directoryService.generateDirectoryStructure();
      return { message: 'FreeSWITCH directory synchronized successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to sync directory: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('directory/regenerate')
  @ApiOperation({ summary: 'Force regenerate entire FreeSWITCH directory structure' })
  @ApiResponse({ status: 200, description: 'Directory regenerated successfully' })
  async regenerateDirectory(): Promise<{ message: string }> {
    try {
      // Emit event to trigger full regeneration
      this.eventEmitter.emit('freeswitch.directory.regenerate');
      return { message: 'FreeSWITCH directory regeneration initiated' };
    } catch (error) {
      throw new HttpException(
        `Failed to regenerate directory: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('extensions/import')
  @ApiOperation({ summary: 'Import extensions from FreeSWITCH to database' })
  @ApiResponse({ status: 200, description: 'Extensions imported successfully' })
  async importExtensions(): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const result = await this.importService.importExtensionsFromFreeSWITCH();
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to import extensions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('extensions/import-range')
  @ApiOperation({ summary: 'Import extension range to database' })
  @ApiResponse({ status: 200, description: 'Extension range imported successfully' })
  async importExtensionRange(
    @Body() body: { startExt: number; endExt: number; domain?: string }
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const { startExt, endExt, domain = 'localhost' } = body;
      const result = await this.importService.importExtensionRange(startExt, endExt, domain);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to import extension range: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Generic routes MUST come LAST to avoid conflicts with specific routes
  @Get(':category/:name')
  @ApiOperation({ summary: 'Get specific configuration value' })
  @ApiResponse({ status: 200, description: 'Configuration value retrieved successfully' })
  async getConfigValue(
    @Param('category') category: string,
    @Param('name') name: string,
  ): Promise<{ value: string | null }> {
    const value = await this.configService.getConfigValue(category, name);
    return { value };
  }

}
