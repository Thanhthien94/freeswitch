import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeSwitchConfig } from '../entities/freeswitch-config.entity';

export interface ConfigChangeLog {
  id: string;
  category: string;
  name: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: Date;
  change_reason?: string;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class ConfigAuditService {
  private readonly logger = new Logger(ConfigAuditService.name);

  constructor(
    @InjectRepository(FreeSwitchConfig)
    private readonly configRepository: Repository<FreeSwitchConfig>,
  ) {}

  /**
   * Log configuration change
   */
  async logConfigChange(
    config: FreeSwitchConfig,
    oldValue: string,
    newValue: string,
    changedBy: string,
    metadata?: {
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    const changeLog: ConfigChangeLog = {
      id: config.id,
      category: config.category,
      name: config.name,
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_at: new Date(),
      change_reason: metadata?.reason,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
    };

    // Log to application logs
    this.logger.log(
      `Config changed: ${config.category}.${config.name} from "${oldValue}" to "${newValue}" by ${changedBy}`,
      { changeLog },
    );

    // In a production system, you might want to store this in a separate audit table
    // For now, we'll just log it
  }

  /**
   * Log bulk configuration changes
   */
  async logBulkConfigChange(
    changes: Array<{
      config: FreeSwitchConfig;
      oldValue: string;
      newValue: string;
    }>,
    changedBy: string,
    metadata?: {
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    for (const change of changes) {
      await this.logConfigChange(
        change.config,
        change.oldValue,
        change.newValue,
        changedBy,
        metadata,
      );
    }

    this.logger.log(
      `Bulk config change: ${changes.length} configurations updated by ${changedBy}`,
    );
  }

  /**
   * Create configuration backup before changes
   */
  async createConfigBackup(category?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;

    let configs: FreeSwitchConfig[];
    if (category) {
      configs = await this.configRepository.find({
        where: { category, is_active: true },
      });
    } else {
      configs = await this.configRepository.find({
        where: { is_active: true },
      });
    }

    const backup = {
      id: backupId,
      created_at: new Date(),
      category: category || 'all',
      configs: configs.map(config => ({
        id: config.id,
        category: config.category,
        name: config.name,
        value: config.value,
        type: config.type,
        description: config.description,
      })),
    };

    // In production, store this in a backup table or file system
    this.logger.log(`Configuration backup created: ${backupId}`, { backup });

    return backupId;
  }

  /**
   * Validate configuration change
   */
  async validateConfigChange(
    config: FreeSwitchConfig,
    newValue: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!newValue || newValue.trim() === '') {
      errors.push('Value cannot be empty');
    }

    // Category-specific validation
    switch (config.category) {
      case 'network':
        errors.push(...this.validateNetworkConfig(config.name, newValue));
        break;
      case 'sip':
        errors.push(...this.validateSipConfig(config.name, newValue));
        break;
      case 'rtp':
        errors.push(...this.validateRtpConfig(config.name, newValue));
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateNetworkConfig(name: string, value: string): string[] {
    const errors: string[] = [];

    switch (name) {
      case 'external_ip':
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
          errors.push('Invalid IP address format');
        }
        break;
      case 'external_ip_mode':
        if (!['auto', 'stun', 'manual'].includes(value)) {
          errors.push('Invalid external IP mode');
        }
        break;
      case 'stun_server':
        if (!value.startsWith('stun:')) {
          errors.push('STUN server must start with "stun:"');
        }
        break;
    }

    return errors;
  }

  private validateSipConfig(name: string, value: string): string[] {
    const errors: string[] = [];

    if (name.includes('port')) {
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        errors.push('Port must be between 1024 and 65535');
      }
    }

    return errors;
  }

  private validateRtpConfig(name: string, value: string): string[] {
    const errors: string[] = [];

    if (name.includes('port')) {
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        errors.push('Port must be between 1024 and 65535');
      }
    }

    return errors;
  }
}
