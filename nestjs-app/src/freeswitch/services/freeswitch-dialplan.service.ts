import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeSwitchDialplan, DialplanAction, DialplanAntiAction } from '../entities/freeswitch-dialplan.entity';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { FreeSwitchConfigType } from '../entities/freeswitch-config-version.entity';

export interface CreateDialplanDto {
  name: string;
  displayName?: string;
  description?: string;
  context?: string;
  domainId?: any;
  extensionPattern?: string;
  conditionField?: string;
  conditionExpression?: string;
  actions: DialplanAction[];
  antiActions?: DialplanAntiAction[];
  variables?: Record<string, any>;
  priority?: number;
  isActive?: boolean;
  isTemplate?: boolean;
}

export interface UpdateDialplanDto extends Partial<CreateDialplanDto> {}

export interface DialplanQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  context?: string;
  domainId?: any;
  isActive?: boolean;
  isTemplate?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class FreeSwitchDialplanService {
  private readonly logger = new Logger(FreeSwitchDialplanService.name);

  constructor(
    @InjectRepository(FreeSwitchDialplan)
    private readonly dialplanRepository: Repository<FreeSwitchDialplan>,
    private readonly versionService: FreeSwitchVersionService,
  ) {}

  async create(createDto: CreateDialplanDto, createdBy?: number): Promise<FreeSwitchDialplan> {
    this.logger.log(`Creating dialplan: ${createDto.name} in context: ${createDto.context}`);

    // Check if name already exists in the same context
    const existingDialplan = await this.dialplanRepository.findOne({
      where: { 
        name: createDto.name, 
        context: createDto.context || 'default' 
      }
    });

    if (existingDialplan) {
      throw new ConflictException(`Dialplan with name '${createDto.name}' already exists in context '${createDto.context || 'default'}'`);
    }

    // Validate dialplan before creating
    const validation = this.validateDialplan(createDto);
    if (!validation.isValid) {
      throw new ConflictException(`Invalid dialplan: ${validation.errors.join(', ')}`);
    }

    const dialplan = this.dialplanRepository.create({
      ...createDto,
      context: createDto.context || 'default',
      createdBy,
      updatedBy: createdBy,
    });

    const savedDialplan = await this.dialplanRepository.save(dialplan);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.DIALPLAN,
      savedDialplan.id,
      savedDialplan,
      savedDialplan.getXmlConfiguration(),
      'Initial dialplan created',
      createdBy
    );

    this.logger.log(`Dialplan created successfully: ${savedDialplan.id}`);
    return savedDialplan;
  }

  async findAll(query: DialplanQueryDto = {}): Promise<{
    data: FreeSwitchDialplan[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      context,
      domainId,
      isActive,
      isTemplate,
      sortBy = 'priority',
      sortOrder = 'ASC'
    } = query;

    const queryBuilder = this.dialplanRepository.createQueryBuilder('dialplan')
      .leftJoinAndSelect('dialplan.domain', 'domain')
      .leftJoinAndSelect('dialplan.creator', 'creator');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(dialplan.name ILIKE :search OR dialplan.displayName ILIKE :search OR dialplan.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (context) {
      queryBuilder.andWhere('dialplan.context = :context', { context });
    }

    if (domainId) {
      queryBuilder.andWhere('dialplan.domainId = :domainId', { domainId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('dialplan.isActive = :isActive', { isActive });
    }

    if (isTemplate !== undefined) {
      queryBuilder.andWhere('dialplan.isTemplate = :isTemplate', { isTemplate });
    }

    // Apply sorting
    const validSortFields = ['name', 'context', 'priority', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'priority';
    queryBuilder.orderBy(`dialplan.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<FreeSwitchDialplan> {
    const dialplan = await this.dialplanRepository.findOne({
      where: { id },
      relations: ['domain', 'creator', 'updater'],
    });

    if (!dialplan) {
      throw new NotFoundException(`Dialplan with ID ${id} not found`);
    }

    return dialplan;
  }

  async findByContext(context: string): Promise<FreeSwitchDialplan[]> {
    return this.dialplanRepository.find({
      where: { context, isActive: true },
      relations: ['domain'],
      order: { priority: 'ASC' },
    });
  }

  async update(id: string, updateDto: any, updatedBy?: number): Promise<FreeSwitchDialplan> {
    this.logger.log(`Updating dialplan: ${id}`);

    const dialplan = await this.findOne(id);

    // Check if name/context combination is being changed and if it conflicts
    if ((updateDto.name && updateDto.name !== dialplan.name) || 
        (updateDto.context && updateDto.context !== dialplan.context)) {
      const newName = updateDto.name || dialplan.name;
      const newContext = updateDto.context || dialplan.context;
      
      const existingDialplan = await this.dialplanRepository.findOne({
        where: { name: newName, context: newContext }
      });

      if (existingDialplan && existingDialplan.id !== id) {
        throw new ConflictException(`Dialplan with name '${newName}' already exists in context '${newContext}'`);
      }
    }

    // Validate updated dialplan
    const mergedData = { ...dialplan, ...updateDto };
    const validation = this.validateDialplan(mergedData);
    if (!validation.isValid) {
      throw new ConflictException(`Invalid dialplan: ${validation.errors.join(', ')}`);
    }

    // Update the dialplan
    Object.assign(dialplan, updateDto, { updatedBy });
    const updatedDialplan = await this.dialplanRepository.save(dialplan);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.DIALPLAN,
      updatedDialplan.id,
      updatedDialplan,
      updatedDialplan.getXmlConfiguration(),
      'Dialplan updated',
      updatedBy
    );

    this.logger.log(`Dialplan updated successfully: ${id}`);
    return updatedDialplan;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing dialplan: ${id}`);

    const dialplan = await this.findOne(id);
    await this.dialplanRepository.remove(dialplan);
    
    this.logger.log(`Dialplan removed successfully: ${id}`);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    templates: number;
    byContext: Record<string, number>;
  }> {
    const [total, active, templates, dialplans] = await Promise.all([
      this.dialplanRepository.count(),
      this.dialplanRepository.count({ where: { isActive: true } }),
      this.dialplanRepository.count({ where: { isTemplate: true } }),
      this.dialplanRepository.find(),
    ]);

    const byContext = dialplans.reduce((acc, dialplan) => {
      acc[dialplan.context] = (acc[dialplan.context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive: total - active,
      templates,
      byContext,
    };
  }

  async generateContextXml(context: string): Promise<string> {
    const dialplans = await this.findByContext(context);
    
    const extensionsXml = dialplans
      .map(dialplan => dialplan.getXmlConfiguration())
      .join('\n');

    return `
  <context name="${context}">
    ${extensionsXml}
  </context>`;
  }

  async createFromTemplate(templateId: string, data: Partial<CreateDialplanDto>, createdBy?: number): Promise<FreeSwitchDialplan> {
    const template = await this.findOne(templateId);
    
    if (!template.isTemplate) {
      throw new ConflictException('Source dialplan is not a template');
    }

    const { id, ...templateData } = template;
    const dialplanData: any = {
      ...templateData,
      ...data,
      name: data.name || `${template.name}_copy`,
      isTemplate: false,
    };

    return this.create(dialplanData, createdBy);
  }

  private validateDialplan(data: Partial<CreateDialplanDto>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name) {
      errors.push('Name is required');
    }

    if (!data.actions || data.actions.length === 0) {
      errors.push('At least one action is required');
    }

    if (data.conditionExpression) {
      try {
        new RegExp(data.conditionExpression);
      } catch (error) {
        errors.push('Invalid regular expression in condition');
      }
    }

    // Validate actions
    if (data.actions) {
      data.actions.forEach((action, index) => {
        if (!action.application) {
          errors.push(`Action ${index + 1}: Application is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async generateXml(id: string): Promise<string> {
    const dialplan = await this.findOne(id);
    return dialplan.getXmlConfiguration();
  }

  async bulkUpdatePriority(updates: Array<{ id: string; priority: number }>): Promise<void> {
    this.logger.log(`Bulk updating dialplan priority for ${updates.length} dialplans`);

    await Promise.all(
      updates.map(({ id, priority }) =>
        this.dialplanRepository.update(id, { priority })
      )
    );

    this.logger.log('Dialplan priorities updated successfully');
  }
}
