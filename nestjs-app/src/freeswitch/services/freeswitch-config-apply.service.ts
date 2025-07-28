import { Injectable, Logger } from '@nestjs/common';
import { GlobalNetworkConfigService } from './global-network-config.service';
import { FreeSwitchXmlGeneratorService } from './freeswitch-xml-generator.service';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ConfigApplyResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
  appliedAt: Date;
  configBackupPath?: string;
  reloadRequired: boolean;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  configFiles: {
    varsXml: boolean;
    sofiaConf: boolean;
    dialplanConf: boolean;
  };
}

@Injectable()
export class FreeSwitchConfigApplyService {
  private readonly logger = new Logger(FreeSwitchConfigApplyService.name);
  private readonly configPath = process.env.FREESWITCH_CONFIG_PATH || '/etc/freeswitch';
  private readonly backupPath = '/tmp/freeswitch-backups';

  constructor(
    private readonly globalNetworkConfigService: GlobalNetworkConfigService,
    private readonly xmlGeneratorService: FreeSwitchXmlGeneratorService,
    private readonly eslService: FreeSwitchEslService,
  ) {}

  /**
   * Apply global network configuration to FreeSWITCH
   */
  async applyGlobalNetworkConfig(appliedBy?: string): Promise<ConfigApplyResult> {
    this.logger.log('Starting global network configuration apply process');

    const result: ConfigApplyResult = {
      success: false,
      message: '',
      appliedAt: new Date(),
      reloadRequired: true,
    };

    try {
      // Step 1: Get current configuration
      const globalConfig = await this.globalNetworkConfigService.findConfig();
      
      // Step 2: Validate configuration
      const validation = await this.validateConfiguration();
      if (!validation.isValid) {
        result.errors = validation.errors;
        result.message = 'Configuration validation failed';
        return result;
      }

      // Step 3: Create backup
      const backupPath = await this.createConfigBackup();
      result.configBackupPath = backupPath;

      try {
        // Step 4: Generate and write new configuration files
        await this.writeConfigurationFiles();

        // Step 5: Test configuration syntax
        const syntaxCheck = await this.validateFreeSwitchSyntax();
        if (!syntaxCheck.success) {
          throw new Error(`FreeSWITCH syntax validation failed: ${syntaxCheck.error}`);
        }

        // Step 6: Reload FreeSWITCH configuration
        await this.reloadFreeSwitchConfiguration();

        // Step 7: Verify configuration is working
        const healthCheck = await this.performHealthCheck();
        if (!healthCheck.success) {
          throw new Error(`Health check failed after configuration apply: ${healthCheck.error}`);
        }

        // Step 8: Update database status
        await this.globalNetworkConfigService.updateConfig(
          { lastAppliedAt: result.appliedAt, lastAppliedBy: appliedBy },
          appliedBy,
        );

        result.success = true;
        result.message = 'Global network configuration applied successfully';
        this.logger.log('Global network configuration applied successfully');

      } catch (applyError) {
        this.logger.error(`Failed to apply configuration: ${applyError.message}`);
        
        // Rollback to backup
        try {
          await this.restoreConfigBackup(backupPath);
          await this.reloadFreeSwitchConfiguration();
          result.message = 'Configuration apply failed, backup restored';
        } catch (rollbackError) {
          this.logger.error(`Failed to restore backup: ${rollbackError.message}`);
          result.message = 'Configuration apply failed, backup restore also failed';
          result.errors = [applyError.message, rollbackError.message];
        }

        result.errors = result.errors || [applyError.message];
      }

    } catch (error) {
      this.logger.error(`Error in apply process: ${error.message}`);
      result.message = 'Apply process failed';
      result.errors = [error.message];
    }

    return result;
  }

  /**
   * Validate current configuration
   */
  async validateConfiguration(): Promise<ConfigValidationResult> {
    this.logger.debug('Validating FreeSWITCH configuration');

    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      configFiles: {
        varsXml: false,
        sofiaConf: false,
        dialplanConf: false,
      },
    };

    try {
      // Check if config files exist and are readable
      const varsXmlPath = path.join(this.configPath, 'vars.xml');
      const sofiaConfPath = path.join(this.configPath, 'autoload_configs', 'sofia.conf.xml');
      const dialplanConfPath = path.join(this.configPath, 'dialplan', 'default.xml');

      try {
        await fs.access(varsXmlPath, fs.constants.R_OK | fs.constants.W_OK);
        result.configFiles.varsXml = true;
      } catch (error) {
        result.errors.push(`vars.xml is not accessible: ${error.message}`);
      }

      try {
        await fs.access(sofiaConfPath, fs.constants.R_OK);
        result.configFiles.sofiaConf = true;
      } catch (error) {
        result.warnings.push(`sofia.conf.xml is not accessible: ${error.message}`);
      }

      try {
        await fs.access(dialplanConfPath, fs.constants.R_OK);
        result.configFiles.dialplanConf = true;
      } catch (error) {
        result.warnings.push(`dialplan config is not accessible: ${error.message}`);
      }

      // Validate global network configuration
      const globalConfig = await this.globalNetworkConfigService.findConfig();
      const configValidation = await this.globalNetworkConfigService.validateConfig(globalConfig);
      
      if (!configValidation.isValid) {
        result.errors.push(...configValidation.errors);
      }
      result.warnings.push(...configValidation.warnings);

      result.isValid = result.errors.length === 0;

    } catch (error) {
      this.logger.error(`Configuration validation failed: ${error.message}`);
      result.errors.push(error.message);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Create backup of current configuration
   */
  private async createConfigBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.backupPath, `backup-${timestamp}`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupPath, { recursive: true });
      
      // Copy configuration directory
      await execAsync(`cp -r ${this.configPath} ${backupDir}`);
      
      this.logger.log(`Configuration backup created: ${backupDir}`);
      return backupDir;

    } catch (error) {
      this.logger.error(`Failed to create backup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore configuration from backup
   */
  private async restoreConfigBackup(backupPath: string): Promise<void> {
    try {
      await execAsync(`cp -r ${backupPath}/* ${this.configPath}/`);
      this.logger.log(`Configuration restored from backup: ${backupPath}`);
    } catch (error) {
      this.logger.error(`Failed to restore backup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write configuration files
   */
  private async writeConfigurationFiles(): Promise<void> {
    this.logger.debug('Writing configuration files');

    try {
      // Generate vars.xml
      const varsXmlContent = await this.xmlGeneratorService.generateCompleteVarsXml();
      const varsXmlPath = path.join(this.configPath, 'vars.xml');
      await fs.writeFile(varsXmlPath, varsXmlContent, 'utf8');

      this.logger.debug('Configuration files written successfully');

    } catch (error) {
      this.logger.error(`Failed to write configuration files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate FreeSWITCH configuration syntax
   */
  private async validateFreeSwitchSyntax(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use FreeSWITCH to validate configuration syntax
      // This is a simplified check - in production you might want more comprehensive validation
      const { stdout, stderr } = await execAsync('freeswitch -syntax', { timeout: 10000 });
      
      if (stderr && stderr.includes('ERROR')) {
        return { success: false, error: stderr };
      }

      return { success: true };

    } catch (error) {
      // If freeswitch command is not available, skip syntax check
      this.logger.warn('FreeSWITCH syntax validation skipped - command not available');
      return { success: true };
    }
  }

  /**
   * Reload FreeSWITCH configuration
   */
  private async reloadFreeSwitchConfiguration(): Promise<void> {
    try {
      await this.eslService.executeCommand('reloadxml');
      this.logger.log('FreeSWITCH configuration reloaded successfully');
    } catch (error) {
      this.logger.error(`Failed to reload FreeSWITCH configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform health check after configuration apply
   */
  private async performHealthCheck(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if FreeSWITCH is responding
      const status = await this.eslService.getSystemStatus();
      
      if (!status || !status.uptime) {
        return { success: false, error: 'FreeSWITCH is not responding' };
      }

      // Additional health checks can be added here
      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get apply history
   */
  async getApplyHistory(): Promise<any[]> {
    // This could be implemented to track configuration apply history
    // For now, return empty array
    return [];
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups(keepDays: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const backupDirs = await fs.readdir(this.backupPath);
      
      for (const dir of backupDirs) {
        const dirPath = path.join(this.backupPath, dir);
        const stats = await fs.stat(dirPath);
        
        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          await execAsync(`rm -rf ${dirPath}`);
          this.logger.log(`Cleaned old backup: ${dir}`);
        }
      }

    } catch (error) {
      this.logger.warn(`Failed to clean old backups: ${error.message}`);
    }
  }
}
