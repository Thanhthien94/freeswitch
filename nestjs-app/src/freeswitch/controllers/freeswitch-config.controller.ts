import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { FreeSwitchConfigService } from '../services/freeswitch-config.service';
import { FreeSwitchEslService } from '../services/freeswitch-esl.service';
import { FreeSwitchVersionService } from '../services/freeswitch-version.service';

@ApiTags('FreeSWITCH Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/freeswitch/config')
export class FreeSwitchConfigController {
  constructor(
    private readonly configService: FreeSwitchConfigService,
    private readonly eslService: FreeSwitchEslService,
    private readonly versionService: FreeSwitchVersionService,
  ) {}

  @Get('generate')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate complete FreeSWITCH configuration' })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuration generated successfully' })
  async generateConfiguration(@Query('domainId') domainId?: string) {
    return this.configService.generateCompleteConfiguration(domainId);
  }

  @Post('deploy')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Deploy FreeSWITCH configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuration deployed successfully' })
  async deployConfiguration(
    @Body() data: { domainId?: string },
    @CurrentUser() user: any,
  ) {
    return this.configService.deployConfiguration(data.domainId, user.id);
  }

  @Get('validate')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Validate FreeSWITCH configuration' })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Configuration validated successfully' })
  async validateConfiguration(@Query('domainId') domainId?: string) {
    return this.configService.validateConfiguration(domainId);
  }

  @Get('status')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get FreeSWITCH system status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'System status retrieved successfully' })
  async getSystemStatus() {
    return this.configService.getSystemStatus();
  }

  @Get('freeswitch-status')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get FreeSWITCH server status via ESL' })
  @ApiResponse({ status: HttpStatus.OK, description: 'FreeSWITCH status retrieved successfully' })
  async getFreeSwitchStatus() {
    return this.eslService.getSystemStatus();
  }

  @Post('reload-xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reload FreeSWITCH XML configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'XML configuration reloaded successfully' })
  async reloadXmlConfig() {
    return this.eslService.reloadXmlConfig();
  }

  @Post('reload-dialplan')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reload FreeSWITCH dialplan' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplan reloaded successfully' })
  async reloadDialplan() {
    return this.eslService.reloadDialplan();
  }

  @Post('reload-profile/:profileName')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reload FreeSWITCH SIP profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile reloaded successfully' })
  async reloadSipProfile(@Param('profileName') profileName: string) {
    return this.eslService.reloadSipProfile(profileName);
  }

  @Get('profile/:profileName/status')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get SIP profile status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile status retrieved successfully' })
  async getSipProfileStatus(@Param('profileName') profileName: string) {
    return this.eslService.getSipProfileStatus(profileName);
  }

  @Get('gateway/:gatewayName/status')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get gateway status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateway status retrieved successfully' })
  async getGatewayStatus(@Param('gatewayName') gatewayName: string) {
    return this.eslService.getGatewayStatus(gatewayName);
  }

  @Get('calls/active')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get active calls' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Active calls retrieved successfully' })
  async getActiveCalls() {
    return this.eslService.getActiveCalls();
  }

  @Post('calls/:callUuid/kill')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Kill active call' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call terminated successfully' })
  async killCall(@Param('callUuid') callUuid: string) {
    return this.eslService.killCall(callUuid);
  }

  @Post('command')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Execute FreeSWITCH command via ESL' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Command executed successfully' })
  async executeCommand(@Body() data: { command: string }) {
    const result = await this.eslService.executeCommand(data.command);
    return { result };
  }

  @Get('deployments')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get configuration deployments' })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deployments retrieved successfully' })
  async getDeployments(@Query('domainId') domainId?: string) {
    return this.versionService.getDeployments(domainId);
  }

  @Get('deployments/:id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get deployment by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deployment retrieved successfully' })
  async getDeployment(@Param('id', ParseUUIDPipe) id: string) {
    return this.versionService.getDeployment(id);
  }

  @Get('versions/stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get version control statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Version statistics retrieved successfully' })
  async getVersionStats() {
    return this.versionService.getVersionStats();
  }
}
