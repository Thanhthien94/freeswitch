import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HybridAuthGuard } from '../../auth/guards/hybrid-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/auth.decorators';
import { FreeSwitchSipProfileService, CreateSipProfileDto, UpdateSipProfileDto, SipProfileQueryDto } from '../services/freeswitch-sip-profile.service';
import { FreeSwitchSipProfile } from '../entities/freeswitch-sip-profile.entity';
import { FreeSwitchEslService } from '../services/freeswitch-esl.service';

@ApiTags('FreeSWITCH SIP Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(HybridAuthGuard, RolesGuard)
@Controller('freeswitch/sip-profiles')
export class FreeSwitchSipProfileController {
  constructor(
    private readonly sipProfileService: FreeSwitchSipProfileService,
    private readonly eslService: FreeSwitchEslService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new SIP profile' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'SIP profile created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'SIP profile name already exists' })
  async create(
    @Body(ValidationPipe) createDto: CreateSipProfileDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchSipProfile> {
    return this.sipProfileService.create(createDto, user.id);
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all SIP profiles with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['internal', 'external', 'custom'] })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profiles retrieved successfully' })
  async findAll(@Query() query: SipProfileQueryDto) {
    return this.sipProfileService.findAll(query);
  }

  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get SIP profiles statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.sipProfileService.getStats();
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get SIP profile by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SIP profile not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FreeSwitchSipProfile> {
    return this.sipProfileService.findOne(id);
  }

  @Get(':id/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate XML configuration for SIP profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'XML configuration generated successfully' })
  async generateXml(@Param('id', ParseUUIDPipe) id: string): Promise<{ xml: string }> {
    const xml = await this.sipProfileService.generateXml(id);
    return { xml };
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update SIP profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SIP profile not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'SIP profile name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateSipProfileDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchSipProfile> {
    return this.sipProfileService.update(id, updateDto, user.id);
  }

  @Put(':id/set-default')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Set SIP profile as default' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Default SIP profile set successfully' })
  async setDefault(@Param('id', ParseUUIDPipe) id: string): Promise<FreeSwitchSipProfile> {
    return this.sipProfileService.setDefault(id);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete SIP profile' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'SIP profile deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SIP profile not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete SIP profile with dependencies' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.sipProfileService.remove(id);
  }

  @Post(':id/reload')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Reload SIP profile in FreeSWITCH' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile reloaded successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SIP profile not found' })
  async reloadProfile(@Param('id', ParseUUIDPipe) id: string) {
    // Get profile to get the name
    const profile = await this.sipProfileService.findOne(id);

    // Reload the profile using ESL service
    return this.eslService.reloadSipProfile(profile.name);
  }

  @Post(':id/test')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Test SIP profile connection' })
  @ApiResponse({ status: HttpStatus.OK, description: 'SIP profile test completed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'SIP profile not found' })
  async testProfile(@Param('id', ParseUUIDPipe) id: string) {
    // Get profile to get the name
    const profile = await this.sipProfileService.findOne(id);

    // Get profile status using ESL service
    return this.eslService.getSipProfileStatus(profile.name);
  }
}
