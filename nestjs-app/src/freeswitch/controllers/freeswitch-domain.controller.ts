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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from '../entities/domain.entity';

export interface CreateDomainDto {
  name: string;
  displayName?: string;
  description?: string;
  maxUsers?: number;
  maxExtensions?: number;
  maxConcurrentCalls?: number;
  settings?: any;
  billingSettings?: any;
  adminEmail: string;
  adminPhone?: string;
  timezone?: string;
  language?: string;
  isActive?: boolean;
}

export interface UpdateDomainDto extends Partial<CreateDomainDto> {}

export interface DomainQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@ApiTags('FreeSWITCH Domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/freeswitch/domains')
export class FreeSwitchDomainController {
  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
  ) {}

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Domain created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Domain name already exists' })
  async create(
    @Body(ValidationPipe) createDto: CreateDomainDto,
    @CurrentUser() user: any,
  ): Promise<Domain> {
    // Check if domain name already exists
    const existingDomain = await this.domainRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingDomain) {
      throw new Error(`Domain with name '${createDto.name}' already exists`);
    }

    const domain = this.domainRepository.create({
      ...createDto,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return this.domainRepository.save(domain);
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all domains with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Domains retrieved successfully' })
  async findAll(@Query() query: DomainQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = query;

    const queryBuilder = this.domainRepository.createQueryBuilder('domain')
      .leftJoinAndSelect('domain.creator', 'creator');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(domain.name ILIKE :search OR domain.displayName ILIKE :search OR domain.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('domain.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const validSortFields = ['name', 'displayName', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`domain.${sortField}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  @Get('stats')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get domains statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStats() {
    const [total, active] = await Promise.all([
      this.domainRepository.count(),
      this.domainRepository.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get domain by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Domain retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Domain not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { id },
      relations: ['creator', 'updater'],
    });

    if (!domain) {
      throw new Error(`Domain with ID ${id} not found`);
    }

    return domain;
  }

  @Get(':id/usage')
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get domain resource usage' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Domain usage retrieved successfully' })
  async getDomainUsage(@Param('id', ParseUUIDPipe) id: string) {
    const domain = await this.findOne(id);
    
    // TODO: Implement actual usage calculation
    // This would involve counting users, extensions, concurrent calls, etc.
    
    return {
      domainId: id,
      domainName: domain.name,
      limits: {
        maxUsers: domain.maxUsers,
        maxExtensions: domain.maxExtensions,
        maxConcurrentCalls: domain.maxConcurrentCalls,
      },
      usage: {
        currentUsers: 0, // TODO: Count actual users
        currentExtensions: 0, // TODO: Count actual extensions
        currentCalls: 0, // TODO: Count current calls
      },
      utilization: {
        users: 0, // TODO: Calculate percentage
        extensions: 0, // TODO: Calculate percentage
        calls: 0, // TODO: Calculate percentage
      },
    };
  }

  @Put(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Update domain' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Domain updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Domain not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Domain name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateDomainDto,
    @CurrentUser() user: any,
  ): Promise<Domain> {
    const domain = await this.findOne(id);

    // Check if name is being changed and if it conflicts
    if (updateDto.name && updateDto.name !== domain.name) {
      const existingDomain = await this.domainRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingDomain) {
        throw new Error(`Domain with name '${updateDto.name}' already exists`);
      }
    }

    // Update the domain
    Object.assign(domain, updateDto, { updatedBy: user.id });
    return this.domainRepository.save(domain);
  }

  @Delete(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Delete domain' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Domain deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Domain not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete domain with dependencies' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const domain = await this.findOne(id);
    
    // TODO: Check for dependencies (users, extensions, etc.)
    // Prevent deletion if domain has active resources
    
    await this.domainRepository.remove(domain);
  }
}
