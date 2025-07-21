import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FreeSwitchGateway } from '../entities/freeswitch-gateway.entity';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { FreeSwitchConfigType } from '../entities/freeswitch-config-version.entity';

export interface CreateGatewayDto {
  name: string;
  displayName?: string;
  description?: string;
  profileId: string;
  domainId?: string;
  gatewayHost: string;
  gatewayPort?: number;
  username?: string;
  password?: string;
  realm?: string;
  fromUser?: string;
  fromDomain?: string;
  proxy?: string;
  register?: boolean;
  registerTransport?: string;
  expireSeconds?: number;
  retrySeconds?: number;
  callerIdInFrom?: boolean;
  extension?: string;
  gatewayConfig?: any;
  authSettings?: any;
  routingSettings?: any;
  isActive?: boolean;
  order?: number;
}

export interface UpdateGatewayDto extends Partial<CreateGatewayDto> {}

export interface GatewayQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  profileId?: string;
  domainId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class FreeSwitchGatewayService {
  private readonly logger = new Logger(FreeSwitchGatewayService.name);

  constructor(
    @InjectRepository(FreeSwitchGateway)
    private readonly gatewayRepository: Repository<FreeSwitchGateway>,
    private readonly versionService: FreeSwitchVersionService,
  ) {}

  async create(createDto: CreateGatewayDto, createdBy?: number): Promise<FreeSwitchGateway> {
    this.logger.log(`Creating gateway: ${createDto.name}`);

    // Check if name already exists
    const existingGateway = await this.gatewayRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingGateway) {
      throw new ConflictException(`Gateway with name '${createDto.name}' already exists`);
    }

    const gateway = this.gatewayRepository.create({
      ...createDto,
      createdBy,
      updatedBy: createdBy,
    });

    const savedGateway = await this.gatewayRepository.save(gateway);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.GATEWAY,
      savedGateway.id,
      savedGateway,
      savedGateway.getXmlConfiguration(),
      'Initial gateway created',
      createdBy
    );

    this.logger.log(`Gateway created successfully: ${savedGateway.id}`);
    return savedGateway;
  }

  async findAll(query: GatewayQueryDto = {}): Promise<{
    data: FreeSwitchGateway[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      profileId,
      domainId,
      isActive,
      sortBy = 'order',
      sortOrder = 'ASC'
    } = query;

    const queryBuilder = this.gatewayRepository.createQueryBuilder('gateway')
      .leftJoinAndSelect('gateway.profile', 'profile')
      .leftJoinAndSelect('gateway.domain', 'domain')
      .leftJoinAndSelect('gateway.creator', 'creator');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(gateway.name ILIKE :search OR gateway.displayName ILIKE :search OR gateway.description ILIKE :search OR gateway.gatewayHost ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (profileId) {
      queryBuilder.andWhere('gateway.profileId = :profileId', { profileId });
    }

    if (domainId) {
      queryBuilder.andWhere('gateway.domainId = :domainId', { domainId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('gateway.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const validSortFields = ['name', 'gatewayHost', 'order', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'order';
    queryBuilder.orderBy(`gateway.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<FreeSwitchGateway> {
    const gateway = await this.gatewayRepository.findOne({
      where: { id },
      relations: ['profile', 'domain', 'creator', 'updater'],
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway with ID ${id} not found`);
    }

    return gateway;
  }

  async findByName(name: string): Promise<FreeSwitchGateway> {
    const gateway = await this.gatewayRepository.findOne({
      where: { name },
      relations: ['profile', 'domain'],
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway with name '${name}' not found`);
    }

    return gateway;
  }

  async findByProfile(profileId: string): Promise<FreeSwitchGateway[]> {
    return this.gatewayRepository.find({
      where: { profileId, isActive: true },
      relations: ['domain'],
      order: { order: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateGatewayDto, updatedBy?: number): Promise<FreeSwitchGateway> {
    this.logger.log(`Updating gateway: ${id}`);

    const gateway = await this.findOne(id);

    // Check if name is being changed and if it conflicts
    if (updateDto.name && updateDto.name !== gateway.name) {
      const existingGateway = await this.gatewayRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingGateway) {
        throw new ConflictException(`Gateway with name '${updateDto.name}' already exists`);
      }
    }

    // Update the gateway
    Object.assign(gateway, updateDto, { updatedBy });
    const updatedGateway = await this.gatewayRepository.save(gateway);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.GATEWAY,
      updatedGateway.id,
      updatedGateway,
      updatedGateway.getXmlConfiguration(),
      'Gateway updated',
      updatedBy
    );

    this.logger.log(`Gateway updated successfully: ${id}`);
    return updatedGateway;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing gateway: ${id}`);

    const gateway = await this.findOne(id);
    await this.gatewayRepository.remove(gateway);
    
    this.logger.log(`Gateway removed successfully: ${id}`);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    registered: number;
    byProfile: Record<string, number>;
  }> {
    const [total, active, gateways] = await Promise.all([
      this.gatewayRepository.count(),
      this.gatewayRepository.count({ where: { isActive: true } }),
      this.gatewayRepository.find({ relations: ['profile'] }),
    ]);

    const registered = gateways.filter(g => g.isRegistered()).length;
    
    const byProfile = gateways.reduce((acc, gateway) => {
      const profileName = gateway.profile?.name || 'Unknown';
      acc[profileName] = (acc[profileName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive: total - active,
      registered,
      byProfile,
    };
  }

  async testConnection(id: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    const gateway = await this.findOne(id);
    
    try {
      // Basic validation
      if (!gateway.gatewayHost) {
        return {
          success: false,
          message: 'Gateway host is required',
        };
      }

      if (gateway.register && (!gateway.username || !gateway.password)) {
        return {
          success: false,
          message: 'Username and password are required for registration',
        };
      }

      // TODO: Implement actual SIP connection test via ESL
      // For now, return basic validation result
      return {
        success: true,
        message: 'Gateway configuration is valid',
        details: {
          host: gateway.gatewayHost,
          port: gateway.gatewayPort,
          register: gateway.register,
          connectionString: gateway.getConnectionString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  async generateXml(id: string): Promise<string> {
    const gateway = await this.findOne(id);
    return gateway.getXmlConfiguration();
  }

  async bulkUpdateOrder(updates: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Bulk updating gateway order for ${updates.length} gateways`);

    await Promise.all(
      updates.map(({ id, order }) =>
        this.gatewayRepository.update(id, { order })
      )
    );

    this.logger.log('Gateway order updated successfully');
  }
}
