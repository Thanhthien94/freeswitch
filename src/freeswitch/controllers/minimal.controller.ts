import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MinimalFreeSwitchService } from '../services/minimal.service';

@ApiTags('FreeSWITCH')
@Controller('api/v1/freeswitch')
export class MinimalFreeSwitchController {
  private readonly logger = new Logger(MinimalFreeSwitchController.name);

  constructor(
    private readonly freeswitchService: MinimalFreeSwitchService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get FreeSWITCH system status' })
  @ApiResponse({ status: 200, description: 'System status retrieved successfully' })
  async getStatus() {
    this.logger.log('Getting system status');
    const status = await this.freeswitchService.getStatus();
    return {
      success: true,
      data: status,
      message: 'System status retrieved successfully'
    };
  }

  @Get('sip-profiles')
  @ApiOperation({ summary: 'Get all SIP profiles' })
  @ApiResponse({ status: 200, description: 'SIP profiles retrieved successfully' })
  async getSipProfiles() {
    this.logger.log('Getting SIP profiles');
    const profiles = await this.freeswitchService.getProfiles();
    return {
      success: true,
      data: profiles,
      total: profiles.length,
      message: 'SIP profiles retrieved successfully'
    };
  }

  @Get('gateways')
  @ApiOperation({ summary: 'Get all gateways' })
  @ApiResponse({ status: 200, description: 'Gateways retrieved successfully' })
  async getGateways() {
    this.logger.log('Getting gateways');
    const gateways = await this.freeswitchService.getGateways();
    return {
      success: true,
      data: gateways,
      total: gateways.length,
      message: 'Gateways retrieved successfully'
    };
  }

  @Get('extensions')
  @ApiOperation({ summary: 'Get all extensions' })
  @ApiResponse({ status: 200, description: 'Extensions retrieved successfully' })
  async getExtensions() {
    this.logger.log('Getting extensions');
    const extensions = await this.freeswitchService.getExtensions();
    return {
      success: true,
      data: extensions,
      total: extensions.length,
      message: 'Extensions retrieved successfully'
    };
  }

  @Get('dialplans')
  @ApiOperation({ summary: 'Get all dialplans' })
  @ApiResponse({ status: 200, description: 'Dialplans retrieved successfully' })
  async getDialplans() {
    this.logger.log('Getting dialplans');
    const dialplans = await this.freeswitchService.getDialplans();
    return {
      success: true,
      data: dialplans,
      total: dialplans.length,
      message: 'Dialplans retrieved successfully'
    };
  }

  @Get('domains')
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, description: 'Domains retrieved successfully' })
  async getDomains() {
    this.logger.log('Getting domains');
    const domains = await this.freeswitchService.getDomains();
    return {
      success: true,
      data: domains,
      total: domains.length,
      message: 'Domains retrieved successfully'
    };
  }
}
