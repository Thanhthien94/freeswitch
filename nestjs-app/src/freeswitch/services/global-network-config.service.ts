import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalNetworkConfig, NetworkConfigStatus } from '../entities/global-network-config.entity';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CreateGlobalNetworkConfigDto {
  configName?: string;
  displayName?: string;
  description?: string;
  externalIp?: string;
  bindServerIp?: string;
  domain?: string;
  sipPort?: number;
  externalSipPort?: number;
  tlsPort?: number;
  externalTlsPort?: number;
  rtpStartPort?: number;
  rtpEndPort?: number;
  externalRtpIp?: string;
  stunServer?: string;
  stunEnabled?: boolean;
  globalCodecPrefs?: string;
  outboundCodecPrefs?: string;
  transportProtocols?: string[];
  enableTls?: boolean;
  natDetection?: boolean;
  autoNat?: boolean;
  autoApply?: boolean;
  metadata?: any;
  tags?: any;
}

export interface UpdateGlobalNetworkConfigDto extends Partial<CreateGlobalNetworkConfigDto> {
  lastAppliedAt?: Date;
  lastAppliedBy?: string;
}

export interface NetworkConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApplyConfigResult {
  success: boolean;
  message: string;
  errors?: string[];
  appliedAt: Date;
  configBackup?: string;
}

export interface ExternalIpDetectionResult {
  detectedIp: string;
  method: 'stun' | 'http' | 'manual';
  success: boolean;
  error?: string;
}

@Injectable()
export class GlobalNetworkConfigService {
  private readonly logger = new Logger(GlobalNetworkConfigService.name);
  private readonly freeswitchConfigPath = process.env.FREESWITCH_CONFIG_PATH || '/etc/freeswitch';

  constructor(
    @InjectRepository(GlobalNetworkConfig)
    private readonly globalNetworkConfigRepository: Repository<GlobalNetworkConfig>,
    private readonly eslService: FreeSwitchEslService,
  ) {}

  /**
   * Get current global network configuration (singleton pattern)
   */
  async findConfig(): Promise<GlobalNetworkConfig> {
    this.logger.log('Fetching global network configuration');

    let config = await this.globalNetworkConfigRepository.findOne({
      where: { isActive: true, isDefault: true },
      order: { createdAt: 'ASC' },
    });

    if (!config) {
      this.logger.log('No global network config found, creating default configuration');
      config = await this.createDefaultConfig();
    }

    return config;
  }

  /**
   * Update global network configuration
   */
  async updateConfig(
    updateDto: UpdateGlobalNetworkConfigDto,
    updatedBy?: string,
  ): Promise<GlobalNetworkConfig> {
    this.logger.log('Updating global network configuration');

    const config = await this.findConfig();
    
    // Update fields
    Object.assign(config, updateDto);
    config.updatedBy = updatedBy;
    config.status = NetworkConfigStatus.PENDING;

    // Validate configuration
    const validationResult = await this.validateConfig(config);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
    }

    const savedConfig = await this.globalNetworkConfigRepository.save(config);

    // Auto-apply if enabled
    if (savedConfig.autoApply) {
      await this.applyConfig(savedConfig.id, updatedBy);
    }

    return savedConfig;
  }

  /**
   * Validate network configuration
   */
  async validateConfig(config: GlobalNetworkConfig): Promise<NetworkConfigValidationResult> {
    this.logger.debug('Validating network configuration');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Use entity validation methods
    errors.push(...config.validate());

    // Additional business logic validation
    if (config.rtpEndPort - config.rtpStartPort < 100) {
      warnings.push('RTP port range is less than 100 ports, may cause issues with concurrent calls');
    }

    // Check for port conflicts
    const portConflicts = await this.checkPortConflicts(config);
    errors.push(...portConflicts);

    // Validate STUN server if enabled
    if (config.stunEnabled) {
      const stunValidation = await this.validateStunServer(config.stunServer);
      if (!stunValidation.success) {
        warnings.push(`STUN server validation failed: ${stunValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply configuration to FreeSWITCH
   */
  async applyConfig(configId: number, appliedBy?: string): Promise<ApplyConfigResult> {
    this.logger.log(`Applying network configuration: ${configId}`);

    try {
      const config = await this.globalNetworkConfigRepository.findOne({
        where: { id: configId },
      });

      if (!config) {
        throw new NotFoundException('Network configuration not found');
      }

      // Validate before applying
      const validationResult = await this.validateConfig(config);
      if (!validationResult.isValid) {
        throw new BadRequestException(`Cannot apply invalid configuration: ${validationResult.errors.join(', ')}`);
      }

      // Create backup of current configuration
      const backup = await this.createConfigBackup();

      try {
        // Generate and write vars.xml
        await this.syncToFreeSwitchXml(config);

        // Reload FreeSWITCH configuration
        await this.reloadFreeSwitchConfig();

        // Update status
        config.status = NetworkConfigStatus.ACTIVE;
        config.lastAppliedAt = new Date();
        config.lastAppliedBy = appliedBy;
        await this.globalNetworkConfigRepository.save(config);

        this.logger.log('Network configuration applied successfully');

        return {
          success: true,
          message: 'Network configuration applied successfully',
          appliedAt: config.lastAppliedAt,
          configBackup: backup,
        };

      } catch (applyError) {
        this.logger.error(`Failed to apply configuration: ${applyError.message}`);
        
        // Attempt to restore backup
        try {
          await this.restoreConfigBackup(backup);
          await this.reloadFreeSwitchConfig();
        } catch (restoreError) {
          this.logger.error(`Failed to restore backup: ${restoreError.message}`);
        }

        config.status = NetworkConfigStatus.ERROR;
        await this.globalNetworkConfigRepository.save(config);

        return {
          success: false,
          message: 'Failed to apply configuration, backup restored',
          errors: [applyError.message],
          appliedAt: new Date(),
          configBackup: backup,
        };
      }

    } catch (error) {
      this.logger.error(`Error applying configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect external IP address
   */
  async detectExternalIp(): Promise<ExternalIpDetectionResult> {
    this.logger.log('Detecting external IP address');

    try {
      // Try STUN first
      const stunResult = await this.detectIpViaStun();
      if (stunResult.success) {
        return stunResult;
      }

      // Fallback to HTTP service
      const httpResult = await this.detectIpViaHttp();
      if (httpResult.success) {
        return httpResult;
      }

      return {
        detectedIp: '',
        method: 'manual',
        success: false,
        error: 'Failed to detect external IP via STUN and HTTP methods',
      };

    } catch (error) {
      this.logger.error(`Error detecting external IP: ${error.message}`);
      return {
        detectedIp: '',
        method: 'manual',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync configuration to FreeSWITCH XML files
   */
  async syncToFreeSwitchXml(config: GlobalNetworkConfig): Promise<void> {
    this.logger.log('Syncing configuration to FreeSWITCH XML files');

    try {
      // Generate vars.xml content
      const varsXmlContent = this.generateVarsXml(config);
      
      // Write to vars.xml (FreeSWITCH loads from autoload_configs directory)
      const varsXmlPath = path.join(this.freeswitchConfigPath, 'autoload_configs', 'vars.xml');
      await fs.writeFile(varsXmlPath, varsXmlContent, 'utf8');

      this.logger.log('Successfully synced configuration to FreeSWITCH XML files');

    } catch (error) {
      this.logger.error(`Failed to sync configuration to XML: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods
  private async createDefaultConfig(): Promise<GlobalNetworkConfig> {
    const defaultConfig = this.globalNetworkConfigRepository.create({
      configName: 'default',
      displayName: 'Default Network Configuration',
      description: 'Default global network configuration for FreeSWITCH',
      isDefault: true,
      isActive: true,
      status: NetworkConfigStatus.ACTIVE,
    });

    return await this.globalNetworkConfigRepository.save(defaultConfig);
  }

  private async checkPortConflicts(config: GlobalNetworkConfig): Promise<string[]> {
    const errors: string[] = [];
    
    // Check if ports are in use (simplified check)
    const portsToCheck = [config.sipPort, config.tlsPort];
    
    for (const port of portsToCheck) {
      try {
        const { stdout } = await execAsync(`netstat -ln | grep :${port}`);
        if (stdout.trim()) {
          errors.push(`Port ${port} is already in use`);
        }
      } catch (error) {
        // Port is likely free if netstat fails to find it
      }
    }

    return errors;
  }

  private async validateStunServer(stunServer: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple STUN server validation (could be enhanced)
      if (!stunServer.startsWith('stun:')) {
        return { success: false, error: 'STUN server must start with stun:' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async detectIpViaStun(): Promise<ExternalIpDetectionResult> {
    try {
      // This would require a STUN client implementation
      // For now, return a placeholder
      return {
        detectedIp: '',
        method: 'stun',
        success: false,
        error: 'STUN detection not implemented yet',
      };
    } catch (error) {
      return {
        detectedIp: '',
        method: 'stun',
        success: false,
        error: error.message,
      };
    }
  }

  private async detectIpViaHttp(): Promise<ExternalIpDetectionResult> {
    try {
      const { stdout } = await execAsync('curl -s https://api.ipify.org');
      const ip = stdout.trim();
      
      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return {
          detectedIp: ip,
          method: 'http',
          success: true,
        };
      }

      return {
        detectedIp: '',
        method: 'http',
        success: false,
        error: 'Invalid IP format received',
      };
    } catch (error) {
      return {
        detectedIp: '',
        method: 'http',
        success: false,
        error: error.message,
      };
    }
  }

  private async createConfigBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `/tmp/freeswitch-config-backup-${timestamp}`;
    
    try {
      await execAsync(`cp -r ${this.freeswitchConfigPath} ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to create config backup: ${error.message}`);
      throw error;
    }
  }

  private async restoreConfigBackup(backupPath: string): Promise<void> {
    try {
      await execAsync(`cp -r ${backupPath}/* ${this.freeswitchConfigPath}/`);
      this.logger.log('Configuration backup restored successfully');
    } catch (error) {
      this.logger.error(`Failed to restore config backup: ${error.message}`);
      throw error;
    }
  }

  private async reloadFreeSwitchConfig(): Promise<void> {
    try {
      await this.eslService.executeCommand('reloadxml');
      this.logger.log('FreeSWITCH configuration reloaded successfully');
    } catch (error) {
      this.logger.error(`Failed to reload FreeSWITCH config: ${error.message}`);
      throw error;
    }
  }

  private generateVarsXml(config: GlobalNetworkConfig): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <!-- Global Network Configuration - Auto-generated from Database -->
  <!-- Generated at: ${new Date().toISOString()} -->
  <!-- Config ID: ${config.id} - ${config.configName} -->
  
  ${config.generateVarsXmlConfig()}
  
  <!-- Additional Variables -->
  <X-PRE-PROCESS cmd="set" data="unroll_loops=true"/>
  <X-PRE-PROCESS cmd="set" data="outbound_caller_id_name=FreeSWITCH"/>
  <X-PRE-PROCESS cmd="set" data="outbound_caller_id_number=0000000000"/>
</include>`;
  }
}
