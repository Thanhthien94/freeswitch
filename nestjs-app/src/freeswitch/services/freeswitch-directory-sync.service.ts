import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeSwitchExtension } from '../entities/freeswitch-extension.entity';
import { Domain } from '../entities/domain.entity';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DirectorySyncResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
}

@Injectable()
export class FreeSwitchDirectorySyncService {
  private readonly logger = new Logger(FreeSwitchDirectorySyncService.name);
  private readonly freeswitchConfigPath = '/etc/freeswitch';
  private readonly directoryPath = path.join(this.freeswitchConfigPath, 'directory');

  constructor(
    @InjectRepository(FreeSwitchExtension)
    private readonly extensionRepository: Repository<FreeSwitchExtension>,
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly eslService: FreeSwitchEslService,
  ) {}

  /**
   * Đồng bộ hoàn toàn một extension với FreeSWITCH directory
   */
  async syncExtensionToDirectory(extensionId: string): Promise<DirectorySyncResult> {
    try {
      this.logger.log(`Syncing extension ${extensionId} to FreeSWITCH directory`);

      const extension = await this.extensionRepository.findOne({
        where: { id: extensionId },
        relations: ['domain'],
      });

      if (!extension) {
        return {
          success: false,
          message: `Extension ${extensionId} not found`,
        };
      }

      // Tạo XML content cho extension
      const userXml = this.generateUserXml(extension);
      
      // Đảm bảo domain directory tồn tại
      await this.ensureDomainDirectoryExists(extension.domain?.name || 'localhost');
      
      // Ghi file XML cho user
      const userFilePath = this.getUserFilePath(extension);
      await fs.writeFile(userFilePath, userXml, 'utf8');
      
      this.logger.log(`Extension XML file created: ${userFilePath}`);

      // Reload FreeSWITCH directory
      const reloadResult = await this.reloadFreeSwitchDirectory();
      
      return {
        success: true,
        message: `Extension ${extension.extensionNumber} synced successfully`,
        details: {
          filePath: userFilePath,
          reloadResult,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to sync extension ${extensionId}:`, error);
      return {
        success: false,
        message: `Failed to sync extension: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Xóa extension khỏi FreeSWITCH directory
   */
  async removeExtensionFromDirectory(extensionId: string): Promise<DirectorySyncResult> {
    try {
      this.logger.log(`Removing extension ${extensionId} from FreeSWITCH directory`);

      const extension = await this.extensionRepository.findOne({
        where: { id: extensionId },
        relations: ['domain'],
      });

      if (!extension) {
        return {
          success: false,
          message: `Extension ${extensionId} not found`,
        };
      }

      // Xóa file XML của user
      const userFilePath = this.getUserFilePath(extension);
      
      try {
        await fs.unlink(userFilePath);
        this.logger.log(`Extension XML file removed: ${userFilePath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        this.logger.warn(`Extension XML file not found: ${userFilePath}`);
      }

      // Reload FreeSWITCH directory
      const reloadResult = await this.reloadFreeSwitchDirectory();
      
      return {
        success: true,
        message: `Extension ${extension.extensionNumber} removed successfully`,
        details: {
          filePath: userFilePath,
          reloadResult,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to remove extension ${extensionId}:`, error);
      return {
        success: false,
        message: `Failed to remove extension: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Đồng bộ hoàn toàn tất cả extensions của một domain
   */
  async syncDomainDirectory(domainName: string): Promise<DirectorySyncResult> {
    try {
      this.logger.log(`Syncing domain ${domainName} directory`);

      const domain = await this.domainRepository.findOne({
        where: { name: domainName },
      });

      if (!domain) {
        return {
          success: false,
          message: `Domain ${domainName} not found`,
        };
      }

      // Lấy tất cả extensions của domain
      const extensions = await this.extensionRepository.find({
        where: { domainId: domain.id, isActive: true },
        relations: ['domain'],
      });

      // Tạo domain XML
      const domainXml = this.generateDomainXml(domain, extensions);
      const domainFilePath = path.join(this.directoryPath, `${domainName}.xml`);
      await fs.writeFile(domainFilePath, domainXml, 'utf8');

      // Đảm bảo domain directory tồn tại
      await this.ensureDomainDirectoryExists(domainName);

      // Sync tất cả extensions
      const syncResults = [];
      for (const extension of extensions) {
        const userXml = this.generateUserXml(extension);
        const userFilePath = this.getUserFilePath(extension);
        await fs.writeFile(userFilePath, userXml, 'utf8');
        syncResults.push({
          extensionNumber: extension.extensionNumber,
          filePath: userFilePath,
        });
      }

      // Reload FreeSWITCH directory
      const reloadResult = await this.reloadFreeSwitchDirectory();

      this.logger.log(`Domain ${domainName} synced with ${extensions.length} extensions`);

      return {
        success: true,
        message: `Domain ${domainName} synced successfully with ${extensions.length} extensions`,
        details: {
          domainFilePath,
          extensions: syncResults,
          reloadResult,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to sync domain ${domainName}:`, error);
      return {
        success: false,
        message: `Failed to sync domain: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Đồng bộ hoàn toàn tất cả domains và extensions
   */
  async syncAllDirectories(): Promise<DirectorySyncResult> {
    try {
      this.logger.log('Syncing all directories');

      const domains = await this.domainRepository.find({
        where: { isActive: true },
      });

      const syncResults = [];
      for (const domain of domains) {
        const result = await this.syncDomainDirectory(domain.name);
        syncResults.push({
          domain: domain.name,
          result,
        });
      }

      const successCount = syncResults.filter(r => r.result.success).length;
      const failureCount = syncResults.length - successCount;

      return {
        success: failureCount === 0,
        message: `Synced ${successCount}/${domains.length} domains successfully`,
        details: {
          results: syncResults,
          successCount,
          failureCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to sync all directories:', error);
      return {
        success: false,
        message: `Failed to sync all directories: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Generate XML content cho user
   */
  private generateUserXml(extension: FreeSwitchExtension): string {
    const domainName = extension.domain?.name || 'localhost';
    const displayName = extension.displayName || extension.extensionNumber;
    const effectiveCallerIdName = extension.effectiveCallerIdName || displayName;
    const effectiveCallerIdNumber = extension.effectiveCallerIdNumber || extension.extensionNumber;
    const userContext = extension.directorySettings?.user_context || 'default';
    const callTimeout = extension.directorySettings?.call_timeout || 30;
    
    // Recording settings
    const recordingEnabled = extension.directorySettings?.recording?.enabled || false;
    const recordingMode = extension.directorySettings?.recording?.mode || 'all';
    
    // Voicemail settings
    const voicemailEnabled = extension.voicemailSettings?.enabled || false;
    const voicemailPassword = extension.voicemailSettings?.password || extension.extensionNumber;
    
    // DND settings
    const dndEnabled = extension.directorySettings?.dnd?.enabled || false;
    
    // Call forwarding settings
    const callForwardEnabled = extension.directorySettings?.callForward?.enabled || false;

    return `<!--
  Extension: ${extension.extensionNumber}@${domainName}
  Display Name: ${displayName}
  Type: user
  Auto-generated from database at: ${new Date().toISOString()}
  Do not edit manually - use the web interface to modify settings.
-->

<include>
  <user id="${extension.extensionNumber}">
    <params>
      <param name="password" value="${extension.password}"/>
      <param name="vm-password" value="${voicemailPassword}"/>
      <!-- Authentication settings -->
      <param name="a1-hash" value=""/>
      <param name="auth-acl" value="domains"/>
      <!-- Additional params -->

    </params>

    <variables>
      <!-- Basic extension info -->
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="${extension.extensionNumber}"/>
      <variable name="user_context" value="${userContext}"/>
      
      <!-- Caller ID settings -->
      <variable name="effective_caller_id_name" value="${effectiveCallerIdName}"/>
      <variable name="effective_caller_id_number" value="${effectiveCallerIdNumber}"/>
      <variable name="outbound_caller_id_name" value="${extension.outboundCallerIdName || '$${outbound_caller_name}'}"/>
      <variable name="outbound_caller_id_number" value="${extension.outboundCallerIdNumber || '$${outbound_caller_id}'}"/>
      
      <!-- Extension features -->
      <variable name="call_timeout" value="${callTimeout}"/>
      <variable name="hangup_after_bridge" value="false"/>
      <variable name="continue_on_fail" value="false"/>
      
      <!-- Call forwarding -->
      <variable name="call_forward_all" value="${callForwardEnabled ? 'true' : ''}"/>
      <variable name="call_forward_busy" value=""/>
      <variable name="call_forward_no_answer" value=""/>
      
      <!-- Do Not Disturb -->
      <variable name="dnd" value="${dndEnabled ? 'true' : 'false'}"/>
      
      <!-- Call groups -->
      <variable name="callgroup" value="default"/>
      <variable name="pickup_group" value="default"/>
      
      <!-- Recording settings -->
      <variable name="record_calls" value="${recordingEnabled ? 'true' : 'false'}"/>
      <variable name="record_mode" value="${recordingMode}"/>
      
      <!-- Voicemail settings -->
      <variable name="vm_enabled" value="${voicemailEnabled ? 'true' : 'false'}"/>
      
      <!-- Custom variables -->

    </variables>
  </user>
</include>`;
  }

  /**
   * Generate XML content cho domain
   */
  private generateDomainXml(domain: Domain, extensions: FreeSwitchExtension[]): string {
    return `<!--
  Domain: ${domain.name}
  Description: ${domain.description || 'Auto-generated domain'}
  Auto-generated from database at: ${new Date().toISOString()}
  Do not edit manually - use the web interface to modify settings.
-->

<include>
  <domain name="${domain.name}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=\${dialed_domain}:presence_id=\${dialed_user}@\${dialed_domain}}\${sofia_contact(*\${dialed_user}@\${dialed_domain})},\${verto_contact(\${dialed_user}@\${dialed_domain})}"/>
      <!-- Verto support -->
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <!-- Security settings -->
      <param name="allow-empty-password" value="false"/>
      <!-- Domain specific settings -->
      <param name="max-registrations-per-extension" value="1"/>
      <param name="force-subscription-expires" value="60"/>
    </params>

    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="\$\${default_provider}"/>
      <variable name="default_areacode" value="\$\${default_areacode}"/>
      <variable name="transfer_fallback_extension" value="operator"/>
    </variables>

    <groups>
      <group name="default">
        <users>
          <!-- Include all user files from domain directory -->
          <X-PRE-PROCESS cmd="include" data="${domain.name}/*.xml"/>
        </users>
      </group>
    </groups>
  </domain>
</include>`;
  }

  /**
   * Đảm bảo domain directory tồn tại
   */
  private async ensureDomainDirectoryExists(domainName: string): Promise<void> {
    const domainDirPath = path.join(this.directoryPath, domainName);

    try {
      await fs.access(domainDirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(domainDirPath, { recursive: true });
        this.logger.log(`Created domain directory: ${domainDirPath}`);
      } else {
        throw error;
      }
    }

    // Tạo file domain XML nếu chưa tồn tại
    const domainXmlPath = path.join(this.directoryPath, `${domainName}.xml`);
    try {
      await fs.access(domainXmlPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Lấy thông tin domain từ database
        const domain = await this.domainRepository.findOne({
          where: { name: domainName },
        });

        if (domain) {
          const domainXml = this.generateDomainXml(domain, []);
          await fs.writeFile(domainXmlPath, domainXml, 'utf8');
          this.logger.log(`Created domain XML file: ${domainXmlPath}`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Lấy đường dẫn file XML cho user
   */
  private getUserFilePath(extension: FreeSwitchExtension): string {
    const domainName = extension.domain?.name || 'localhost';
    return path.join(this.directoryPath, domainName, `${extension.extensionNumber}.xml`);
  }

  /**
   * Reload FreeSWITCH directory via ESL
   */
  private async reloadFreeSwitchDirectory(): Promise<any> {
    try {
      this.logger.log('Reloading FreeSWITCH directory');

      // Reload directory
      const reloadResult = await this.eslService.executeCommand('reloadxml');

      // Rescan directory
      const rescanResult = await this.eslService.executeCommand('reload mod_xml_curl');

      this.logger.log('FreeSWITCH directory reloaded successfully');

      return {
        reloadResult,
        rescanResult,
      };
    } catch (error) {
      this.logger.error('Failed to reload FreeSWITCH directory:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái đồng bộ của extension
   */
  async checkExtensionSyncStatus(extensionId: string): Promise<DirectorySyncResult> {
    try {
      const extension = await this.extensionRepository.findOne({
        where: { id: extensionId },
        relations: ['domain'],
      });

      if (!extension) {
        return {
          success: false,
          message: `Extension ${extensionId} not found`,
        };
      }

      const userFilePath = this.getUserFilePath(extension);

      try {
        const fileContent = await fs.readFile(userFilePath, 'utf8');
        const expectedContent = this.generateUserXml(extension);

        const isInSync = fileContent.trim() === expectedContent.trim();

        return {
          success: true,
          message: `Extension ${extension.extensionNumber} sync status checked`,
          details: {
            filePath: userFilePath,
            isInSync,
            fileExists: true,
          },
        };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            success: true,
            message: `Extension ${extension.extensionNumber} sync status checked`,
            details: {
              filePath: userFilePath,
              isInSync: false,
              fileExists: false,
            },
          };
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to check sync status for extension ${extensionId}:`, error);
      return {
        success: false,
        message: `Failed to check sync status: ${error.message}`,
        errors: [error.message],
      };
    }
  }
}
