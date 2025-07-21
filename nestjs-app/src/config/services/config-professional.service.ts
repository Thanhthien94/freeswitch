import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigItem, ConfigCategory } from '../entities/config-item.entity';
import { 
  ConfigCategoryDto, 
  ConfigItemDto, 
  CreateConfigItemDto, 
  UpdateConfigItemDto,
  ConfigResponseDto 
} from '../dto/config-professional.dto';

@Injectable()
export class ConfigProfessionalService {
  private readonly logger = new Logger(ConfigProfessionalService.name);

  constructor(
    @InjectRepository(ConfigItem)
    private readonly configItemRepository: Repository<ConfigItem>,
    @InjectRepository(ConfigCategory)
    private readonly configCategoryRepository: Repository<ConfigCategory>,
  ) {}

  /**
   * Get all configuration items grouped by categories
   */
  async getAllConfigs(): Promise<ConfigResponseDto> {
    try {
      this.logger.log('Fetching all configuration items');

      const categories = await this.configCategoryRepository.find({
        where: { isActive: true },
        order: { order: 'ASC', name: 'ASC' },
      });

      const result = [];

      for (const category of categories) {
        const items = await this.configItemRepository.find({
          where: { 
            categoryId: category.id,
            isActive: true 
          },
          order: { order: 'ASC', name: 'ASC' },
        });

        result.push({
          category: {
            id: category.id,
            name: category.name,
            displayName: category.displayName,
            description: category.description,
            icon: category.icon,
            order: category.order,
          },
          items: items.map(item => this.mapItemToDto(item)),
        });
      }

      this.logger.log(`Retrieved ${result.length} categories with configurations`);

      return {
        success: true,
        data: result,
        total: result.length,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('Failed to fetch configurations', error);
      throw new BadRequestException(`Failed to list configurations: ${error.message}`);
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<ConfigResponseDto> {
    try {
      this.logger.log('Fetching all categories');

      const categories = await this.configCategoryRepository.find({
        where: { isActive: true },
        order: { order: 'ASC', name: 'ASC' },
      });

      return {
        success: true,
        data: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          displayName: cat.displayName,
          description: cat.description,
          icon: cat.icon,
          order: cat.order,
        })),
        total: categories.length,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('Failed to fetch categories', error);
      throw new BadRequestException(`Failed to get categories: ${error.message}`);
    }
  }

  /**
   * Get configuration by category and name
   */
  async getConfig(categoryName: string, itemName: string): Promise<ConfigResponseDto> {
    try {
      this.logger.log(`Fetching config: ${categoryName}/${itemName}`);

      const category = await this.findCategoryByName(categoryName);
      const item = await this.findConfigItem(category.id, itemName);

      return {
        success: true,
        data: {
          ...this.mapItemToDto(item),
          category: {
            id: category.id,
            name: category.name,
            displayName: category.displayName,
          },
        },
        timestamp: new Date(),
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get config ${categoryName}/${itemName}`, error);
      throw new BadRequestException(`Failed to get configuration: ${error.message}`);
    }
  }

  /**
   * Update configuration value
   */
  async updateConfig(
    categoryName: string, 
    itemName: string, 
    updateDto: UpdateConfigItemDto,
    updatedBy: string
  ): Promise<ConfigResponseDto> {
    try {
      this.logger.log(`Updating config: ${categoryName}/${itemName} by ${updatedBy}`);

      const category = await this.findCategoryByName(categoryName);
      const item = await this.findConfigItem(category.id, itemName);

      if (item.isReadOnly) {
        throw new BadRequestException(`Configuration '${itemName}' is read-only`);
      }

      // Update fields
      if (updateDto.value !== undefined) {
        if (!item.isValidValue(updateDto.value)) {
          throw new BadRequestException(`Invalid value for configuration '${itemName}' of type '${item.dataType}'`);
        }
        item.setValue(updateDto.value);
      }

      if (updateDto.displayName) item.displayName = updateDto.displayName;
      if (updateDto.description !== undefined) item.description = updateDto.description;
      if (updateDto.defaultValue !== undefined) item.defaultValue = updateDto.defaultValue;
      if (updateDto.dataType) item.dataType = updateDto.dataType;
      if (updateDto.validation !== undefined) item.validation = updateDto.validation;
      if (updateDto.isRequired !== undefined) item.isRequired = updateDto.isRequired;
      if (updateDto.isSecret !== undefined) item.isSecret = updateDto.isSecret;
      if (updateDto.isReadOnly !== undefined) item.isReadOnly = updateDto.isReadOnly;
      if (updateDto.order !== undefined) item.order = updateDto.order;
      if (updateDto.isActive !== undefined) item.isActive = updateDto.isActive;
      if (updateDto.tags !== undefined) item.tags = updateDto.tags;
      if (updateDto.metadata !== undefined) item.metadata = updateDto.metadata;

      item.updatedBy = updatedBy;
      item.updatedAt = new Date();

      await this.configItemRepository.save(item);

      this.logger.log(`Config updated successfully: ${categoryName}/${itemName}`);

      return {
        success: true,
        data: this.mapItemToDto(item),
        message: 'Configuration updated successfully',
        timestamp: new Date(),
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update config ${categoryName}/${itemName}`, error);
      throw new BadRequestException(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Create new configuration item
   */
  async createConfig(createDto: CreateConfigItemDto, createdBy: string): Promise<ConfigResponseDto> {
    try {
      this.logger.log(`Creating config: ${createDto.categoryId}/${createDto.name} by ${createdBy}`);

      // Verify category exists
      const category = await this.configCategoryRepository.findOne({
        where: { id: createDto.categoryId, isActive: true }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID '${createDto.categoryId}' not found`);
      }

      // Check if config already exists
      const existing = await this.configItemRepository.findOne({
        where: { 
          categoryId: createDto.categoryId,
          name: createDto.name 
        }
      });

      if (existing) {
        throw new BadRequestException(`Configuration '${createDto.name}' already exists in category '${category.name}'`);
      }

      // Create new config item
      const item = new ConfigItem();
      Object.assign(item, createDto);
      item.createdBy = createdBy;
      item.updatedBy = createdBy;

      if (createDto.value !== undefined) {
        item.setValue(createDto.value);
      }

      await this.configItemRepository.save(item);

      this.logger.log(`Config created successfully: ${category.name}/${createDto.name}`);

      return {
        success: true,
        data: this.mapItemToDto(item),
        message: 'Configuration created successfully',
        timestamp: new Date(),
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create config`, error);
      throw new BadRequestException(`Failed to create configuration: ${error.message}`);
    }
  }

  /**
   * Helper: Find category by name
   */
  private async findCategoryByName(name: string): Promise<ConfigCategory> {
    const category = await this.configCategoryRepository.findOne({
      where: { name, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Category '${name}' not found`);
    }

    return category;
  }

  /**
   * Helper: Find config item
   */
  private async findConfigItem(categoryId: string, name: string): Promise<ConfigItem> {
    const item = await this.configItemRepository.findOne({
      where: { 
        categoryId,
        name,
        isActive: true 
      },
    });

    if (!item) {
      throw new NotFoundException(`Configuration '${name}' not found`);
    }

    return item;
  }

  /**
   * Helper: Map entity to DTO
   */
  private mapItemToDto(item: ConfigItem): any {
    return {
      id: item.id,
      name: item.name,
      displayName: item.displayName,
      description: item.description,
      value: item.getDisplayValue(),
      parsedValue: item.getParsedValue(),
      defaultValue: item.defaultValue,
      dataType: item.dataType,
      validation: item.validation,
      isRequired: item.isRequired,
      isSecret: item.isSecret,
      isReadOnly: item.isReadOnly,
      order: item.order,
      isActive: item.isActive,
      tags: item.tags,
      metadata: item.metadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
    };
  }
}
