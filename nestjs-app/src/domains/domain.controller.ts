import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfessionalAuthGuard } from '../auth/guards/professional-auth.guard';
import { RequirePermissions, PERMISSIONS } from '../auth/decorators/auth.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DomainService } from './domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainQueryDto } from './dto/domain-query.dto';

@ApiTags('domains')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: 201, description: 'Domain created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Domain already exists' })
  async create(@Body() createDomainDto: CreateDomainDto) {
    return this.domainService.create(createDomainDto);
  }

  @Get()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get all domains with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Domains retrieved successfully' })
  async findAll(@Query() query: DomainQueryDto) {
    return this.domainService.findAll(query);
  }

  @Get('stats')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get overall domain statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getAllStats() {
    return this.domainService.getAllDomainStats();
  }

  @Get(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get domain by ID' })
  @ApiResponse({ status: 200, description: 'Domain retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async findOne(@Param('id') id: string) {
    return this.domainService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get domain statistics' })
  @ApiResponse({ status: 200, description: 'Domain statistics retrieved successfully' })
  async getDomainStats(@Param('id') id: string) {
    return this.domainService.getDomainStats(id);
  }

  @Get(':id/users')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get all users in domain' })
  @ApiResponse({ status: 200, description: 'Domain users retrieved successfully' })
  async getDomainUsers(@Param('id') id: string) {
    return this.domainService.getDomainUsers(id);
  }

  @Get(':id/extensions')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Get all extensions in domain' })
  @ApiResponse({ status: 200, description: 'Domain extensions retrieved successfully' })
  async getDomainExtensions(@Param('id') id: string) {
    return this.domainService.getDomainExtensions(id);
  }

  @Patch(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update domain' })
  @ApiResponse({ status: 200, description: 'Domain updated successfully' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDomainDto: UpdateDomainDto,
  ) {
    return this.domainService.update(id, updateDomainDto);
  }

  @Patch(':id/toggle-status')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Toggle domain active status' })
  @ApiResponse({ status: 200, description: 'Domain status toggled successfully' })
  async toggleStatus(@Param('id') id: string) {
    return this.domainService.toggleStatus(id);
  }

  @Patch(':id/settings')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Update domain settings' })
  @ApiResponse({ status: 200, description: 'Domain settings updated successfully' })
  async updateSettings(
    @Param('id') id: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.domainService.updateSettings(id, settings);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete domain' })
  @ApiResponse({ status: 204, description: 'Domain deleted successfully' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete domain with existing users or extensions' })
  async remove(@Param('id') id: string) {
    await this.domainService.remove(id);
  }
}
