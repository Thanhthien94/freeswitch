import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Domain } from '../../auth/entities/domain.entity';
import { Extension, ExtensionStatus } from '../../extensions/extension.entity';
import { EslService } from '../../esl/esl.service';

@Injectable()
export class FreeSwitchDirectoryService {
  private readonly logger = new Logger(FreeSwitchDirectoryService.name);
  private readonly configPath: string;

  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    @InjectRepository(Extension)
    private extensionRepository: Repository<Extension>,
    private configService: ConfigService,
    private eslService: EslService,
  ) {
    this.configPath = this.configService.get('FREESWITCH_CONFIG_PATH', '/opt/freeswitch/conf');
  }

  /**
   * Generate complete FreeSWITCH directory structure from database
   */
  async generateDirectoryStructure(): Promise<void> {
    this.logger.log('Generating FreeSWITCH directory structure from database...');

    try {
      // Get all active domains
      const domains = await this.domainRepository.find({
        where: { isActive: true },
        relations: ['extensions'],
      });

      // Generate directory XML for each domain
      for (const domain of domains) {
        await this.generateDomainDirectory(domain);
      }

      // Generate extensions for each domain
      for (const domain of domains) {
        await this.generateDomainExtensions(domain);
      }

      this.logger.log('FreeSWITCH directory structure generated successfully');

      // Reload FreeSWITCH directory
      await this.reloadFreeSwitchDirectory();

    } catch (error) {
      this.logger.error('Failed to generate FreeSWITCH directory structure:', error);
      throw error;
    }
  }

  /**
   * Generate domain directory XML file
   */
  async generateDomainDirectory(domain: Domain): Promise<void> {
    this.logger.log(`Generating directory for domain: ${domain.name}`);

    const domainXml = this.generateDomainXmlContent(domain);
    const domainPath = path.join(this.configPath, 'directory', `${domain.name}.xml`);

    // Ensure directory exists
    await fs.mkdir(path.dirname(domainPath), { recursive: true });

    // Write domain XML file
    await fs.writeFile(domainPath, domainXml, 'utf8');

    this.logger.log(`Domain directory generated: ${domainPath}`);
  }

  /**
   * Generate domain XML content
   */
  private generateDomainXmlContent(domain: Domain): string {
    const settings = domain.settings || {};
    
    return `<!--
  Domain: ${domain.name}
  Display Name: ${domain.displayName}
  Auto-generated from database at: ${new Date().toISOString()}
  Do not edit manually - use the web interface to modify settings.
-->

<include>
  <domain name="${domain.name}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=\${dialed_domain}:presence_id=\${dialed_user}@\${dialed_domain}}\${sofia_contact(*/\${dialed_user}@\${dialed_domain})},\${verto_contact(\${dialed_user}@\${dialed_domain})}"/>
      <!-- Verto support -->
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <!-- Security settings -->
      <param name="allow-empty-password" value="${settings.allowEmptyPassword || 'false'}"/>
      <!-- Domain specific settings -->
      <param name="max-registrations-per-extension" value="${settings.maxRegistrationsPerExtension || '1'}"/>
      <param name="force-subscription-expires" value="${settings.forceSubscriptionExpires || '60'}"/>
    </params>

    <variables>
      <!-- Domain variables -->
      <variable name="domain_name" value="${domain.name}"/>
      <variable name="domain_display_name" value="${domain.displayName}"/>
      <variable name="max_users" value="${domain.maxUsers}"/>
      <variable name="max_extensions" value="${domain.maxExtensions}"/>
      <variable name="billing_plan" value="${domain.billingPlan}"/>
      <!-- Custom domain settings -->
${Object.entries(settings).map(([key, value]) => 
  `      <variable name="domain_${key}" value="${value}"/>`
).join('\n')}
    </variables>

    <groups>
      <group name="default">
        <users>
          <X-PRE-PROCESS cmd="include" data="${domain.name}/*.xml"/>
        </users>
      </group>

      <!-- Additional groups based on domain settings -->
      ${settings.groups ? this.generateGroupsXml(settings.groups) : ''}
    </groups>
  </domain>
</include>`;
  }

  /**
   * Generate groups XML content
   */
  private generateGroupsXml(groups: any[]): string {
    return groups.map(group => `
      <group name="${group.name}">
        <users>
          ${group.extensions?.map((ext: string) => 
            `<user id="${ext}" type="pointer"/>`
          ).join('\n          ') || ''}
        </users>
      </group>`
    ).join('\n');
  }

  /**
   * Generate extensions for a domain
   */
  async generateDomainExtensions(domain: Domain): Promise<void> {
    this.logger.log(`Generating extensions for domain: ${domain.name}`);

    // Get all active extensions for this domain
    const extensions = await this.extensionRepository.find({
      where: { 
        domainId: domain.name,
        status: ExtensionStatus.ACTIVE
      },
      relations: ['user'],
    });

    // Create domain directory for extensions
    const domainExtensionsPath = path.join(this.configPath, 'directory', domain.name);
    await fs.mkdir(domainExtensionsPath, { recursive: true });

    // Generate XML file for each extension
    for (const extension of extensions) {
      await this.generateExtensionXml(extension, domainExtensionsPath);
    }

    this.logger.log(`Generated ${extensions.length} extensions for domain: ${domain.name}`);
  }

  /**
   * Generate individual extension XML file
   */
  async generateExtensionXml(extension: Extension, domainPath: string): Promise<void> {
    const extensionXml = this.generateExtensionXmlContent(extension);
    const extensionPath = path.join(domainPath, `${extension.extension}.xml`);

    await fs.writeFile(extensionPath, extensionXml, 'utf8');
  }

  /**
   * Generate extension XML content
   */
  private generateExtensionXmlContent(extension: Extension): string {
    const variables = extension.variables || {};
    const params = extension.params || {};

    return `<!--
  Extension: ${extension.extension}@${extension.domainId}
  Display Name: ${extension.displayName}
  Type: ${extension.type}
  Auto-generated from database at: ${new Date().toISOString()}
  Do not edit manually - use the web interface to modify settings.
-->

<include>
  <user id="${extension.extension}">
    <params>
      <param name="password" value="${extension.freeswitchPassword || '$${default_password}'}"/>
      <param name="vm-password" value="${extension.vmPassword || extension.extension}"/>
      <!-- Authentication settings -->
      <param name="a1-hash" value="${extension.a1Hash || ''}"/>
      <param name="auth-acl" value="${params.authAcl || 'domains'}"/>
      <!-- Additional params -->
${Object.entries(params).map(([key, value]) => 
  `      <param name="${key}" value="${value}"/>`
).join('\n')}
    </params>

    <variables>
      <!-- Basic extension info -->
      <variable name="toll_allow" value="${extension.tollAllow || 'domestic,international,local'}"/>
      <variable name="accountcode" value="${extension.accountCode || extension.extension}"/>
      <variable name="user_context" value="${extension.context || 'default'}"/>
      
      <!-- Caller ID settings -->
      <variable name="effective_caller_id_name" value="${extension.getEffectiveCallerIdName()}"/>
      <variable name="effective_caller_id_number" value="${extension.getEffectiveCallerIdNumber()}"/>
      <variable name="outbound_caller_id_name" value="${extension.callerIdName || '$${outbound_caller_name}'}"/>
      <variable name="outbound_caller_id_number" value="${extension.callerIdNumber || '$${outbound_caller_id}'}"/>
      
      <!-- Extension features -->
      <variable name="call_timeout" value="${extension.callTimeout || '30'}"/>
      <variable name="hangup_after_bridge" value="${extension.hangupAfterBridge ? 'true' : 'false'}"/>
      <variable name="continue_on_fail" value="${extension.continueOnFail ? 'true' : 'false'}"/>
      
      <!-- Call forwarding -->
      <variable name="call_forward_all" value="${extension.forwardAll || ''}"/>
      <variable name="call_forward_busy" value="${extension.forwardBusy || ''}"/>
      <variable name="call_forward_no_answer" value="${extension.forwardNoAnswer || ''}"/>
      
      <!-- Do Not Disturb -->
      <variable name="dnd" value="${extension.dndEnabled ? 'true' : 'false'}"/>
      
      <!-- Call groups -->
      <variable name="callgroup" value="${extension.callGroup || 'default'}"/>
      <variable name="pickup_group" value="${extension.pickupGroup || extension.callGroup || 'default'}"/>
      
      <!-- Recording settings -->
      <variable name="record_calls" value="${extension.recordCalls ? 'true' : 'false'}"/>
      
      <!-- Custom variables -->
${Object.entries(variables).map(([key, value]) => 
  `      <variable name="${key}" value="${value}"/>`
).join('\n')}
    </variables>
  </user>
</include>`;
  }

  /**
   * Remove extension XML file
   */
  async removeExtensionXml(extension: Extension): Promise<void> {
    const domainPath = path.join(this.configPath, 'directory', extension.domainId);
    const extensionPath = path.join(domainPath, `${extension.extension}.xml`);

    try {
      await fs.unlink(extensionPath);
      this.logger.log(`Removed extension XML: ${extensionPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to remove extension XML: ${extensionPath}`, error);
      }
    }
  }

  /**
   * Remove domain directory
   */
  async removeDomainDirectory(domain: Domain): Promise<void> {
    const domainPath = path.join(this.configPath, 'directory', `${domain.name}.xml`);
    const domainExtensionsPath = path.join(this.configPath, 'directory', domain.name);

    try {
      // Remove domain XML file
      await fs.unlink(domainPath);
      this.logger.log(`Removed domain XML: ${domainPath}`);

      // Remove domain extensions directory
      await fs.rmdir(domainExtensionsPath, { recursive: true });
      this.logger.log(`Removed domain extensions directory: ${domainExtensionsPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to remove domain directory: ${domain.name}`, error);
      }
    }
  }

  /**
   * Reload FreeSWITCH directory
   */
  private async reloadFreeSwitchDirectory(): Promise<void> {
    try {
      await this.eslService.reloadConfiguration();
      this.logger.log('FreeSWITCH directory reloaded successfully');
    } catch (error) {
      this.logger.error('Failed to reload FreeSWITCH directory:', error);
      // Don't throw error - directory files are still updated
      this.logger.warn('Directory files updated successfully, but FreeSWITCH reload failed. Manual reload may be required.');
    }
  }

  /**
   * Sync single domain
   */
  async syncDomain(domain: Domain): Promise<void> {
    await this.generateDomainDirectory(domain);
    await this.generateDomainExtensions(domain);
    await this.reloadFreeSwitchDirectory();
  }

  /**
   * Sync single extension
   */
  async syncExtension(extension: Extension): Promise<void> {
    const domainPath = path.join(this.configPath, 'directory', extension.domainId);
    await fs.mkdir(domainPath, { recursive: true });
    await this.generateExtensionXml(extension, domainPath);
    await this.reloadFreeSwitchDirectory();
  }
}
