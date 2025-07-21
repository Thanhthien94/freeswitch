import { 
  Controller, 
  Get, 
  Post,
  Put, 
  Param, 
  Body, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProfessionalAuthGuard } from '../../auth/guards/professional-auth.guard';
import { 
  RequirePermissions, 
  PERMISSIONS 
} from '../../auth/decorators/auth.decorators';
import { ConfigProfessionalService } from '../services/config-professional.service';
import { 
  ConfigCategoryDto, 
  ConfigItemDto, 
  CreateConfigItemDto, 
  UpdateConfigItemDto,
  ConfigResponseDto 
} from '../dto/config-professional.dto';

@ApiTags('Configuration Management')
@Controller('config')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
export class ConfigProfessionalController {
  constructor(
    private readonly configService: ConfigProfessionalService,
  ) {}

  /**
   * Get all configuration items grouped by categories
   */
  @Get()
  @RequirePermissions(PERMISSIONS.CONFIG_READ)
  @ApiOperation({
    summary: 'Get all configuration items',
    description: 'Retrieve all configuration items grouped by categories',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration items retrieved successfully',
    type: ConfigResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAllConfigs(): Promise<ConfigResponseDto> {
    return this.configService.getAllConfigs();
  }

  /**
   * Get configuration categories
   */
  @Get('categories')
  @RequirePermissions(PERMISSIONS.CONFIG_READ)
  @ApiOperation({
    summary: 'Get configuration categories',
    description: 'Retrieve all configuration categories',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories retrieved successfully',
    type: ConfigResponseDto,
  })
  async getCategories(): Promise<ConfigResponseDto> {
    return this.configService.getCategories();
  }

  /**
   * Get specific configuration item
   */
  @Get(':category/:name')
  @RequirePermissions(PERMISSIONS.CONFIG_READ)
  @ApiOperation({
    summary: 'Get configuration item',
    description: 'Retrieve a specific configuration item by category and name',
  })
  @ApiParam({ name: 'category', description: 'Configuration category name' })
  @ApiParam({ name: 'name', description: 'Configuration item name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration item retrieved successfully',
    type: ConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Configuration item not found' })
  async getConfig(
    @Param('category') category: string,
    @Param('name') name: string,
  ): Promise<ConfigResponseDto> {
    return this.configService.getConfig(category, name);
  }

  /**
   * Create new configuration item
   */
  @Post()
  @RequirePermissions(PERMISSIONS.CONFIG_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create configuration item',
    description: 'Create a new configuration item',
  })
  @ApiBody({ type: CreateConfigItemDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Configuration item created successfully',
    type: ConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Configuration item already exists' })
  async createConfig(
    @Body() createDto: CreateConfigItemDto,
    @Request() req: any,
  ): Promise<ConfigResponseDto> {
    const createdBy = req.user?.username || req.user?.id || 'unknown';
    return this.configService.createConfig(createDto, createdBy);
  }

  /**
   * Update configuration item
   */
  @Put(':category/:name')
  @RequirePermissions(PERMISSIONS.CONFIG_UPDATE)
  @ApiOperation({
    summary: 'Update configuration item',
    description: 'Update an existing configuration item',
  })
  @ApiParam({ name: 'category', description: 'Configuration category name' })
  @ApiParam({ name: 'name', description: 'Configuration item name' })
  @ApiBody({ type: UpdateConfigItemDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration updated successfully',
    type: ConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid value or read-only configuration' })
  @ApiResponse({ status: 404, description: 'Configuration item not found' })
  async updateConfig(
    @Param('category') category: string,
    @Param('name') name: string,
    @Body() updateDto: UpdateConfigItemDto,
    @Request() req: any,
  ): Promise<ConfigResponseDto> {
    const updatedBy = req.user?.username || req.user?.id || 'unknown';
    return this.configService.updateConfig(category, name, updateDto, updatedBy);
  }

  /**
   * Update configuration value only (simplified endpoint)
   */
  @Put(':category/:name/value')
  @RequirePermissions(PERMISSIONS.CONFIG_UPDATE)
  @ApiOperation({
    summary: 'Update configuration value',
    description: 'Update only the value of a configuration item',
  })
  @ApiParam({ name: 'category', description: 'Configuration category name' })
  @ApiParam({ name: 'name', description: 'Configuration item name' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        value: { 
          description: 'New configuration value',
          oneOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'object' },
          ],
        },
      },
      required: ['value'],
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration value updated successfully',
    type: ConfigResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid value or read-only configuration' })
  @ApiResponse({ status: 404, description: 'Configuration item not found' })
  async updateConfigValue(
    @Param('category') category: string,
    @Param('name') name: string,
    @Body() body: { value: any },
    @Request() req: any,
  ): Promise<ConfigResponseDto> {
    const updatedBy = req.user?.username || req.user?.id || 'unknown';
    return this.configService.updateConfig(
      category, 
      name, 
      { value: body.value }, 
      updatedBy
    );
  }
}
