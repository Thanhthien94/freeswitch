import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FreeSwitchSipProfile } from '../entities/freeswitch-sip-profile.entity';
import { FreeSwitchGateway } from '../entities/freeswitch-gateway.entity';
import { FreeSwitchEslService } from './freeswitch-esl.service';

export interface SipProfileSyncResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
}

@Injectable()
export class FreeSwitchSipProfileSyncService {
  private readonly logger = new Logger(FreeSwitchSipProfileSyncService.name);
  private readonly freeswitchConfigPath = '/etc/freeswitch';
  private readonly sipProfilesPath = path.join(this.freeswitchConfigPath, 'sip_profiles');

  constructor(
    @InjectRepository(FreeSwitchSipProfile)
    private readonly sipProfileRepository: Repository<FreeSwitchSipProfile>,
    @InjectRepository(FreeSwitchGateway)
    private readonly gatewayRepository: Repository<FreeSwitchGateway>,
    private readonly eslService: FreeSwitchEslService,
  ) {}

  /**
   * Đồng bộ một SIP profile với FreeSWITCH configuration
   */
  async syncSipProfileToFreeSWITCH(profileId: string): Promise<SipProfileSyncResult> {
    try {
      this.logger.log(`Syncing SIP profile ${profileId} to FreeSWITCH`);

      const profile = await this.sipProfileRepository.findOne({
        where: { id: profileId },
        relations: ['domain', 'gateways'],
      });

      if (!profile) {
        return {
          success: false,
          message: `SIP profile ${profileId} not found`,
        };
      }

      // Lấy gateways của profile
      const gateways = await this.gatewayRepository.find({
        where: { profileId: profile.id, isActive: true },
      });

      // Tạo XML content cho profile
      const profileXml = this.generateSipProfileXml(profile, gateways);
      
      // Đảm bảo profile directory tồn tại
      await this.ensureProfileDirectoryExists(profile.name);
      
      // Ghi file XML cho profile
      const profileFilePath = this.getProfileFilePath(profile);
      await fs.writeFile(profileFilePath, profileXml, 'utf8');
      
      this.logger.log(`SIP profile XML file created: ${profileFilePath}`);

      // Reload FreeSWITCH SIP profile
      const reloadResult = await this.reloadFreeSwitchSipProfile(profile.name);
      
      return {
        success: true,
        message: `SIP profile ${profile.name} synced successfully`,
        details: {
          filePath: profileFilePath,
          reloadResult,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to sync SIP profile ${profileId}:`, error);
      return {
        success: false,
        message: `Failed to sync SIP profile: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Đồng bộ tất cả SIP profiles
   */
  async syncAllSipProfiles(): Promise<SipProfileSyncResult> {
    try {
      this.logger.log('Syncing all SIP profiles');

      const profiles = await this.sipProfileRepository.find({
        where: { isActive: true },
        relations: ['domain', 'gateways'],
      });

      const syncResults = [];
      for (const profile of profiles) {
        const result = await this.syncSipProfileToFreeSWITCH(profile.id);
        syncResults.push({
          profile: profile.name,
          result,
        });
      }

      const successCount = syncResults.filter(r => r.result.success).length;
      const failureCount = syncResults.length - successCount;

      // Reload Sofia module để load tất cả profiles
      await this.reloadSofiaModule();

      return {
        success: failureCount === 0,
        message: `Synced ${successCount}/${profiles.length} SIP profiles successfully`,
        details: {
          results: syncResults,
          successCount,
          failureCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to sync all SIP profiles:', error);
      return {
        success: false,
        message: `Failed to sync SIP profiles: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  /**
   * Generate SIP profile XML configuration
   */
  private generateSipProfileXml(profile: FreeSwitchSipProfile, gateways: FreeSwitchGateway[]): string {
    const gatewaysXml = gateways
      .map(gateway => gateway.getXmlConfiguration())
      .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <!-- SIP Profile: ${profile.name} -->
  <!-- Generated at: ${new Date().toISOString()} -->
  <!-- Profile ID: ${profile.id} -->

  <profile name="${profile.name}">
    <aliases>
      <!-- Profile aliases can be added here -->
    </aliases>

    <gateways>
      ${gatewaysXml}
    </gateways>

    <domains>
      <domain name="all" alias="false" parse="true"/>
    </domains>

    <settings>
      ${this.generateProfileSettings(profile)}
    </settings>
  </profile>
</include>`;
  }

  /**
   * Generate profile settings XML
   */
  private generateProfileSettings(profile: FreeSwitchSipProfile): string {
    const settings = [];

    // Basic settings from profile properties
    settings.push(`<param name="user-agent-string" value="FreeSWITCH"/>`);
    settings.push(`<param name="debug" value="0"/>`);
    settings.push(`<param name="sip-trace" value="no"/>`);
    settings.push(`<param name="sip-capture" value="no"/>`);
    settings.push(`<param name="rfc2833-pt" value="101"/>`);
    settings.push(`<param name="sip-port" value="${profile.bindPort || '5060'}"/>`);
    settings.push(`<param name="dialplan" value="${profile.settings?.dialplan || 'XML'}"/>`);
    settings.push(`<param name="context" value="${profile.settings?.context || 'public'}"/>`);
    settings.push(`<param name="dtmf-duration" value="${profile.settings?.dtmf_duration || '2000'}"/>`);
    settings.push(`<param name="inbound-codec-prefs" value="${profile.settings?.inbound_codec_prefs || 'PCMU,PCMA'}"/>`);
    settings.push(`<param name="outbound-codec-prefs" value="${profile.settings?.outbound_codec_prefs || 'PCMU,PCMA'}"/>`);

    // Network settings
    if (profile.bindIp) {
      settings.push(`<param name="sip-ip" value="${profile.bindIp}"/>`);
    }
    if (profile.extSipIp) {
      settings.push(`<param name="ext-sip-ip" value="${profile.extSipIp}"/>`);
    }
    if (profile.extRtpIp) {
      settings.push(`<param name="ext-rtp-ip" value="${profile.extRtpIp}"/>`);
    }
    if (profile.rtpIp) {
      settings.push(`<param name="rtp-ip" value="${profile.rtpIp}"/>`);
    }

    // Settings from profile.settings object
    if (profile.settings) {
      Object.entries(profile.settings).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          settings.push(`<param name="${key.replace(/_/g, '-')}" value="${value}"/>`);
        }
      });
    }

    // Advanced settings
    if (profile.advancedSettings) {
      Object.entries(profile.advancedSettings).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          settings.push(`<param name="${key}" value="${value}"/>`);
        }
      });
    }

    return settings.join('\n      ');
  }

  /**
   * Đảm bảo profile directory tồn tại
   */
  private async ensureProfileDirectoryExists(profileName: string): Promise<void> {
    const profileDir = path.join(this.sipProfilesPath, profileName);
    
    try {
      await fs.access(profileDir);
    } catch {
      await fs.mkdir(profileDir, { recursive: true });
      this.logger.log(`Created profile directory: ${profileDir}`);
    }
  }

  /**
   * Lấy đường dẫn file XML cho profile
   */
  private getProfileFilePath(profile: FreeSwitchSipProfile): string {
    return path.join(this.sipProfilesPath, `${profile.name}.xml`);
  }

  /**
   * Reload FreeSWITCH SIP profile via ESL
   */
  private async reloadFreeSwitchSipProfile(profileName: string): Promise<any> {
    try {
      this.logger.log(`Reloading FreeSWITCH SIP profile: ${profileName}`);

      // Reload specific profile
      const reloadResult = await this.eslService.executeCommand(`sofia profile ${profileName} restart`);

      this.logger.log(`FreeSWITCH SIP profile ${profileName} reloaded successfully`);

      return reloadResult;
    } catch (error) {
      this.logger.error(`Failed to reload FreeSWITCH SIP profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Reload Sofia module
   */
  private async reloadSofiaModule(): Promise<any> {
    try {
      this.logger.log('Reloading Sofia module');

      const reloadResult = await this.eslService.executeCommand('reload mod_sofia');

      this.logger.log('Sofia module reloaded successfully');

      return reloadResult;
    } catch (error) {
      this.logger.error('Failed to reload Sofia module:', error);
      throw error;
    }
  }
}
