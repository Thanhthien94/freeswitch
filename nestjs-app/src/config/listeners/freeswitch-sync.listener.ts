import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FreeSwitchDirectoryService } from '../services/freeswitch-directory.service';
import { Domain } from '../../auth/entities/domain.entity';
import { Extension } from '../../extensions/extension.entity';

/**
 * Event listener for automatic FreeSWITCH synchronization
 * Listens to domain and extension events and updates FreeSWITCH configuration accordingly
 */
@Injectable()
export class FreeSwitchSyncListener {
  private readonly logger = new Logger(FreeSwitchSyncListener.name);

  constructor(
    private freeSwitchDirectoryService: FreeSwitchDirectoryService,
  ) {}

  /**
   * Handle domain creation
   */
  @OnEvent('domain.created')
  async handleDomainCreated(domain: Domain): Promise<void> {
    this.logger.log(`Domain created event received: ${domain.name}`);
    
    try {
      await this.freeSwitchDirectoryService.syncDomain(domain);
      this.logger.log(`FreeSWITCH domain synchronized: ${domain.name}`);
    } catch (error) {
      this.logger.error(`Failed to sync domain ${domain.name} to FreeSWITCH:`, error);
    }
  }

  /**
   * Handle domain update
   */
  @OnEvent('domain.updated')
  async handleDomainUpdated(domain: Domain): Promise<void> {
    this.logger.log(`Domain updated event received: ${domain.name}`);
    
    try {
      await this.freeSwitchDirectoryService.syncDomain(domain);
      this.logger.log(`FreeSWITCH domain synchronized: ${domain.name}`);
    } catch (error) {
      this.logger.error(`Failed to sync domain ${domain.name} to FreeSWITCH:`, error);
    }
  }

  /**
   * Handle domain deletion
   */
  @OnEvent('domain.deleted')
  async handleDomainDeleted(domain: Domain): Promise<void> {
    this.logger.log(`Domain deleted event received: ${domain.name}`);
    
    try {
      await this.freeSwitchDirectoryService.removeDomainDirectory(domain);
      this.logger.log(`FreeSWITCH domain removed: ${domain.name}`);
    } catch (error) {
      this.logger.error(`Failed to remove domain ${domain.name} from FreeSWITCH:`, error);
    }
  }

  /**
   * Handle domain status toggle
   */
  @OnEvent('domain.status.toggled')
  async handleDomainStatusToggled(domain: Domain): Promise<void> {
    this.logger.log(`Domain status toggled event received: ${domain.name} (active: ${domain.isActive})`);
    
    try {
      if (domain.isActive) {
        // Domain activated - sync to FreeSWITCH
        await this.freeSwitchDirectoryService.syncDomain(domain);
        this.logger.log(`FreeSWITCH domain activated: ${domain.name}`);
      } else {
        // Domain deactivated - remove from FreeSWITCH
        await this.freeSwitchDirectoryService.removeDomainDirectory(domain);
        this.logger.log(`FreeSWITCH domain deactivated: ${domain.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle domain status toggle for ${domain.name}:`, error);
    }
  }

  /**
   * Handle extension creation
   */
  @OnEvent('extension.created')
  async handleExtensionCreated(extension: Extension): Promise<void> {
    this.logger.log(`Extension created event received: ${extension.extension}@${extension.domainId}`);
    
    try {
      await this.freeSwitchDirectoryService.syncExtension(extension);
      this.logger.log(`FreeSWITCH extension synchronized: ${extension.extension}@${extension.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to sync extension ${extension.extension}@${extension.domainId} to FreeSWITCH:`, error);
    }
  }

  /**
   * Handle extension update
   */
  @OnEvent('extension.updated')
  async handleExtensionUpdated(extension: Extension): Promise<void> {
    this.logger.log(`Extension updated event received: ${extension.extension}@${extension.domainId}`);
    
    try {
      await this.freeSwitchDirectoryService.syncExtension(extension);
      this.logger.log(`FreeSWITCH extension synchronized: ${extension.extension}@${extension.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to sync extension ${extension.extension}@${extension.domainId} to FreeSWITCH:`, error);
    }
  }

  /**
   * Handle extension deletion
   */
  @OnEvent('extension.deleted')
  async handleExtensionDeleted(extension: Extension): Promise<void> {
    this.logger.log(`Extension deleted event received: ${extension.extension}@${extension.domainId}`);
    
    try {
      await this.freeSwitchDirectoryService.removeExtensionXml(extension);
      this.logger.log(`FreeSWITCH extension removed: ${extension.extension}@${extension.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to remove extension ${extension.extension}@${extension.domainId} from FreeSWITCH:`, error);
    }
  }

  /**
   * Handle extension password reset
   */
  @OnEvent('extension.password.reset')
  async handleExtensionPasswordReset(extension: Extension): Promise<void> {
    this.logger.log(`Extension password reset event received: ${extension.extension}@${extension.domainId}`);
    
    try {
      await this.freeSwitchDirectoryService.syncExtension(extension);
      this.logger.log(`FreeSWITCH extension password synchronized: ${extension.extension}@${extension.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to sync extension password ${extension.extension}@${extension.domainId} to FreeSWITCH:`, error);
    }
  }

  /**
   * Handle extension status change
   */
  @OnEvent('extension.status.changed')
  async handleExtensionStatusChanged(extension: Extension): Promise<void> {
    this.logger.log(`Extension status changed event received: ${extension.extension}@${extension.domainId} (status: ${extension.status})`);
    
    try {
      if (extension.status === 'active') {
        // Extension activated - sync to FreeSWITCH
        await this.freeSwitchDirectoryService.syncExtension(extension);
        this.logger.log(`FreeSWITCH extension activated: ${extension.extension}@${extension.domainId}`);
      } else {
        // Extension deactivated - remove from FreeSWITCH
        await this.freeSwitchDirectoryService.removeExtensionXml(extension);
        this.logger.log(`FreeSWITCH extension deactivated: ${extension.extension}@${extension.domainId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle extension status change for ${extension.extension}@${extension.domainId}:`, error);
    }
  }

  /**
   * Handle bulk extension operations
   */
  @OnEvent('extensions.bulk.created')
  async handleBulkExtensionsCreated(data: { domainId: string; extensions: Extension[] }): Promise<void> {
    this.logger.log(`Bulk extensions created event received: ${data.extensions.length} extensions for domain ${data.domainId}`);
    
    try {
      // Sync all extensions
      for (const extension of data.extensions) {
        await this.freeSwitchDirectoryService.syncExtension(extension);
      }
      
      this.logger.log(`FreeSWITCH bulk extensions synchronized: ${data.extensions.length} extensions for domain ${data.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to sync bulk extensions for domain ${data.domainId}:`, error);
    }
  }

  /**
   * Handle bulk extension deletion
   */
  @OnEvent('extensions.bulk.deleted')
  async handleBulkExtensionsDeleted(data: { domainId: string; extensions: Extension[] }): Promise<void> {
    this.logger.log(`Bulk extensions deleted event received: ${data.extensions.length} extensions for domain ${data.domainId}`);
    
    try {
      // Remove all extensions
      for (const extension of data.extensions) {
        await this.freeSwitchDirectoryService.removeExtensionXml(extension);
      }
      
      this.logger.log(`FreeSWITCH bulk extensions removed: ${data.extensions.length} extensions for domain ${data.domainId}`);
    } catch (error) {
      this.logger.error(`Failed to remove bulk extensions for domain ${data.domainId}:`, error);
    }
  }

  /**
   * Handle full directory regeneration request
   */
  @OnEvent('freeswitch.directory.regenerate')
  async handleDirectoryRegenerate(): Promise<void> {
    this.logger.log('Full directory regeneration event received');
    
    try {
      await this.freeSwitchDirectoryService.generateDirectoryStructure();
      this.logger.log('FreeSWITCH directory structure regenerated successfully');
    } catch (error) {
      this.logger.error('Failed to regenerate FreeSWITCH directory structure:', error);
    }
  }
}
