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
import { FreeSwitchDialplanService, CreateDialplanDto, UpdateDialplanDto, DialplanQueryDto } from '../services/freeswitch-dialplan.service';
import { FreeSwitchDialplan } from '../entities/freeswitch-dialplan.entity';

@ApiTags('FreeSWITCH Dialplans')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard, RolesGuard)
@Controller('api/v1/freeswitch/dialplans')
export class FreeSwitchDialplanController {
  constructor(
    private readonly dialplanService: FreeSwitchDialplanService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new dialplan' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Dialplan created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Dialplan name already exists in context' })
  async create(
    @Body(ValidationPipe) createDto: CreateDialplanDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchDialplan> {
    return this.dialplanService.create(createDto, user.id);
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all dialplans with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'context', required: false, type: String })
  @ApiQuery({ name: 'domainId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isTemplate', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplans retrieved successfully' })
  async findAll(@Query() query: DialplanQueryDto) {
    return this.dialplanService.findAll(query);
  }

  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get dialplans statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.dialplanService.getStats();
  }

  @Get('by-context/:context')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get dialplans by context' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplans retrieved successfully' })
  async findByContext(@Param('context') context: string): Promise<FreeSwitchDialplan[]> {
    return this.dialplanService.findByContext(context);
  }

  @Get('context/:context/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate XML configuration for context' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Context XML generated successfully' })
  async generateContextXml(@Param('context') context: string): Promise<{ xml: string }> {
    const xml = await this.dialplanService.generateContextXml(context);
    return { xml };
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get dialplan by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplan retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Dialplan not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FreeSwitchDialplan> {
    return this.dialplanService.findOne(id);
  }

  @Get(':id/xml')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Generate XML configuration for dialplan' })
  @ApiResponse({ status: HttpStatus.OK, description: 'XML configuration generated successfully' })
  async generateXml(@Param('id', ParseUUIDPipe) id: string): Promise<{ xml: string }> {
    const xml = await this.dialplanService.generateXml(id);
    return { xml };
  }

  @Post(':id/create-from-template')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create dialplan from template' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Dialplan created from template successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Source dialplan is not a template' })
  async createFromTemplate(
    @Param('id', ParseUUIDPipe) templateId: string,
    @Body(ValidationPipe) data: Partial<CreateDialplanDto>,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchDialplan> {
    return this.dialplanService.createFromTemplate(templateId, data, user.id);
  }

  @Put(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Update dialplan' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplan updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Dialplan not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Dialplan name already exists in context' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateDialplanDto,
    @CurrentUser() user: any,
  ): Promise<FreeSwitchDialplan> {
    return this.dialplanService.update(id, updateDto, user.id);
  }

  @Put('bulk-priority')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Bulk update dialplan priority' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dialplan priorities updated successfully' })
  async bulkUpdatePriority(
    @Body() updates: Array<{ id: string; priority: number }>,
  ): Promise<{ message: string }> {
    await this.dialplanService.bulkUpdatePriority(updates);
    return { message: 'Dialplan priorities updated successfully' };
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Delete dialplan' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Dialplan deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Dialplan not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.dialplanService.remove(id);
  }
}
