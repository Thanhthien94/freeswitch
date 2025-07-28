import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProfessionalAuthGuard } from '../../auth/guards/professional-auth.guard';
import { RequireRoles, AdminOnly, SuperAdminOnly } from '../../auth/decorators/auth.decorators';
import { GlobalNetworkConfigService } from '../services/global-network-config.service';
import { GlobalNetworkConfig } from '../entities/global-network-config.entity';
import {
  CreateGlobalNetworkConfigDto,
  UpdateGlobalNetworkConfigDto,
  NetworkConfigValidationResult,
  ApplyConfigResult,
  ExternalIpDetectionResult,
  NetworkConfigResponseDto,
  ValidationResponseDto,
  ApplyConfigResponseDto,
  IpDetectionResponseDto,
  NetworkConfigStatusDto,
} from '../dto/global-network-config.dto';



@ApiTags('Global Network Configuration')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
@Controller('freeswitch/network-config')
export class GlobalNetworkConfigController {
  private readonly logger = new Logger(GlobalNetworkConfigController.name);

  constructor(
    private readonly globalNetworkConfigService: GlobalNetworkConfigService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get current global network configuration',
    description: 'Retrieve the current active global network configuration for FreeSWITCH'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Network configuration retrieved successfully',
    type: NetworkConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Network configuration not found' })
  @AdminOnly()
  async getConfig(): Promise<NetworkConfigResponseDto> {
    try {
      this.logger.log('Getting global network configuration');
      
      const config = await this.globalNetworkConfigService.findConfig();
      
      return {
        success: true,
        data: config,
        message: 'Network configuration retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get network configuration: ${error.message}`);
      throw error;
    }
  }

  @Put()
  @ApiOperation({ 
    summary: 'Update global network configuration',
    description: 'Update the global network configuration settings'
  })
  @ApiBody({ type: UpdateGlobalNetworkConfigDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Network configuration updated successfully',
    type: NetworkConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  @AdminOnly()
  async updateConfig(
    @Body() updateDto: UpdateGlobalNetworkConfigDto,
    @Request() req: any,
  ): Promise<NetworkConfigResponseDto> {
    try {
      this.logger.log('Updating global network configuration');
      
      const updatedBy = req.user?.username || req.user?.email;
      const config = await this.globalNetworkConfigService.updateConfig(updateDto, updatedBy);
      
      return {
        success: true,
        data: config,
        message: 'Network configuration updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update network configuration: ${error.message}`);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update network configuration');
    }
  }

  @Post('validate')
  @ApiOperation({ 
    summary: 'Validate network configuration',
    description: 'Validate network configuration settings without applying them'
  })
  @ApiBody({ type: UpdateGlobalNetworkConfigDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration validation completed',
    type: ValidationResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  async validateConfig(
    @Body() configDto: UpdateGlobalNetworkConfigDto,
  ): Promise<ValidationResponseDto> {
    try {
      this.logger.log('Validating network configuration');
      
      // Get current config and apply updates for validation
      const currentConfig = await this.globalNetworkConfigService.findConfig();
      Object.assign(currentConfig, configDto);
      
      const validationResult = await this.globalNetworkConfigService.validateConfig(currentConfig);
      
      return {
        success: true,
        data: validationResult,
        message: validationResult.isValid 
          ? 'Configuration is valid' 
          : 'Configuration validation failed',
      };
    } catch (error) {
      this.logger.error(`Failed to validate network configuration: ${error.message}`);
      throw new BadRequestException('Failed to validate network configuration');
    }
  }

  @Post('apply')
  @ApiOperation({ 
    summary: 'Apply network configuration',
    description: 'Apply the current network configuration to FreeSWITCH'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration applied successfully',
    type: ApplyConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to apply configuration' })
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  async applyConfig(@Request() req: any): Promise<ApplyConfigResponseDto> {
    try {
      this.logger.log('Applying network configuration');
      
      const config = await this.globalNetworkConfigService.findConfig();
      const appliedBy = req.user?.username || req.user?.email;
      
      const result = await this.globalNetworkConfigService.applyConfig(config.id, appliedBy);
      
      return {
        success: result.success,
        data: result,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Failed to apply network configuration: ${error.message}`);
      throw new BadRequestException('Failed to apply network configuration');
    }
  }

  @Post('detect-ip')
  @ApiOperation({ 
    summary: 'Detect external IP address',
    description: 'Automatically detect the external IP address for FreeSWITCH configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'IP detection completed',
    type: IpDetectionResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  async detectExternalIp(): Promise<IpDetectionResponseDto> {
    try {
      this.logger.log('Detecting external IP address');
      
      const result = await this.globalNetworkConfigService.detectExternalIp();
      
      return {
        success: result.success,
        data: result,
        message: result.success 
          ? `External IP detected: ${result.detectedIp}` 
          : 'Failed to detect external IP',
      };
    } catch (error) {
      this.logger.error(`Failed to detect external IP: ${error.message}`);
      throw new BadRequestException('Failed to detect external IP');
    }
  }

  @Post('sync-xml')
  @ApiOperation({ 
    summary: 'Sync configuration to XML files',
    description: 'Sync the current network configuration to FreeSWITCH XML files without reloading'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration synced to XML files successfully',
  })
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  async syncToXml(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Syncing configuration to XML files');
      
      const config = await this.globalNetworkConfigService.findConfig();
      await this.globalNetworkConfigService.syncToFreeSwitchXml(config);
      
      return {
        success: true,
        message: 'Configuration synced to XML files successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to sync configuration to XML: ${error.message}`);
      throw new BadRequestException('Failed to sync configuration to XML files');
    }
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Get network configuration status',
    description: 'Get the current status and health of network configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Network configuration status retrieved successfully',
  })
  @AdminOnly()
  async getConfigStatus(): Promise<{
    success: boolean;
    data: {
      configId: number;
      status: string;
      lastAppliedAt?: Date;
      lastAppliedBy?: string;
      isValid: boolean;
      validationErrors?: string[];
      validationWarnings?: string[];
    };
    message: string;
  }> {
    try {
      this.logger.log('Getting network configuration status');
      
      const config = await this.globalNetworkConfigService.findConfig();
      const validation = await this.globalNetworkConfigService.validateConfig(config);
      
      return {
        success: true,
        data: {
          configId: config.id,
          status: config.status,
          lastAppliedAt: config.lastAppliedAt,
          lastAppliedBy: config.lastAppliedBy,
          isValid: validation.isValid,
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
        },
        message: 'Network configuration status retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get network configuration status: ${error.message}`);
      throw error;
    }
  }

  @Post('reset-to-default')
  @ApiOperation({ 
    summary: 'Reset to default configuration',
    description: 'Reset network configuration to default values'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration reset to default successfully',
    type: NetworkConfigResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @SuperAdminOnly()
  async resetToDefault(@Request() req: any): Promise<NetworkConfigResponseDto> {
    try {
      this.logger.log('Resetting network configuration to default');
      
      const defaultConfig: UpdateGlobalNetworkConfigDto = {
        externalIp: 'auto',
        bindServerIp: 'auto',
        domain: 'localhost',
        sipPort: 5060,
        tlsPort: 5061,
        rtpStartPort: 16384,
        rtpEndPort: 16484,
        stunServer: 'stun:stun.freeswitch.org',
        stunEnabled: true,
        globalCodecPrefs: 'OPUS,G722,PCMU,PCMA',
        outboundCodecPrefs: 'OPUS,G722,PCMU,PCMA',
        transportProtocols: ['udp', 'tcp'],
        enableTls: false,
        natDetection: true,
        autoNat: true,
        autoApply: false,
      };
      
      const updatedBy = req.user?.username || req.user?.email;
      const config = await this.globalNetworkConfigService.updateConfig(defaultConfig, updatedBy);
      
      return {
        success: true,
        data: config,
        message: 'Network configuration reset to default successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to reset network configuration: ${error.message}`);
      throw new BadRequestException('Failed to reset network configuration');
    }
  }
}
