import { Injectable, Logger } from '@nestjs/common';
import { FreeSwitchSipProfileService } from './freeswitch-sip-profile.service';
import { FreeSwitchGatewayService } from './freeswitch-gateway.service';
import { FreeSwitchDialplanService } from './freeswitch-dialplan.service';
import { FreeSwitchExtensionService } from './freeswitch-extension.service';
import { FreeSwitchXmlGeneratorService } from './freeswitch-xml-generator.service';
import { FreeSwitchEslService } from './freeswitch-esl.service';
import { FreeSwitchVersionService } from './freeswitch-version.service';
import { GlobalNetworkConfigService } from './global-network-config.service';

export interface CompleteConfigResult {
  sofiaConfig: string;
  dialplanConfig: string;
  directoryConfig: string;
  success: boolean;
  errors?: string[];
}

export interface DeploymentResult {
  success: boolean;
  message: string;
  deploymentId?: string;
  errors?: string[];
  warnings?: string[];
}

@Injectable()
export class FreeSwitchConfigService {
  private readonly logger = new Logger(FreeSwitchConfigService.name);

  constructor(
    private readonly sipProfileService: FreeSwitchSipProfileService,
    private readonly gatewayService: FreeSwitchGatewayService,
    private readonly dialplanService: FreeSwitchDialplanService,
    private readonly extensionService: FreeSwitchExtensionService,
    private readonly xmlGeneratorService: FreeSwitchXmlGeneratorService,
    private readonly eslService: FreeSwitchEslService,
    private readonly versionService: FreeSwitchVersionService,
    private readonly globalNetworkConfigService: GlobalNetworkConfigService,
  ) {}

  async generateCompleteConfiguration(domainId?: any): Promise<CompleteConfigResult> {
    try {
      this.logger.log(`Generating complete FreeSWITCH configuration${domainId ? ` for domain: ${domainId}` : ''}`);

      const errors: string[] = [];

      // Get all configuration data including global network config
      const [profilesResult, gatewaysResult, dialplansResult, extensionsResult, globalNetworkConfig] = await Promise.all([
        this.sipProfileService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.gatewayService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.dialplanService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.extensionService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.globalNetworkConfigService.findConfig(),
      ]);

      const profiles = profilesResult.data;
      const gateways = gatewaysResult.data;
      const dialplans = dialplansResult.data;
      const extensions = extensionsResult.data;

      // Validate configuration
      if (profiles.length === 0) {
        errors.push('No active SIP profiles found');
      }

      // Group gateways by profile
      const gatewaysByProfile = gateways.reduce((acc, gateway) => {
        if (!acc[gateway.profileId]) {
          acc[gateway.profileId] = [];
        }
        acc[gateway.profileId].push(gateway);
        return acc;
      }, {} as Record<string, any[]>);

      // Generate Sofia configuration with global network settings
      const profilesXml = profiles
        .map(profile => this.xmlGeneratorService.generateSipProfileXml(profile, gatewaysByProfile[profile.id] || []))
        .join('\n');

      const sofiaConfig = `
<configuration name="sofia.conf" description="sofia Endpoint">
  <global_settings>
    <param name="log-level" value="0"/>
    <param name="abort-on-empty-external-ip" value="true"/>
    <param name="auto-restart" value="false"/>
    <param name="debug-presence" value="0"/>
    <!-- Global Network Configuration Applied -->
    <param name="rtp-start-port" value="${globalNetworkConfig.rtpStartPort}"/>
    <param name="rtp-end-port" value="${globalNetworkConfig.rtpEndPort}"/>
  </global_settings>
  <profiles>
    ${profilesXml}
  </profiles>
</configuration>`;

      // Generate Dialplan configuration
      const contexts = [...new Set(dialplans.map(dp => dp.context))];
      const contextsXml = contexts
        .map(context => this.xmlGeneratorService.generateDialplanXml(
          dialplans.filter(dp => dp.context === context), 
          context
        ))
        .join('\n');

      const dialplanConfig = `
<configuration name="dialplan.conf" description="Regex/XML Dialplan">
  ${contextsXml}
</configuration>`;

      // Generate Directory configuration using global network config domain
      const domainName = domainId ? 'domain.local' : globalNetworkConfig.domain;
      const directoryConfig = this.xmlGeneratorService.generateDirectoryXml(extensions, domainName);

      return {
        sofiaConfig,
        dialplanConfig,
        directoryConfig,
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to generate complete configuration: ${error.message}`);
      return {
        sofiaConfig: '',
        dialplanConfig: '',
        directoryConfig: '',
        success: false,
        errors: [error.message],
      };
    }
  }

  async deployConfiguration(domainId?: any, deployedBy?: number): Promise<DeploymentResult> {
    try {
      this.logger.log(`Deploying FreeSWITCH configuration${domainId ? ` for domain: ${domainId}` : ''}`);

      const warnings: string[] = [];
      const errors: string[] = [];

      // Check FreeSWITCH connection
      const isConnected = await this.eslService.isConnected();
      if (!isConnected) {
        errors.push('FreeSWITCH is not connected via ESL');
      }

      // Generate configuration
      const configResult = await this.generateCompleteConfiguration(domainId);
      if (!configResult.success) {
        errors.push(...(configResult.errors || []));
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: 'Configuration deployment failed',
          errors,
        };
      }

      // Create deployment record
      const configVersions = []; // TODO: Collect actual config versions
      const deployment = await this.versionService.createDeployment(
        `Deployment ${new Date().toISOString()}`,
        configVersions,
        'Automated configuration deployment',
        domainId,
        deployedBy
      );

      // Deploy to FreeSWITCH
      if (isConnected) {
        try {
          // Reload XML configuration
          const reloadResult = await this.eslService.reloadXmlConfig();
          if (!reloadResult.success) {
            warnings.push(`XML reload warning: ${reloadResult.message}`);
          }

          // Restart SIP profiles
          const profiles = await this.sipProfileService.findAll({ domainId, isActive: true, limit: 1000 });
          for (const profile of profiles.data) {
            const profileReloadResult = await this.eslService.reloadSipProfile(profile.name);
            if (!profileReloadResult.success) {
              warnings.push(`Profile '${profile.name}' reload warning: ${profileReloadResult.message}`);
            }
          }

          // Mark deployment as successful
          await this.versionService.markDeploymentAsDeployed(deployment.id, deployedBy);

        } catch (eslError) {
          warnings.push(`ESL operation warning: ${eslError.message}`);
        }
      } else {
        warnings.push('FreeSWITCH not connected - configuration generated but not deployed');
      }

      return {
        success: true,
        message: 'Configuration deployed successfully',
        deploymentId: deployment.id,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      this.logger.error(`Failed to deploy configuration: ${error.message}`);
      return {
        success: false,
        message: `Deployment failed: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  async validateConfiguration(domainId?: any): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get configuration data
      const [profilesResult, gatewaysResult, dialplansResult, extensionsResult] = await Promise.all([
        this.sipProfileService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.gatewayService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.dialplanService.findAll({ domainId, isActive: true, limit: 1000 }),
        this.extensionService.findAll({ domainId, isActive: true, limit: 1000 }),
      ]);

      // Validate SIP profiles
      if (profilesResult.data.length === 0) {
        errors.push('No active SIP profiles configured');
      }

      // Check for port conflicts
      const portMap = new Map<string, string[]>();
      profilesResult.data.forEach(profile => {
        const key = `${profile.bindIp || 'any'}:${profile.bindPort}`;
        if (!portMap.has(key)) {
          portMap.set(key, []);
        }
        portMap.get(key)!.push(profile.name);
      });

      portMap.forEach((profiles, portKey) => {
        if (profiles.length > 1) {
          errors.push(`Port conflict on ${portKey}: ${profiles.join(', ')}`);
        }
      });

      // Validate gateways
      gatewaysResult.data.forEach(gateway => {
        if (gateway.register && (!gateway.username || !gateway.password)) {
          errors.push(`Gateway '${gateway.name}' requires username and password for registration`);
        }
      });

      // Validate dialplans
      dialplansResult.data.forEach(dialplan => {
        const validation = dialplan.validate();
        if (!validation.isValid) {
          errors.push(`Dialplan '${dialplan.name}': ${validation.errors.join(', ')}`);
        }
      });

      // Validate extensions
      const extensionNumbers = new Set<string>();
      extensionsResult.data.forEach(extension => {
        const validation = extension.validate();
        if (!validation.isValid) {
          errors.push(`Extension '${extension.extensionNumber}': ${validation.errors.join(', ')}`);
        }

        // Check for duplicate extension numbers
        const key = `${extension.extensionNumber}:${extension.domainId || 'default'}`;
        if (extensionNumbers.has(key)) {
          errors.push(`Duplicate extension number: ${extension.extensionNumber}`);
        }
        extensionNumbers.add(key);
      });

      // Check FreeSWITCH connectivity
      const isConnected = await this.eslService.isConnected();
      if (!isConnected) {
        warnings.push('FreeSWITCH is not connected via ESL');
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  async getSystemStatus(): Promise<{
    freeswitch: any;
    configuration: {
      profiles: number;
      gateways: number;
      dialplans: number;
      extensions: number;
    };
    lastDeployment?: any;
  }> {
    try {
      const [
        freeswitchStatus,
        profilesResult,
        gatewaysResult,
        dialplansResult,
        extensionsResult,
        deployments
      ] = await Promise.all([
        this.eslService.getSystemStatus(),
        this.sipProfileService.getStats(),
        this.gatewayService.getStats(),
        this.dialplanService.getStats(),
        this.extensionService.getStats(),
        this.versionService.getDeployments(),
      ]);

      return {
        freeswitch: freeswitchStatus,
        configuration: {
          profiles: profilesResult.total,
          gateways: gatewaysResult.total,
          dialplans: dialplansResult.total,
          extensions: extensionsResult.total,
        },
        lastDeployment: deployments[0] || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get system status: ${error.message}`);
      throw error;
    }
  }
}
