import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { Extension, ExtensionStatus, ExtensionType } from '../../extensions/extension.entity';
import { Domain } from '../../auth/entities/domain.entity';
import { EslService } from '../../esl/esl.service';

interface FreeSwitchUser {
  userid: string;
  domain: string;
  context: string;
  group: string;
  effective_caller_id_name: string;
  effective_caller_id_number: string;
}

@Injectable()
export class FreeSwitchImportService {
  private readonly logger = new Logger(FreeSwitchImportService.name);
  private readonly configPath: string;

  constructor(
    @InjectRepository(Extension)
    private extensionRepository: Repository<Extension>,
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private configService: ConfigService,
    private eslService: EslService,
  ) {
    this.configPath = this.configService.get('FREESWITCH_CONFIG_PATH', '/etc/freeswitch');
  }

  /**
   * Import extensions from FreeSWITCH to database
   */
  async importExtensionsFromFreeSWITCH(): Promise<{ imported: number; skipped: number; errors: string[] }> {
    this.logger.log('Starting import of extensions from FreeSWITCH...');

    const result = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Get users from FreeSWITCH
      const freeswitchUsers = await this.getFreeSwitchUsers();
      this.logger.log(`Found ${freeswitchUsers.length} users in FreeSWITCH`);

      // Get existing extensions from database
      const existingExtensions = await this.extensionRepository.find();
      const existingMap = new Map(
        existingExtensions.map(ext => [`${ext.extension}@${ext.domainId}`, ext])
      );

      // Process each FreeSWITCH user
      for (const user of freeswitchUsers) {
        try {
          const extensionKey = `${user.userid}@${user.domain}`;
          
          // Skip if already exists in database
          if (existingMap.has(extensionKey)) {
            result.skipped++;
            continue;
          }

          // Skip invalid extensions
          if (!this.isValidExtension(user)) {
            result.skipped++;
            continue;
          }

          // Ensure domain exists
          await this.ensureDomainExists(user.domain);

          // Read extension XML file for additional details
          const extensionDetails = await this.readExtensionXML(user.domain, user.userid);

          // Create extension in database
          const extension = this.extensionRepository.create({
            extension: user.userid,
            domainId: user.domain,
            displayName: user.effective_caller_id_name || `Extension ${user.userid}`,
            type: ExtensionType.USER,
            status: ExtensionStatus.ACTIVE,
            context: user.context || 'default',
            callerIdName: user.effective_caller_id_name,
            callerIdNumber: user.effective_caller_id_number,
            callGroup: user.group || 'default',
            pickupGroup: user.group || 'default',
            // Set default password (will be hashed)
            sipPassword: extensionDetails?.password || 'default123',
            freeswitchPassword: extensionDetails?.plainPassword || 'default123',
            // Additional fields from XML
            ...extensionDetails?.additionalFields,
          });

          await this.extensionRepository.save(extension);
          result.imported++;

          this.logger.log(`Imported extension: ${extensionKey}`);

        } catch (error) {
          const errorMsg = `Failed to import ${user.userid}@${user.domain}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      this.logger.log(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
      return result;

    } catch (error) {
      this.logger.error('Failed to import extensions from FreeSWITCH:', error);
      throw error;
    }
  }

  /**
   * Get users from FreeSWITCH via ESL
   */
  private async getFreeSwitchUsers(): Promise<FreeSwitchUser[]> {
    try {
      const response = await this.eslService.executeCommand('list_users');
      return this.parseFreeSwitchUsers(response);
    } catch (error) {
      this.logger.error('Failed to get users from FreeSWITCH:', error);
      throw error;
    }
  }

  /**
   * Parse FreeSWITCH list_users output
   */
  private parseFreeSwitchUsers(output: string): FreeSwitchUser[] {
    const users: FreeSwitchUser[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('|') && !line.startsWith('userid|')) {
        const parts = line.split('|');
        if (parts.length >= 7) {
          const user: FreeSwitchUser = {
            userid: parts[0]?.trim() || '',
            context: parts[1]?.trim() || '',
            domain: parts[2]?.trim() || '',
            group: parts[3]?.trim() || '',
            effective_caller_id_name: parts[6]?.trim() || '',
            effective_caller_id_number: parts[7]?.trim() || '',
          };

          // Only include valid numeric extensions
          if (user.userid && user.domain && /^\d{3,5}$/.test(user.userid)) {
            users.push(user);
          }
        }
      }
    }

    return users;
  }

  /**
   * Check if extension is valid for import
   */
  private isValidExtension(user: FreeSwitchUser): boolean {
    // Must have userid and domain
    if (!user.userid || !user.domain) {
      return false;
    }

    // Must be numeric extension (3-5 digits)
    if (!/^\d{3,5}$/.test(user.userid)) {
      return false;
    }

    // Skip system/example extensions
    const skipExtensions = ['1000', '1001', '1002', '1003', '1004', '1005'];
    if (skipExtensions.includes(user.userid) && user.domain === 'localhost') {
      return false;
    }

    return true;
  }

  /**
   * Ensure domain exists in database
   */
  private async ensureDomainExists(domainName: string): Promise<void> {
    const existingDomain = await this.domainRepository.findOne({
      where: { name: domainName }
    });

    if (!existingDomain) {
      const domain = this.domainRepository.create({
        id: domainName,
        name: domainName,
        displayName: `Domain ${domainName}`,
        description: `Auto-imported domain from FreeSWITCH`,
        isActive: true,
        maxUsers: 1000,
        maxExtensions: 1000,
        billingPlan: 'standard',
      });

      await this.domainRepository.save(domain);
      this.logger.log(`Created domain: ${domainName}`);
    }
  }

  /**
   * Read extension XML file for additional details
   */
  private async readExtensionXML(domain: string, extension: string): Promise<any> {
    try {
      const xmlPath = path.join(this.configPath, 'directory', domain, `${extension}.xml`);
      
      // Try to read the XML file
      const xmlContent = await fs.readFile(xmlPath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      // Extract password and other parameters
      const user = result?.include?.user?.[0];
      if (user) {
        const params = user.params?.[0]?.param || [];
        const variables = user.variables?.[0]?.variable || [];

        const extensionDetails: any = {
          additionalFields: {}
        };

        // Extract password
        const passwordParam = params.find((p: any) => p.$.name === 'password');
        if (passwordParam) {
          extensionDetails.password = passwordParam.$.value;
        }

        // Extract VM password
        const vmPasswordParam = params.find((p: any) => p.$.name === 'vm-password');
        if (vmPasswordParam) {
          extensionDetails.additionalFields.vmPassword = vmPasswordParam.$.value;
        }

        // Extract variables
        for (const variable of variables) {
          const name = variable.$.name;
          const value = variable.$.value;

          switch (name) {
            case 'toll_allow':
              extensionDetails.additionalFields.tollAllow = value;
              break;
            case 'accountcode':
              extensionDetails.additionalFields.accountCode = value;
              break;
            case 'user_context':
              extensionDetails.additionalFields.context = value;
              break;
            case 'call_timeout':
              extensionDetails.additionalFields.callTimeout = parseInt(value) || 30;
              break;
            case 'hangup_after_bridge':
              extensionDetails.additionalFields.hangupAfterBridge = value === 'true';
              break;
            case 'continue_on_fail':
              extensionDetails.additionalFields.continueOnFail = value === 'true';
              break;
            case 'record_calls':
              extensionDetails.additionalFields.recordCalls = value === 'true';
              break;
          }
        }

        return extensionDetails;
      }

    } catch (error) {
      // XML file doesn't exist or can't be read - that's OK
      this.logger.debug(`Could not read XML for ${extension}@${domain}: ${error.message}`);
    }

    return null;
  }

  /**
   * Import specific extensions by number range
   */
  async importExtensionRange(startExt: number, endExt: number, domain: string = 'localhost'): Promise<any> {
    this.logger.log(`Importing extensions ${startExt}-${endExt} for domain ${domain}`);

    const result = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    // Ensure domain exists
    await this.ensureDomainExists(domain);

    for (let extNum = startExt; extNum <= endExt; extNum++) {
      try {
        const extension = extNum.toString();
        const extensionKey = `${extension}@${domain}`;

        // Check if already exists
        const existing = await this.extensionRepository.findOne({
          where: { extension, domainId: domain }
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Create extension
        const newExtension = this.extensionRepository.create({
          extension,
          domainId: domain,
          displayName: `Extension ${extension}`,
          type: ExtensionType.USER,
          status: ExtensionStatus.ACTIVE,
          context: 'default',
          callerIdName: `Extension ${extension}`,
          callerIdNumber: extension,
          callGroup: 'default',
          pickupGroup: 'default',
          sipPassword: 'default123', // Will be hashed
          freeswitchPassword: 'default123', // Plain password for FreeSWITCH
        });

        await this.extensionRepository.save(newExtension);
        result.imported++;

        this.logger.log(`Imported extension: ${extensionKey}`);

      } catch (error) {
        const errorMsg = `Failed to import ${extNum}@${domain}: ${error.message}`;
        this.logger.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    return result;
  }
}
