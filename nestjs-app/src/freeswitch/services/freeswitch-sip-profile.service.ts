import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FreeSwitchSipProfile, FreeSwitchProfileType } from '../entities/freeswitch-sip-profile.entity';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { FreeSwitchConfigType } from '../entities/freeswitch-config-version.entity';

export interface CreateSipProfileDto {
  name: string;
  displayName?: string;
  description?: string;
  type: FreeSwitchProfileType;
  domainId?: string;
  bindIp?: string;
  bindPort: number;
  tlsPort?: number;
  rtpIp?: string;
  extRtpIp?: string;
  extSipIp?: string;
  sipPort?: number;
  settings?: any;
  advancedSettings?: any;
  securitySettings?: any;
  codecSettings?: any;
  isActive?: boolean;
  isDefault?: boolean;
  order?: number;
}

export interface UpdateSipProfileDto extends Partial<CreateSipProfileDto> {}

export interface SipProfileQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: FreeSwitchProfileType;
  domainId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class FreeSwitchSipProfileService {
  private readonly logger = new Logger(FreeSwitchSipProfileService.name);

  constructor(
    @InjectRepository(FreeSwitchSipProfile)
    private readonly sipProfileRepository: Repository<FreeSwitchSipProfile>,
    private readonly versionService: FreeSwitchVersionService,
  ) {}

  async create(createDto: CreateSipProfileDto, createdBy?: string): Promise<FreeSwitchSipProfile> {
    this.logger.log(`Creating SIP profile: ${createDto.name}`);

    // Check if name already exists
    const existingProfile = await this.sipProfileRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingProfile) {
      throw new ConflictException(`SIP profile with name '${createDto.name}' already exists`);
    }

    // Check if port is already in use
    if (createDto.bindIp && createDto.bindPort) {
      const existingPort = await this.sipProfileRepository.findOne({
        where: { 
          bindIp: createDto.bindIp, 
          bindPort: createDto.bindPort 
        }
      });

      if (existingPort) {
        throw new ConflictException(`Port ${createDto.bindPort} is already in use on ${createDto.bindIp}`);
      }
    }

    // If this is set as default, unset other defaults
    if (createDto.isDefault) {
      await this.sipProfileRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    const sipProfile = this.sipProfileRepository.create({
      ...createDto,
      createdBy,
      updatedBy: createdBy,
    });

    const savedProfile = await this.sipProfileRepository.save(sipProfile);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.SIP_PROFILE,
      savedProfile.id,
      savedProfile,
      savedProfile.getXmlConfiguration(),
      'Initial SIP profile created',
      createdBy
    );

    this.logger.log(`SIP profile created successfully: ${savedProfile.id}`);
    return savedProfile;
  }

  async findAll(query: SipProfileQueryDto = {}): Promise<{
    data: FreeSwitchSipProfile[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      domainId,
      isActive,
      sortBy = 'order',
      sortOrder = 'ASC'
    } = query;

    const queryBuilder = this.sipProfileRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.domain', 'domain')
      .leftJoinAndSelect('profile.creator', 'creator')
      .leftJoinAndSelect('profile.gateways', 'gateways');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(profile.name ILIKE :search OR profile.displayName ILIKE :search OR profile.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('profile.type = :type', { type });
    }

    if (domainId) {
      queryBuilder.andWhere('profile.domainId = :domainId', { domainId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('profile.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const validSortFields = ['name', 'type', 'bindPort', 'order', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'order';
    queryBuilder.orderBy(`profile.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<FreeSwitchSipProfile> {
    const sipProfile = await this.sipProfileRepository.findOne({
      where: { id },
      relations: ['domain', 'creator', 'updater', 'gateways', 'extensions'],
    });

    if (!sipProfile) {
      throw new NotFoundException(`SIP profile with ID ${id} not found`);
    }

    return sipProfile;
  }

  async findByName(name: string): Promise<FreeSwitchSipProfile> {
    const sipProfile = await this.sipProfileRepository.findOne({
      where: { name },
      relations: ['domain', 'gateways', 'extensions'],
    });

    if (!sipProfile) {
      throw new NotFoundException(`SIP profile with name '${name}' not found`);
    }

    return sipProfile;
  }

  async update(id: string, updateDto: UpdateSipProfileDto, updatedBy?: string): Promise<FreeSwitchSipProfile> {
    this.logger.log(`Updating SIP profile: ${id}`);

    const sipProfile = await this.findOne(id);

    // Check if name is being changed and if it conflicts
    if (updateDto.name && updateDto.name !== sipProfile.name) {
      const existingProfile = await this.sipProfileRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingProfile) {
        throw new ConflictException(`SIP profile with name '${updateDto.name}' already exists`);
      }
    }

    // Check if port is being changed and if it conflicts
    if (updateDto.bindIp && updateDto.bindPort && 
        (updateDto.bindIp !== sipProfile.bindIp || updateDto.bindPort !== sipProfile.bindPort)) {
      const existingPort = await this.sipProfileRepository.findOne({
        where: { 
          bindIp: updateDto.bindIp, 
          bindPort: updateDto.bindPort 
        }
      });

      if (existingPort && existingPort.id !== id) {
        throw new ConflictException(`Port ${updateDto.bindPort} is already in use on ${updateDto.bindIp}`);
      }
    }

    // If this is being set as default, unset other defaults
    if (updateDto.isDefault && !sipProfile.isDefault) {
      await this.sipProfileRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    // Update the profile
    Object.assign(sipProfile, updateDto, { updatedBy });
    const updatedProfile = await this.sipProfileRepository.save(sipProfile);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.SIP_PROFILE,
      updatedProfile.id,
      updatedProfile,
      updatedProfile.getXmlConfiguration(),
      'SIP profile updated',
      updatedBy
    );

    this.logger.log(`SIP profile updated successfully: ${id}`);
    return updatedProfile;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing SIP profile: ${id}`);

    const sipProfile = await this.findOne(id);

    // Check if profile has gateways
    if (sipProfile.gateways && sipProfile.gateways.length > 0) {
      throw new ConflictException('Cannot delete SIP profile that has gateways. Delete gateways first.');
    }

    // Check if profile has extensions
    if (sipProfile.extensions && sipProfile.extensions.length > 0) {
      throw new ConflictException('Cannot delete SIP profile that has extensions. Delete extensions first.');
    }

    await this.sipProfileRepository.remove(sipProfile);
    this.logger.log(`SIP profile removed successfully: ${id}`);
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<FreeSwitchProfileType, number>;
    active: number;
    inactive: number;
  }> {
    const [total, internal, external, custom, active] = await Promise.all([
      this.sipProfileRepository.count(),
      this.sipProfileRepository.count({ where: { type: FreeSwitchProfileType.INTERNAL } }),
      this.sipProfileRepository.count({ where: { type: FreeSwitchProfileType.EXTERNAL } }),
      this.sipProfileRepository.count({ where: { type: FreeSwitchProfileType.CUSTOM } }),
      this.sipProfileRepository.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      byType: {
        [FreeSwitchProfileType.INTERNAL]: internal,
        [FreeSwitchProfileType.EXTERNAL]: external,
        [FreeSwitchProfileType.CUSTOM]: custom,
      },
      active,
      inactive: total - active,
    };
  }

  async getDefaultProfile(): Promise<FreeSwitchSipProfile | null> {
    return this.sipProfileRepository.findOne({
      where: { isDefault: true },
      relations: ['domain', 'gateways'],
    });
  }

  async setDefault(id: string): Promise<FreeSwitchSipProfile> {
    const sipProfile = await this.findOne(id);

    // Unset current default
    await this.sipProfileRepository.update(
      { isDefault: true },
      { isDefault: false }
    );

    // Set new default
    sipProfile.isDefault = true;
    return this.sipProfileRepository.save(sipProfile);
  }

  async generateXml(id: string): Promise<string> {
    const sipProfile = await this.findOne(id);
    return sipProfile.getXmlConfiguration();
  }
}
