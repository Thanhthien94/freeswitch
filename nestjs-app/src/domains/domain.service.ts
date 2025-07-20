import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Domain } from '../auth/entities/domain.entity';
import { UsersService } from '../users/users.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { DomainQueryDto } from './dto/domain-query.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createDomainDto: CreateDomainDto): Promise<Domain> {
    // Check if domain name already exists
    const existingDomain = await this.domainRepository.findOne({
      where: { name: createDomainDto.name },
    });
    if (existingDomain) {
      throw new ConflictException('Domain name already exists');
    }

    const domain = this.domainRepository.create({
      ...createDomainDto,
      id: createDomainDto.name, // Use domain name as ID
    });

    const savedDomain = await this.domainRepository.save(domain);

    // Emit domain created event for FreeSWITCH sync
    this.eventEmitter.emit('domain.created', savedDomain);

    return savedDomain;
  }

  async findAll(query: DomainQueryDto = {}): Promise<{
    data: Domain[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      isActive,
      search,
      billingPlan,
      sortBy = 'name',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.domainRepository
      .createQueryBuilder('domain')
      .leftJoinAndSelect('domain.users', 'users');

    // Apply filters
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('domain.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(domain.name ILIKE :search OR domain.displayName ILIKE :search OR domain.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (billingPlan) {
      queryBuilder.andWhere('domain.billingPlan = :billingPlan', { billingPlan });
    }

    // Apply sorting
    queryBuilder.orderBy(`domain.${sortBy}`, sortOrder);

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

  async findOne(id: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return domain;
  }

  async findByName(name: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { name },
      relations: ['users'],
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return domain;
  }

  async update(id: string, updateDomainDto: UpdateDomainDto): Promise<Domain> {
    const domain = await this.findOne(id);
    Object.assign(domain, updateDomainDto);

    const updatedDomain = await this.domainRepository.save(domain);

    // Emit domain updated event for FreeSWITCH sync
    this.eventEmitter.emit('domain.updated', updatedDomain);

    return updatedDomain;
  }

  async remove(id: string): Promise<void> {
    const domain = await this.findOne(id);

    // TODO: Check if domain has users or extensions using services
    // For now, allow deletion - will implement proper checks later

    await this.domainRepository.remove(domain);

    // Emit domain deleted event for FreeSWITCH sync
    this.eventEmitter.emit('domain.deleted', domain);
  }

  async getDomainStats(id: string): Promise<{
    userCount: number;
    extensionCount: number;
    activeExtensions: number;
    registeredExtensions: number;
    isOverUserLimit: boolean;
    isOverExtensionLimit: boolean;
  }> {
    const domain = await this.findOne(id);

    // TODO: Implement using services to avoid circular dependency
    // For now, return basic stats
    return {
      userCount: 0,
      extensionCount: 0,
      activeExtensions: 0,
      registeredExtensions: 0,
      isOverUserLimit: false,
      isOverExtensionLimit: false,
    };
  }

  async getAllDomainStats(): Promise<{
    totalDomains: number;
    activeDomains: number;
    totalUsers: number;
    totalExtensions: number;
    byBillingPlan: Record<string, number>;
  }> {
    const domains = await this.domainRepository.find();

    const stats = {
      totalDomains: domains.length,
      activeDomains: domains.filter(d => d.isActive).length,
      totalUsers: 0, // TODO: Implement using services
      totalExtensions: 0, // TODO: Implement using services
      byBillingPlan: {} as Record<string, number>,
    };

    // Count by billing plan
    domains.forEach(domain => {
      const plan = domain.billingPlan || 'unknown';
      stats.byBillingPlan[plan] = (stats.byBillingPlan[plan] || 0) + 1;
    });

    return stats;
  }

  async toggleStatus(id: string): Promise<Domain> {
    const domain = await this.findOne(id);
    domain.isActive = !domain.isActive;

    const updatedDomain = await this.domainRepository.save(domain);

    // Emit domain status toggled event for FreeSWITCH sync
    this.eventEmitter.emit('domain.status.toggled', updatedDomain);

    return updatedDomain;
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<Domain> {
    const domain = await this.findOne(id);
    domain.settings = { ...domain.settings, ...settings };
    return this.domainRepository.save(domain);
  }

  async getDomainUsers(id: string): Promise<any[]> {
    // TODO: Implement using UsersService to avoid circular dependency
    return [];
  }

  async getDomainExtensions(id: string): Promise<any[]> {
    // TODO: Implement using ExtensionService to avoid circular dependency
    return [];
  }
}
