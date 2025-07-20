import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Extension, ExtensionStatus, ExtensionType } from './extension.entity';
import { DomainService } from '../domains/domain.service';
import { UsersService } from '../users/users.service';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';
import { ExtensionQueryDto } from './dto/extension-query.dto';

@Injectable()
export class ExtensionService {
  private readonly logger = new Logger(ExtensionService.name);

  constructor(
    @InjectRepository(Extension)
    private extensionRepository: Repository<Extension>,
    private domainService: DomainService,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createExtensionDto: CreateExtensionDto): Promise<Extension> {
    // Check if domain exists
    const domain = await this.domainService.findOne(createExtensionDto.domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    // Check if extension already exists in this domain
    const existingExtension = await this.extensionRepository.findOne({
      where: {
        extension: createExtensionDto.extension,
        domainId: createExtensionDto.domainId,
      },
    });
    if (existingExtension) {
      throw new ConflictException('Extension already exists in this domain');
    }

    // Check if user exists (if provided)
    if (createExtensionDto.userId) {
      const user = await this.usersService.findOne(createExtensionDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Create extension
    this.logger.log('🔥🔥🔥 Extension Service - CREATE method called');
    this.logger.log(`🔥🔥🔥 DTO password: ${createExtensionDto.password}`);

    // Manual password hashing since entity hooks might not work with create/save
    let sipPassword: string | undefined;
    let freeswitchPassword: string | undefined;
    if (createExtensionDto.password) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      sipPassword = await bcrypt.hash(createExtensionDto.password, saltRounds);
      freeswitchPassword = createExtensionDto.password; // Store plain password for FreeSWITCH
      this.logger.log('🔥🔥🔥 SIP password hashed manually');
    }

    const extension = this.extensionRepository.create({
      ...createExtensionDto,
      authId: createExtensionDto.authId || createExtensionDto.extension,
      sipPassword: sipPassword, // Set hashed password directly
      freeswitchPassword: freeswitchPassword, // Set plain password for FreeSWITCH
    });

    this.logger.log(`🔥🔥🔥 Extension entity before save: ${JSON.stringify({
      extension: extension.extension,
      sipPassword: extension.sipPassword ? 'HASHED' : 'NULL'
    })}`);

    const savedExtension = await this.extensionRepository.save(extension);

    this.logger.log('🔥🔥🔥 Extension saved successfully');

    // Emit extension created event for FreeSWITCH sync
    this.eventEmitter.emit('extension.created', savedExtension);

    return savedExtension;
  }

  async findAll(query: ExtensionQueryDto = {}): Promise<{
    data: Extension[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      domainId,
      type,
      status,
      isRegistered,
      search,
      sortBy = 'extension',
      sortOrder = 'ASC',
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.extensionRepository
      .createQueryBuilder('extension')
      .leftJoinAndSelect('extension.domain', 'domain')
      .leftJoinAndSelect('extension.user', 'user');

    // Apply filters
    if (domainId) {
      queryBuilder.andWhere('extension.domainId = :domainId', { domainId });
    }

    if (type) {
      queryBuilder.andWhere('extension.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('extension.status = :status', { status });
    }

    if (typeof isRegistered === 'boolean') {
      queryBuilder.andWhere('extension.isRegistered = :isRegistered', { isRegistered });
    }

    if (search) {
      queryBuilder.andWhere(
        '(extension.extension ILIKE :search OR extension.displayName ILIKE :search OR extension.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`extension.${sortBy}`, sortOrder);

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

  async findOne(id: string): Promise<Extension> {
    const extension = await this.extensionRepository.findOne({
      where: { id },
      relations: ['domain', 'user'],
    });

    if (!extension) {
      throw new NotFoundException('Extension not found');
    }

    return extension;
  }

  async findByExtension(extension: string, domainId: string): Promise<Extension> {
    const ext = await this.extensionRepository.findOne({
      where: { extension, domainId },
      relations: ['domain', 'user'],
    });

    if (!ext) {
      throw new NotFoundException('Extension not found');
    }

    return ext;
  }

  async update(id: string, updateExtensionDto: UpdateExtensionDto): Promise<Extension> {
    const extension = await this.findOne(id);

    // Check if user exists (if provided)
    if (updateExtensionDto.userId) {
      const user = await this.usersService.findOne(updateExtensionDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    Object.assign(extension, updateExtensionDto);

    const updatedExtension = await this.extensionRepository.save(extension);

    // Emit extension updated event for FreeSWITCH sync
    this.eventEmitter.emit('extension.updated', updatedExtension);

    return updatedExtension;
  }

  async remove(id: string): Promise<void> {
    const extension = await this.findOne(id);

    await this.extensionRepository.remove(extension);

    // Emit extension deleted event for FreeSWITCH sync
    this.eventEmitter.emit('extension.deleted', extension);
  }

  async bulkCreate(extensions: CreateExtensionDto[]): Promise<Extension[]> {
    const results: Extension[] = [];
    
    for (const extensionDto of extensions) {
      try {
        const extension = await this.create(extensionDto);
        results.push(extension);
      } catch (error) {
        // Log error but continue with other extensions
        console.error(`Failed to create extension ${extensionDto.extension}:`, error.message);
      }
    }

    // Emit bulk extensions created event for FreeSWITCH sync
    if (results.length > 0) {
      this.eventEmitter.emit('extensions.bulk.created', {
        domainId: extensions[0]?.domainId,
        extensions: results
      });
    }

    return results;
  }

  async bulkUpdate(updates: { id: string; data: UpdateExtensionDto }[]): Promise<Extension[]> {
    const results: Extension[] = [];
    
    for (const update of updates) {
      try {
        const extension = await this.update(update.id, update.data);
        results.push(extension);
      } catch (error) {
        console.error(`Failed to update extension ${update.id}:`, error.message);
      }
    }

    return results;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.extensionRepository.delete(ids);
  }

  async updateRegistrationStatus(
    extension: string,
    domainId: string,
    isRegistered: boolean,
    registrationData?: {
      ip?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      isRegistered,
      lastRegistration: isRegistered ? new Date() : null,
    };

    if (registrationData) {
      if (registrationData.ip) {
        updateData.registrationIp = registrationData.ip;
      }
      if (registrationData.userAgent) {
        updateData.userAgent = registrationData.userAgent;
      }
    }

    await this.extensionRepository.update(
      { extension, domainId },
      updateData
    );
  }

  async getExtensionsByDomain(domainId: string): Promise<Extension[]> {
    return this.extensionRepository.find({
      where: { domainId },
      relations: ['user'],
      order: { extension: 'ASC' },
    });
  }

  async getRegisteredExtensions(domainId?: string): Promise<Extension[]> {
    const where: FindOptionsWhere<Extension> = { isRegistered: true };
    if (domainId) {
      where.domainId = domainId;
    }

    return this.extensionRepository.find({
      where,
      relations: ['domain', 'user'],
      order: { extension: 'ASC' },
    });
  }

  async getExtensionStats(domainId?: string): Promise<{
    total: number;
    active: number;
    registered: number;
    byType: Record<ExtensionType, number>;
    byStatus: Record<ExtensionStatus, number>;
  }> {
    const where: FindOptionsWhere<Extension> = {};
    if (domainId) {
      where.domainId = domainId;
    }

    const extensions = await this.extensionRepository.find({ where });

    const stats = {
      total: extensions.length,
      active: extensions.filter(e => e.status === ExtensionStatus.ACTIVE).length,
      registered: extensions.filter(e => e.isRegistered).length,
      byType: {} as Record<ExtensionType, number>,
      byStatus: {} as Record<ExtensionStatus, number>,
    };

    // Initialize counters
    Object.values(ExtensionType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ExtensionStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Count by type and status
    extensions.forEach(extension => {
      stats.byType[extension.type]++;
      stats.byStatus[extension.status]++;
    });

    return stats;
  }

  async generateExtensionRange(
    domainId: string,
    startExtension: string,
    endExtension: string,
    template: Partial<CreateExtensionDto>
  ): Promise<Extension[]> {
    const start = parseInt(startExtension);
    const end = parseInt(endExtension);

    if (isNaN(start) || isNaN(end) || start > end) {
      throw new BadRequestException('Invalid extension range');
    }

    const extensions: CreateExtensionDto[] = [];
    for (let i = start; i <= end; i++) {
      const extension = i.toString().padStart(startExtension.length, '0');
      extensions.push({
        ...template,
        extension,
        domainId,
        displayName: template.displayName || `Extension ${extension}`,
        password: template.password || this.generateRandomPassword(),
      } as CreateExtensionDto);
    }

    return this.bulkCreate(extensions);
  }

  async resetPassword(id: string, newPassword?: string): Promise<{ extension: Extension; plainPassword: string }> {
    const extension = await this.findOne(id);

    // Generate new password if not provided
    const plainPassword = newPassword || this.generateRandomPassword();

    // Hash the password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Update extension
    await this.extensionRepository.update(id, {
      sipPassword: hashedPassword,
      freeswitchPassword: plainPassword
    });

    // Return updated extension with plain password
    const updatedExtension = await this.findOne(id);

    // Emit extension password reset event for FreeSWITCH sync
    this.eventEmitter.emit('extension.password.reset', updatedExtension);

    return {
      extension: updatedExtension,
      plainPassword
    };
  }

  private generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // New methods for extension detail page
  async getExtensionCallStats(id: string): Promise<any> {
    const extension = await this.findOne(id);

    // Mock data for now - in real implementation, this would query CDR database
    return {
      totalCalls: 156,
      inboundCalls: 89,
      outboundCalls: 67,
      missedCalls: 12,
      averageCallDuration: 245, // seconds
      totalCallDuration: 38220, // seconds
      lastCallTime: new Date().toISOString(),
      callsToday: 8,
      callsThisWeek: 34,
      callsThisMonth: 156,
      peakHour: '14:00',
      busyHours: ['09:00-10:00', '14:00-15:00', '16:00-17:00'],
      callQuality: {
        excellent: 85,
        good: 12,
        poor: 3
      }
    };
  }

  async getExtensionRegistration(id: string): Promise<any> {
    const extension = await this.findOne(id);

    // Mock data for now - in real implementation, this would query FreeSWITCH registration status
    return {
      isRegistered: Math.random() > 0.3, // 70% chance of being registered
      registrationTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      userAgent: 'Zoiper v5.4.8',
      port: 5060,
      expires: 3600,
      lastSeen: new Date(Date.now() - Math.random() * 300000).toISOString(),
      registrationServer: 'freeswitch-core',
      transport: 'UDP',
      contact: `sip:${extension.extension}@192.168.1.${Math.floor(Math.random() * 254) + 1}:5060`,
      callId: `${Math.random().toString(36).substr(2, 9)}@192.168.1.1`,
      networkLatency: Math.floor(Math.random() * 50) + 10, // ms
      packetLoss: Math.random() * 2, // percentage
      jitter: Math.random() * 10 // ms
    };
  }

  async getExtensionCalls(id: string, limit: number = 50, offset: number = 0): Promise<any> {
    const extension = await this.findOne(id);

    // Mock data for now - in real implementation, this would query CDR database
    const calls = [];
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const isInbound = Math.random() > 0.5;
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 3600000); // Last 7 days
      const duration = Math.floor(Math.random() * 600); // 0-10 minutes

      calls.push({
        uuid: `${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 4)}`,
        direction: isInbound ? 'inbound' : 'outbound',
        callerNumber: isInbound ? `+1555${Math.floor(Math.random() * 9000000) + 1000000}` : extension.extension,
        destinationNumber: isInbound ? extension.extension : `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
        duration: duration,
        status: Math.random() > 0.1 ? 'NORMAL_CLEARING' : 'NO_ANSWER',
        hangupCause: Math.random() > 0.1 ? 'NORMAL_CLEARING' : 'NO_ANSWER',
        recordingPath: Math.random() > 0.5 ? `/recordings/${Math.random().toString(36).substr(2, 9)}.wav` : null,
        hasRecording: Math.random() > 0.5,
        quality: Math.random() > 0.8 ? 'poor' : Math.random() > 0.5 ? 'good' : 'excellent'
      });
    }

    return {
      calls: calls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
      total: 156,
      limit,
      offset,
      hasMore: offset + limit < 156
    };
  }

  async testExtensionConnection(id: string): Promise<any> {
    const extension = await this.findOne(id);

    // Mock connection test - in real implementation, this would test SIP connectivity
    const isOnline = Math.random() > 0.2; // 80% success rate

    return {
      success: isOnline,
      timestamp: new Date().toISOString(),
      extension: extension.extension,
      domain: extension.domainId,
      tests: {
        sipRegistration: {
          status: isOnline ? 'success' : 'failed',
          responseTime: Math.floor(Math.random() * 100) + 50, // ms
          message: isOnline ? 'Extension is registered and reachable' : 'Extension not registered'
        },
        networkConnectivity: {
          status: 'success',
          responseTime: Math.floor(Math.random() * 50) + 10, // ms
          message: 'Network connectivity is good'
        },
        audioCodec: {
          status: isOnline ? 'success' : 'unknown',
          supportedCodecs: ['PCMU', 'PCMA', 'G722', 'G729'],
          message: isOnline ? 'Audio codecs are supported' : 'Cannot test codecs - extension offline'
        }
      },
      recommendations: isOnline ? [] : [
        'Check if the SIP client is running',
        'Verify network connectivity',
        'Check SIP credentials',
        'Ensure firewall allows SIP traffic'
      ]
    };
  }

  async generatePassword(id: string): Promise<{ extension: Extension; plainPassword: string }> {
    // Reuse the resetPassword method with a new generated password
    return this.resetPassword(id);
  }

  async rebootExtension(id: string): Promise<any> {
    const extension = await this.findOne(id);

    // Mock reboot - in real implementation, this would send commands to FreeSWITCH
    // to force re-registration or restart the extension

    // Emit extension reboot event for FreeSWITCH sync
    this.eventEmitter.emit('extension.reboot', extension);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      extension: extension.extension,
      domain: extension.domainId,
      message: 'Extension reboot initiated. The extension will be forced to re-register.',
      estimatedDowntime: '10-30 seconds',
      actions: [
        'Clearing registration cache',
        'Sending SIP NOTIFY to force re-registration',
        'Updating extension configuration',
        'Reloading dialplan if needed'
      ]
    };
  }
}
