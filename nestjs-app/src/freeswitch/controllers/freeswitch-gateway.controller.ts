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
import { ProfessionalAuthGuard } from '../../auth/guards/professional-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/auth.decorators';
import { FreeSwitchGatewayService, CreateGatewayDto, UpdateGatewayDto, GatewayQueryDto } from '../services/freeswitch-gateway.service';
import { FreeSwitchGateway } from '../entities/freeswitch-gateway.entity';

@ApiTags('FreeSWITCH Gateways')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard, RolesGuard)
@Controller('freeswitch/gateways')
export class FreeSwitchGatewayController {
  constructor(
    private readonly gatewayService: FreeSwitchGatewayService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new gateway' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Gateway created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Gateway name already exists' })
  async create(
    @Body(ValidationPipe) createDto: CreateGatewayDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchGateway> {
    return this.gatewayService.create(createDto, user.id);
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all gateways with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'profileId', required: false, type: String })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateways retrieved successfully' })
  async findAll(@Query() query: GatewayQueryDto) {
    return this.gatewayService.findAll(query);
  }

  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get gateways statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.gatewayService.getStats();
  }

  @Get('by-profile/:profileId')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get gateways by SIP profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateways retrieved successfully' })
  async findByProfile(@Param('profileId', ParseUUIDPipe) profileId: string): Promise<FreeSwitchGateway[]> {
    return this.gatewayService.findByProfile(profileId);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get gateway by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateway retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gateway not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FreeSwitchGateway> {
    return this.gatewayService.findOne(id);
  }

  @Get(':id/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate XML configuration for gateway' })
  @ApiResponse({ status: HttpStatus.OK, description: 'XML configuration generated successfully' })
  async generateXml(@Param('id', ParseUUIDPipe) id: string): Promise<{ xml: string }> {
    const xml = await this.gatewayService.generateXml(id);
    return { xml };
  }

  @Post(':id/test-connection')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Test gateway connection' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connection test completed' })
  async testConnection(@Param('id', ParseUUIDPipe) id: string) {
    return this.gatewayService.testConnection(id);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update gateway' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateway updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gateway not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Gateway name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateGatewayDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchGateway> {
    return this.gatewayService.update(id, updateDto, user.id);
  }

  @Put('bulk-order')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Bulk update gateway order' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gateway order updated successfully' })
  async bulkUpdateOrder(
    @Body() updates: Array<{ id: string; order: number }>,
  ): Promise<{ message: string }> {
    await this.gatewayService.bulkUpdateOrder(updates);
    return { message: 'Gateway order updated successfully' };
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete gateway' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Gateway deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Gateway not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gatewayService.remove(id);
  }
}
