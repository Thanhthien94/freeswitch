import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeSwitchExtension, DirectorySettings, DialSettings, VoicemailSettings } from '../entities/freeswitch-extension.entity';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { FreeSwitchConfigType } from '../entities/freeswitch-config-version.entity';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import { FreeSwitchDirectorySyncService } from './freeswitch-directory-sync.service';
import * as crypto from 'crypto';

export interface CreateExtensionDto {
  extensionNumber: string;
  displayName?: string;
  description?: string;
  domainId?: any;
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
  domainId?: any;
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
    private readonly eslService: FreeSwitchEslService,
    private readonly directorySyncService: FreeSwitchDirectorySyncService,
  ) {}

  async create(createDto: any, createdBy?: number): Promise<FreeSwitchExtension> {
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

    const savedExtension = await this.extensionRepository.save(extension) as unknown as FreeSwitchExtension;

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.EXTENSION,
      savedExtension.id,
      savedExtension,
      savedExtension.getDirectoryXml(),
      'Initial extension created',
      createdBy
    );

    // Auto sync extension to FreeSWITCH directory with timeout
    try {
      const syncPromise = this.directorySyncService.syncExtensionToDirectory(savedExtension.id);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Directory sync timeout')), 10000)
      );

      const syncResult = await Promise.race([syncPromise, timeoutPromise]) as any;
      if (syncResult.success) {
        this.logger.log(`Extension ${savedExtension.extensionNumber} synced to FreeSWITCH directory`);
      } else {
        this.logger.warn(`Failed to sync extension ${savedExtension.extensionNumber}: ${syncResult.message}`);
      }
    } catch (error) {
      this.logger.error(`Error syncing extension ${savedExtension.extensionNumber}:`, error);
      // Continue without failing the entire operation
    }

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

  async findByNumber(extensionNumber: string, domainId?: any): Promise<FreeSwitchExtension> {
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

  async update(id: string, updateDto: any, updatedBy?: number): Promise<FreeSwitchExtension> {
    this.logger.log(`Updating extension: ${id}`);
    this.logger.log(`Update data: ${JSON.stringify(updateDto, null, 2)}`);

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
    const updatedExtension = await this.extensionRepository.save(extension) as unknown as any;

    // Create version record
    await this.versionService.createVersion(
      FreeSwitchConfigType.EXTENSION,
      updatedExtension.id,
      updatedExtension,
      updatedExtension.getDirectoryXml(),
      'Extension updated',
      updatedBy
    );

    // Auto sync extension to FreeSWITCH directory
    try {
      const syncResult = await this.directorySyncService.syncExtensionToDirectory(updatedExtension.id);
      if (syncResult.success) {
        this.logger.log(`Extension ${updatedExtension.extensionNumber} synced to FreeSWITCH directory`);
      } else {
        this.logger.warn(`Failed to sync extension ${updatedExtension.extensionNumber}: ${syncResult.message}`);
      }
    } catch (error) {
      this.logger.error(`Error syncing extension ${updatedExtension.extensionNumber}:`, error);
    }

    this.logger.log(`Extension updated successfully: ${id}`);
    return updatedExtension;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing extension: ${id}`);

    const extension = await this.findOne(id);

    // Remove from FreeSWITCH directory before removing from database with timeout
    try {
      const syncPromise = this.directorySyncService.removeExtensionFromDirectory(id);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Directory sync timeout')), 10000)
      );

      const syncResult = await Promise.race([syncPromise, timeoutPromise]) as any;
      if (syncResult.success) {
        this.logger.log(`Extension ${extension.extensionNumber} removed from FreeSWITCH directory`);
      } else {
        this.logger.warn(`Failed to remove extension ${extension.extensionNumber} from directory: ${syncResult.message}`);
      }
    } catch (error) {
      this.logger.error(`Error removing extension ${extension.extensionNumber} from directory:`, error);
      // Continue without failing the entire operation
    }

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
    domainId?: any,
    createdBy?: number
  ): Promise<FreeSwitchExtension> {
    const extensionData = FreeSwitchExtension.createBasicExtension(
      extensionNumber,
      displayName,
      password,
      domainId
    );

    return this.create(extensionData, createdBy);
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

  /**
   * Get extension call statistics
   */
  async getExtensionStats(id: string): Promise<{
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    missedCalls: number;
    averageDuration: number;
    totalDuration: number;
  }> {
    const extension = await this.findOne(id);

    try {
      // Get call statistics from FreeSWITCH via ESL
      const activeCalls = await this.eslService.getActiveCalls();

      // Filter calls for this extension
      const extensionCalls = activeCalls.calls?.filter(call =>
        call.callerNumber === extension.extensionNumber ||
        call.calleeNumber === extension.extensionNumber
      ) || [];

      // For now, return basic stats from active calls
      // In production, you'd query CDR database for historical data
      return {
        totalCalls: extensionCalls.length,
        inboundCalls: extensionCalls.filter(call => call.calleeNumber === extension.extensionNumber).length,
        outboundCalls: extensionCalls.filter(call => call.callerNumber === extension.extensionNumber).length,
        missedCalls: 0, // Would need CDR data
        averageDuration: extensionCalls.length > 0 ?
          extensionCalls.reduce((sum, call) => sum + call.duration, 0) / extensionCalls.length : 0,
        totalDuration: extensionCalls.reduce((sum, call) => sum + call.duration, 0),
      };
    } catch (error) {
      this.logger.error(`Failed to get extension stats for ${id}: ${error.message}`);
      return {
        totalCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        missedCalls: 0,
        averageDuration: 0,
        totalDuration: 0,
      };
    }
  }

  /**
   * Get extension call history
   */
  async getExtensionCalls(id: string): Promise<any[]> {
    const extension = await this.findOne(id);

    try {
      // Get active calls from FreeSWITCH
      const activeCalls = await this.eslService.getActiveCalls();

      // Filter calls for this extension
      const extensionCalls = activeCalls.calls?.filter(call =>
        call.callerNumber === extension.extensionNumber ||
        call.calleeNumber === extension.extensionNumber
      ) || [];

      // Transform to expected format
      return extensionCalls.map(call => ({
        uuid: call.uuid,
        direction: call.callerNumber === extension.extensionNumber ? 'outbound' : 'inbound',
        callerNumber: call.callerNumber,
        destinationNumber: call.calleeNumber,
        duration: call.duration,
        status: 'active',
        startTime: new Date().toISOString(), // Would need actual start time from CDR
      }));
    } catch (error) {
      this.logger.error(`Failed to get extension calls for ${id}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get extension registration status
   */
  async getExtensionRegistration(id: string): Promise<{
    isRegistered: boolean;
    lastRegistration?: string;
    registrationIp?: string;
    userAgent?: string;
    expires?: string;
  }> {
    const extension = await this.findOne(id);

    try {
      // Get registration status via ESL using show registrations command
      const command = `show registrations ${extension.extensionNumber}`;
      const result = await this.eslService.executeCommand(command);

      // Parse registration result - check if extension is in the output
      const lines = result.split('\n');
      const isRegistered = lines.some(line =>
        line.includes(extension.extensionNumber) &&
        line.includes(extension.domain?.name || 'localhost')
      );

      // Extract registration details if available
      let registrationIp: string | undefined;
      let userAgent: string | undefined;
      let expires: string | undefined;

      if (isRegistered) {
        // Find the registration line for this extension
        const regLine = lines.find(line =>
          line.includes(extension.extensionNumber) &&
          line.includes(extension.domain?.name || 'localhost')
        );

        if (regLine) {
          // Parse CSV format: reg_user,realm,token,url,expires,network_ip,network_port,network_proto,hostname,metadata
          const parts = regLine.split(',');
          if (parts.length >= 6) {
            registrationIp = parts[5]; // network_ip
            expires = new Date(parseInt(parts[4]) * 1000).toISOString(); // expires timestamp
          }
        }
      }

      return {
        isRegistered,
        lastRegistration: isRegistered ? new Date().toISOString() : undefined,
        registrationIp,
        userAgent,
        expires,
      };
    } catch (error) {
      this.logger.error(`Failed to get extension registration for ${id}: ${error.message}`);
      return {
        isRegistered: false,
      };
    }
  }

  /**
   * Reset extension password
   */
  async resetExtensionPassword(id: string, newPassword?: string, updatedBy?: number): Promise<{
    extension: FreeSwitchExtension;
    plainPassword: string;
  }> {
    const extension = await this.findOne(id);

    // Generate new password if not provided
    const plainPassword = newPassword || this.generateRandomPassword();

    // Update extension with new password
    await this.extensionRepository.update(id, {
      password: plainPassword,
      updatedBy,
      updatedAt: new Date(),
    });

    // Create version record
    const updatedExtension = await this.findOne(id);
    await this.versionService.createVersion(
      FreeSwitchConfigType.EXTENSION,
      id,
      updatedExtension,
      updatedExtension.getDirectoryXml(),
      'Password reset',
      updatedBy
    );

    // Reload XML to apply changes
    try {
      await this.eslService.reloadXmlConfig();
    } catch (error) {
      this.logger.warn(`Failed to reload XML after password reset: ${error.message}`);
    }

    return {
      extension: updatedExtension,
      plainPassword,
    };
  }

  /**
   * Test extension connection
   */
  async testExtensionConnection(id: string): Promise<{
    connected: boolean;
    message: string;
    details?: any;
  }> {
    const extension = await this.findOne(id);

    try {
      // Check registration status
      const registration = await this.getExtensionRegistration(id);

      if (registration.isRegistered) {
        return {
          connected: true,
          message: 'Extension is registered and connected',
          details: registration,
        };
      } else {
        return {
          connected: false,
          message: 'Extension is not registered',
          details: registration,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to test extension connection for ${id}: ${error.message}`);
      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Reboot extension (force re-registration)
   */
  async rebootExtension(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const extension = await this.findOne(id);

    try {
      // Force flush registration to make extension re-register
      const command = `sofia profile internal flush_inbound_reg ${extension.extensionNumber}@${extension.domain?.name || 'localhost'}`;
      await this.eslService.executeCommand(command);

      return {
        success: true,
        message: 'Extension reboot initiated - device will re-register',
      };
    } catch (error) {
      this.logger.error(`Failed to reboot extension ${id}: ${error.message}`);
      return {
        success: false,
        message: `Failed to reboot extension: ${error.message}`,
      };
    }
  }

  /**
   * Generate random password
   */
  generatePassword(): { password: string } {
    const password = this.generateRandomPassword();
    return { password };
  }

  /**
   * Update extension recording settings
   */
  async updateRecordingSettings(id: string, settings: {
    enabled?: boolean;
    mode?: string;
    format?: string;
    stereo?: boolean;
  }, updatedBy?: number): Promise<FreeSwitchExtension> {
    const extension = await this.findOne(id);

    // Update recording settings in directorySettings
    const directorySettings = extension.directorySettings || {};
    const recordingSettings = directorySettings.recording || {};

    if (settings.enabled !== undefined) {
      recordingSettings.enabled = settings.enabled;
    }
    if (settings.mode !== undefined) {
      recordingSettings.mode = settings.mode;
    }
    if (settings.format !== undefined) {
      recordingSettings.format = settings.format;
    }
    if (settings.stereo !== undefined) {
      recordingSettings.stereo = settings.stereo;
    }

    directorySettings.recording = recordingSettings;

    // Update extension
    return this.update(id, { directorySettings }, updatedBy);
  }

  /**
   * Update extension voicemail settings
   */
  async updateVoicemailSettings(id: string, settings: {
    enabled?: boolean;
    password?: string;
    email?: string;
    attachFile?: boolean;
    deleteFile?: boolean;
  }, updatedBy?: number): Promise<FreeSwitchExtension> {
    const extension = await this.findOne(id);

    // Update voicemail settings
    const voicemailSettings = extension.voicemailSettings || {};

    if (settings.enabled !== undefined) {
      voicemailSettings.enabled = settings.enabled;
    }
    if (settings.password !== undefined) {
      voicemailSettings.password = settings.password;
    }
    if (settings.email !== undefined) {
      voicemailSettings.email = settings.email;
    }
    if (settings.attachFile !== undefined) {
      voicemailSettings.attachFile = settings.attachFile;
    }
    if (settings.deleteFile !== undefined) {
      voicemailSettings.deleteFile = settings.deleteFile;
    }

    // Update extension
    return this.update(id, { voicemailSettings }, updatedBy);
  }

  /**
   * Update extension call forwarding settings
   */
  async updateCallForwardSettings(id: string, settings: {
    enabled?: boolean;
    destination?: string;
    onBusy?: boolean;
    onNoAnswer?: boolean;
    timeout?: number;
  }, updatedBy?: number): Promise<FreeSwitchExtension> {
    const extension = await this.findOne(id);

    // Update call forwarding settings in directorySettings
    const directorySettings = extension.directorySettings || {};
    const callForwardSettings = directorySettings.callForward || {};

    if (settings.enabled !== undefined) {
      callForwardSettings.enabled = settings.enabled;
    }
    if (settings.destination !== undefined) {
      callForwardSettings.destination = settings.destination;
    }
    if (settings.onBusy !== undefined) {
      callForwardSettings.onBusy = settings.onBusy;
    }
    if (settings.onNoAnswer !== undefined) {
      callForwardSettings.onNoAnswer = settings.onNoAnswer;
    }
    if (settings.timeout !== undefined) {
      callForwardSettings.timeout = settings.timeout;
    }

    directorySettings.callForward = callForwardSettings;

    // Update extension
    return this.update(id, { directorySettings }, updatedBy);
  }

  /**
   * Update extension Do Not Disturb settings
   */
  async updateDndSettings(id: string, settings: {
    enabled?: boolean;
  }, updatedBy?: number): Promise<FreeSwitchExtension> {
    const extension = await this.findOne(id);

    // Update DND settings in directorySettings
    const directorySettings = extension.directorySettings || {};
    const dndSettings = directorySettings.dnd || {};

    if (settings.enabled !== undefined) {
      dndSettings.enabled = settings.enabled;
    }

    directorySettings.dnd = dndSettings;

    // Update extension
    return this.update(id, { directorySettings }, updatedBy);
  }

  /**
   * Generate random password helper
   */
  private generateRandomPassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}
