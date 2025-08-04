import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HybridAuthGuard } from '../../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/auth.decorators';
import { FreeSwitchExtensionService, CreateExtensionDto, UpdateExtensionDto, ExtensionQueryDto } from '../services/freeswitch-extension.service';
import { FreeSwitchExtension } from '../entities/freeswitch-extension.entity';

@ApiTags('FreeSWITCH Extensions')
@ApiBearerAuth('JWT-auth')
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('freeswitch/extensions')
export class FreeSwitchExtensionController {
  constructor(
    private readonly extensionService: FreeSwitchExtensionService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new extension' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Extension created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Extension number already exists in domain' })
  async create(
    @Body(ValidationPipe) createDto: CreateExtensionDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.create(createDto, user.id);
  }

  @Post('basic')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a basic extension with default settings' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Basic extension created successfully' })
  async createBasic(
    @Body() data: {
      extensionNumber: string;
      displayName: string;
      password: string;
      domainId?: string;
    },
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.createBasicExtension(
      data.extensionNumber,
      data.displayName,
      data.password,
      data.domainId,
      user.id,
    );
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all extensions with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'profileId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extensions retrieved successfully' })
  async findAll(@Query() query: ExtensionQueryDto) {
    return this.extensionService.findAll(query);
  }

  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get extensions statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.extensionService.getStats();
  }

  @Get('by-user/:userId')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extensions by user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extensions retrieved successfully' })
  async findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<FreeSwitchExtension[]> {
    return this.extensionService.findByUser(userId);
  }

  @Get('by-domain/:domainId')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get extensions by domain ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extensions retrieved successfully' })
  async findByDomain(@Param('domainId', ParseUUIDPipe) domainId: string): Promise<FreeSwitchExtension[]> {
    return this.extensionService.findByDomain(domainId);
  }

  @Get('by-number/:extensionNumber')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extension by number' })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extension retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async findByNumber(
    @Param('extensionNumber') extensionNumber: string,
    @Query('domainId') domainId?: string,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.findByNumber(extensionNumber, domainId);
  }

  @Get('directory/:domainName/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate directory XML for domain' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Directory XML generated successfully' })
  async generateDirectoryXml(@Param('domainName') domainName: string): Promise<{ xml: string }> {
    const xml = await this.extensionService.generateDirectoryXml(domainName);
    return { xml };
  }

  @Get(':id/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate XML configuration for extension' })
  @ApiResponse({ status: HttpStatus.OK, description: 'XML configuration generated successfully' })
  async generateXml(@Param('id', ParseUUIDPipe) id: string): Promise<{ xml: string }> {
    const xml = await this.extensionService.generateXml(id);
    return { xml };
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update extension' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extension updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Extension number already exists in domain' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateExtensionDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete extension' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Extension deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.extensionService.remove(id);
  }

  @Get(':id/stats')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extension call statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extension statistics retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async getExtensionStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.extensionService.getExtensionStats(id);
  }

  @Get(':id/calls')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extension call history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call history retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async getExtensionCalls(@Param('id', ParseUUIDPipe) id: string) {
    return this.extensionService.getExtensionCalls(id);
  }

  @Get(':id/registration')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extension registration status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Registration status retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async getExtensionRegistration(@Param('id', ParseUUIDPipe) id: string) {
    return this.extensionService.getExtensionRegistration(id);
  }

  @Patch(':id/reset-password')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reset extension password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { password?: string },
    @CurrentUser() user: any,
  ) {
    return this.extensionService.resetExtensionPassword(id, body.password, user.id);
  }

  @Post(':id/test-connection')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Test extension connection' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connection test completed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async testConnection(@Param('id', ParseUUIDPipe) id: string) {
    return this.extensionService.testExtensionConnection(id);
  }

  @Post(':id/reboot')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reboot extension (force re-registration)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extension reboot initiated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async rebootExtension(@Param('id', ParseUUIDPipe) id: string) {
    return this.extensionService.rebootExtension(id);
  }

  @Post('generate-password')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate random password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password generated successfully' })
  async generatePassword() {
    return this.extensionService.generatePassword();
  }

  @Patch(':id/recording-settings')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update extension recording settings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recording settings updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async updateRecordingSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settings: {
      enabled?: boolean;
      mode?: string;
      format?: string;
      stereo?: boolean;
    },
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.updateRecordingSettings(id, settings, user.id);
  }

  @Patch(':id/voicemail-settings')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update extension voicemail settings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Voicemail settings updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async updateVoicemailSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settings: {
      enabled?: boolean;
      password?: string;
      email?: string;
      attachFile?: boolean;
      deleteFile?: boolean;
    },
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.updateVoicemailSettings(id, settings, user.id);
  }

  @Patch(':id/call-forward-settings')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update extension call forwarding settings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call forwarding settings updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async updateCallForwardSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settings: {
      enabled?: boolean;
      destination?: string;
      onBusy?: boolean;
      onNoAnswer?: boolean;
      timeout?: number;
    },
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.updateCallForwardSettings(id, settings, user.id);
  }

  @Patch(':id/dnd-settings')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update extension Do Not Disturb settings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'DND settings updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async updateDndSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() settings: {
      enabled?: boolean;
    },
    @CurrentUser() user: any,
  ): Promise<FreeSwitchExtension> {
    return this.extensionService.updateDndSettings(id, settings, user.id);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get extension by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Extension retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Extension not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FreeSwitchExtension> {
    return this.extensionService.findOne(id);
  }
}
