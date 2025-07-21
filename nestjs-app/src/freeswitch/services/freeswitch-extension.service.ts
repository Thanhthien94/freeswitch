import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeSwitchExtension, DirectorySettings, DialSettings, VoicemailSettings } from '../entities/freeswitch-extension.entity';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { FreeSwitchConfigType } from '../entities/freeswitch-config-version.entity';

export interface CreateExtensionDto {
  extensionNumber: string;
  displayName?: string;
  description?: string;
  domainId?: string;
  userId?: number;
  profileId?: string;
  password?: string;
  effectiveCallerIdName?: string;
  effectiveCallerIdNumber?: string;
  outboundCallerIdName?: string;
  outboundCallerIdNumber?: string;
  directorySettings?: DirectorySettings;
  dialSettings?: DialSettings;
  voicemailSettings?: VoicemailSettings;
  isActive?: boolean;
}

export interface UpdateExtensionDto extends Partial<CreateExtensionDto> {}

export interface ExtensionQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  userId?: number;
  profileId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class FreeSwitchExtensionService {
  private readonly logger = new Logger(FreeSwitchExtensionService.name);

  constructor(
    @InjectRepository(FreeSwitchExtension)
    private readonly extensionRepository: Repository<FreeSwitchExtension>,
    private readonly versionService: FreeSwitchVersionService,
  ) {}

  async create(createDto: CreateExtensionDto, createdBy?: number): Promise<FreeSwitchExtension> {
    this.logger.log(`Creating extension: ${createDto.extensionNumber}`);

    // Check if extension number already exists in the same domain
    const existingExtension = await this.extensionRepository.findOne({
      where: { 
        extensionNumber: createDto.extensionNumber,
        domainId: createDto.domainId 
      }
    });

    if (existingExtension) {
      throw new ConflictException(`Extension ${createDto.extensionNumber} already exists in this domain`);
    }

    // Validate extension before creating
    const validation = this.validateExtension(createDto);
    if (!validation.isValid) {
      throw new ConflictException(`Invalid extension: ${validation.errors.join(', ')}`);
    }

    const extension = this.extensionRepository.create({
      ...createDto,
      createdBy,
      updatedBy: createdBy,
    });

    const savedExtension = await this.extensionRepository.save(extension);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.EXTENSION,
      savedExtension.id,
      savedExtension,
      savedExtension.getDirectoryXml(),
      'Initial extension created',
      createdBy
    );

    this.logger.log(`Extension created successfully: ${savedExtension.id}`);
    return savedExtension;
  }

  async findAll(query: ExtensionQueryDto = {}): Promise<{
    data: FreeSwitchExtension[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      domainId,
      userId,
      profileId,
      isActive,
      sortBy = 'extensionNumber',
      sortOrder = 'ASC'
    } = query;

    const queryBuilder = this.extensionRepository.createQueryBuilder('extension')
      .leftJoinAndSelect('extension.domain', 'domain')
      .leftJoinAndSelect('extension.user', 'user')
      .leftJoinAndSelect('extension.profile', 'profile')
      .leftJoinAndSelect('extension.creator', 'creator');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(extension.extensionNumber ILIKE :search OR extension.displayName ILIKE :search OR extension.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (domainId) {
      queryBuilder.andWhere('extension.domainId = :domainId', { domainId });
    }

    if (userId) {
      queryBuilder.andWhere('extension.userId = :userId', { userId });
    }

    if (profileId) {
      queryBuilder.andWhere('extension.profileId = :profileId', { profileId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('extension.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const validSortFields = ['extensionNumber', 'displayName', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'extensionNumber';
    queryBuilder.orderBy(`extension.${sortField}`, sortOrder);

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

  async findOne(id: string): Promise<FreeSwitchExtension> {
    const extension = await this.extensionRepository.findOne({
      where: { id },
      relations: ['domain', 'user', 'profile', 'creator', 'updater'],
    });

    if (!extension) {
      throw new NotFoundException(`Extension with ID ${id} not found`);
    }

    return extension;
  }

  async findByNumber(extensionNumber: string, domainId?: string): Promise<FreeSwitchExtension> {
    const where: any = { extensionNumber };
    if (domainId) {
      where.domainId = domainId;
    }

    const extension = await this.extensionRepository.findOne({
      where,
      relations: ['domain', 'user', 'profile'],
    });

    if (!extension) {
      throw new NotFoundException(`Extension ${extensionNumber} not found`);
    }

    return extension;
  }

  async findByUser(userId: number): Promise<FreeSwitchExtension[]> {
    return this.extensionRepository.find({
      where: { userId, isActive: true },
      relations: ['domain', 'profile'],
      order: { extensionNumber: 'ASC' },
    });
  }

  async findByDomain(domainId: string): Promise<FreeSwitchExtension[]> {
    return this.extensionRepository.find({
      where: { domainId, isActive: true },
      relations: ['user', 'profile'],
      order: { extensionNumber: 'ASC' },
    });
  }

  async update(id: string, updateDto: UpdateExtensionDto, updatedBy?: number): Promise<FreeSwitchExtension> {
    this.logger.log(`Updating extension: ${id}`);

    const extension = await this.findOne(id);

    // Check if extension number is being changed and if it conflicts
    if (updateDto.extensionNumber && updateDto.extensionNumber !== extension.extensionNumber) {
      const existingExtension = await this.extensionRepository.findOne({
        where: { 
          extensionNumber: updateDto.extensionNumber,
          domainId: updateDto.domainId || extension.domainId
        }
      });

      if (existingExtension && existingExtension.id !== id) {
        throw new ConflictException(`Extension ${updateDto.extensionNumber} already exists in this domain`);
      }
    }

    // Validate updated extension
    const mergedData = { ...extension, ...updateDto };
    const validation = this.validateExtension(mergedData);
    if (!validation.isValid) {
      throw new ConflictException(`Invalid extension: ${validation.errors.join(', ')}`);
    }

    // Update the extension
    Object.assign(extension, updateDto, { updatedBy });
    const updatedExtension = await this.extensionRepository.save(extension);

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.EXTENSION,
      updatedExtension.id,
      updatedExtension,
      updatedExtension.getDirectoryXml(),
      'Extension updated',
      updatedBy
    );

    this.logger.log(`Extension updated successfully: ${id}`);
    return updatedExtension;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing extension: ${id}`);

    const extension = await this.findOne(id);
    await this.extensionRepository.remove(extension);
    
    this.logger.log(`Extension removed successfully: ${id}`);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withVoicemail: number;
    withCallForwarding: number;
    byDomain: Record<string, number>;
  }> {
    const [total, active, extensions] = await Promise.all([
      this.extensionRepository.count(),
      this.extensionRepository.count({ where: { isActive: true } }),
      this.extensionRepository.find({ relations: ['domain'] }),
    ]);

    const withVoicemail = extensions.filter(ext => ext.hasVoicemail()).length;
    const withCallForwarding = extensions.filter(ext => ext.isCallForwardingEnabled()).length;
    
    const byDomain = extensions.reduce((acc, extension) => {
      const domainName = extension.domain?.name || 'Unknown';
      acc[domainName] = (acc[domainName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive: total - active,
      withVoicemail,
      withCallForwarding,
      byDomain,
    };
  }

  async generateDirectoryXml(domainName: string): Promise<string> {
    const extensions = await this.extensionRepository.find({
      where: { isActive: true },
      relations: ['domain'],
    });

    const domainExtensions = extensions.filter(ext => 
      ext.domain?.name === domainName
    );

    const usersXml = domainExtensions
      .map(extension => extension.getDirectoryXml())
      .join('\n');

    return `
  <domain name="${domainName}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=${'$' + '{domain_name}'}:presence_id=${'$' + '{dialed_user}'}@${'$' + '{dialed_domain}'}}user/${'$' + '{dialed_user}'}@${'$' + '{dialed_domain}'}"/>
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <param name="jsonrpc-allowed-event-channels" value="demo,conference,presence"/>
    </params>
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="${'$' + '{default_provider}'}"/>
      <variable name="default_areacode" value="${'$' + '{default_areacode}'}"/>
      <variable name="transfer_fallback_extension" value="operator"/>
    </variables>
    <groups>
      <group name="default">
        <users>
          ${usersXml}
        </users>
      </group>
    </groups>
  </domain>`;
  }

  async createBasicExtension(
    extensionNumber: string,
    displayName: string,
    password: string,
    domainId?: string,
    createdBy?: number
  ): Promise<FreeSwitchExtension> {
    const extensionData = FreeSwitchExtension.createBasicExtension(
      extensionNumber,
      displayName,
      password,
      domainId
    );

    return this.create(extensionData as CreateExtensionDto, createdBy);
  }

  private validateExtension(data: Partial<CreateExtensionDto>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.extensionNumber) {
      errors.push('Extension number is required');
    } else if (!/^[0-9]{3,10}$/.test(data.extensionNumber)) {
      errors.push('Extension number must be 3-10 digits');
    }

    if (!data.password || data.password.length < 4) {
      errors.push('Password must be at least 4 characters');
    }

    if (data.voicemailSettings?.enabled && data.voicemailSettings?.email_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.voicemailSettings.email_address)) {
        errors.push('Invalid email address for voicemail');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async generateXml(id: string): Promise<string> {
    const extension = await this.findOne(id);
    return extension.getDirectoryXml();
  }
}
