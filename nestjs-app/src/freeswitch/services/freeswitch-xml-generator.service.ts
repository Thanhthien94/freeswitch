import { Injectable, Logger } from '@nestjs/common';
import { FreeSwitchSipProfile } from '../entities/freeswitch-sip-profile.entity';
import { FreeSwitchGateway } from '../entities/freeswitch-gateway.entity';
import { FreeSwitchDialplan } from '../entities/freeswitch-dialplan.entity';
import { FreeSwitchExtension } from '../entities/freeswitch-extension.entity';
import { Domain } from '../entities/domain.entity';

export interface XmlValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class FreeSwitchXmlGeneratorService {
  private readonly logger = new Logger(FreeSwitchXmlGeneratorService.name);

  // SIP Profile XML Generation
  generateSipProfileXml(profile: FreeSwitchSipProfile, gateways: FreeSwitchGateway[] = []): string {
    this.logger.debug(`Generating XML for SIP profile: ${profile.name}`);

    const gatewaysXml = gateways
      .filter(gateway => gateway.isActive)
      .map(gateway => this.generateGatewayXml(gateway))
      .join('\n');

    return `
    <profile name="${profile.name}">
      <aliases>
        <alias name="${profile.name}"/>
      </aliases>
      <gateways>
        ${gatewaysXml}
      </gateways>
      <domains>
        <domain name="all" alias="false" parse="true"/>
      </domains>
      <settings>
        ${this.generateSipProfileSettings(profile)}
      </settings>
    </profile>`;
  }

  private generateSipProfileSettings(profile: FreeSwitchSipProfile): string {
    const settings = [];

    // Basic settings
    settings.push(`<param name="debug" value="0"/>`);
    settings.push(`<param name="sip-trace" value="no"/>`);
    settings.push(`<param name="sip-capture" value="no"/>`);
    settings.push(`<param name="rfc2833-pt" value="101"/>`);
    settings.push(`<param name="sip-port" value="${profile.bindPort}"/>`);
    settings.push(`<param name="dialplan" value="${profile.settings.dialplan || 'XML'}"/>`);
    settings.push(`<param name="context" value="${profile.settings.context || profile.getDefaultContext()}"/>`);
    settings.push(`<param name="dtmf-duration" value="${profile.settings.dtmf_duration || 2000}"/>`);
    settings.push(`<param name="dtmf-type" value="${profile.settings.dtmf_type || 'rfc2833'}"/>`);

    // Network settings
    settings.push(`<param name="use-rtp-timer" value="true"/>`);
    settings.push(`<param name="rtp-timer-name" value="${profile.settings.rtp_timer_name || 'soft'}"/>`);
    settings.push(`<param name="rtp-ip" value="${profile.rtpIp || profile.bindIp || '$${local_ip_v4}'}"/>`);
    settings.push(`<param name="sip-ip" value="${profile.bindIp || '$${local_ip_v4}'}"/>`);

    // External IP settings
    if (profile.extSipIp) {
      settings.push(`<param name="ext-sip-ip" value="${profile.extSipIp}"/>`);
    }
    if (profile.extRtpIp) {
      settings.push(`<param name="ext-rtp-ip" value="${profile.extRtpIp}"/>`);
    }

    // Media settings
    settings.push(`<param name="hold-music" value="$${hold_music}"/>`);
    settings.push(`<param name="apply-nat-acl" value="nat.auto"/>`);
    settings.push(`<param name="manage-presence" value="true"/>`);
    settings.push(`<param name="presence-hosts" value="${profile.bindIp || '$${domain}'}"/>`);
    settings.push(`<param name="presence-privacy" value="$${presence_privacy}"/>`);

    // Codec settings
    const inboundCodecs = profile.codecSettings.inbound_codec_prefs?.join(',') || '$${global_codec_prefs}';
    const outboundCodecs = profile.codecSettings.outbound_codec_prefs?.join(',') || '$${global_codec_prefs}';
    settings.push(`<param name="inbound-codec-prefs" value="${inboundCodecs}"/>`);
    settings.push(`<param name="outbound-codec-prefs" value="${outboundCodecs}"/>`);
    settings.push(`<param name="inbound-codec-negotiation" value="${profile.codecSettings.inbound_codec_negotiation || 'generous'}"/>`);
    settings.push(`<param name="outbound-codec-negotiation" value="${profile.codecSettings.outbound_codec_negotiation || 'generous'}"/>`);

    // Authentication settings
    settings.push(`<param name="auth-calls" value="${profile.settings.auth_calls ? 'true' : 'false'}"/>`);
    settings.push(`<param name="accept-blind-reg" value="${profile.settings.accept_blind_reg ? 'true' : 'false'}"/>`);
    settings.push(`<param name="accept-blind-auth" value="${profile.settings.accept_blind_auth ? 'true' : 'false'}"/>`);

    // TLS settings
    if (profile.tlsPort) {
      settings.push(`<param name="tls-sip-port" value="${profile.tlsPort}"/>`);
    }
    if (profile.securitySettings.tls_enabled) {
      settings.push(`<param name="tls" value="true"/>`);
      if (profile.securitySettings.tls_cert_dir) {
        settings.push(`<param name="tls-cert-dir" value="${profile.securitySettings.tls_cert_dir}"/>`);
      }
      if (profile.securitySettings.tls_private_key) {
        settings.push(`<param name="tls-private-key" value="${profile.securitySettings.tls_private_key}"/>`);
      }
    }

    // Security settings
    if (profile.securitySettings.apply_inbound_acl) {
      settings.push(`<param name="apply-inbound-acl" value="${profile.securitySettings.apply_inbound_acl}"/>`);
    }
    if (profile.securitySettings.apply_register_acl) {
      settings.push(`<param name="apply-register-acl" value="${profile.securitySettings.apply_register_acl}"/>`);
    }

    // Advanced settings
    Object.entries(profile.advancedSettings).forEach(([key, value]) => {
      settings.push(`<param name="${key}" value="${value}"/>`);
    });

    return settings.join('\n        ');
  }

  // Gateway XML Generation
  generateGatewayXml(gateway: FreeSwitchGateway): string {
    return gateway.getXmlConfiguration();
  }

  // Dialplan XML Generation
  generateDialplanXml(dialplans: FreeSwitchDialplan[], context: string = 'default'): string {
    this.logger.debug(`Generating dialplan XML for context: ${context}`);

    const contextDialplans = dialplans
      .filter(dp => dp.context === context && dp.isActive)
      .sort((a, b) => a.priority - b.priority);

    const extensionsXml = contextDialplans
      .map(dialplan => dialplan.getXmlConfiguration())
      .join('\n');

    return `
  <context name="${context}">
    ${extensionsXml}
  </context>`;
  }

  // Directory XML Generation
  generateDirectoryXml(extensions: FreeSwitchExtension[], domainName: string): string {
    this.logger.debug(`Generating directory XML for domain: ${domainName}`);

    const usersXml = extensions
      .filter(ext => ext.isActive)
      .map(extension => extension.getDirectoryXml())
      .join('\n');

    return `
  <domain name="${domainName}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=$${domain_name}:presence_id=$${dialed_user}@$${dialed_domain}}user/$${dialed_user}@$${dialed_domain}"/>
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <param name="jsonrpc-allowed-event-channels" value="demo,conference,presence"/>
    </params>
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="$${default_provider}"/>
      <variable name="default_areacode" value="$${default_areacode}"/>
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

  // Complete configuration generation
  generateCompleteConfig(
    profiles: FreeSwitchSipProfile[],
    gateways: FreeSwitchGateway[],
    dialplans: FreeSwitchDialplan[],
    extensions: FreeSwitchExtension[],
    domainName: string = 'localhost'
  ): {
    sofiaConfig: string;
    dialplanConfig: string;
    directoryConfig: string;
  } {
    this.logger.log('Generating complete FreeSWITCH configuration');

    // Group gateways by profile
    const gatewaysByProfile = gateways.reduce((acc, gateway) => {
      if (!acc[gateway.profileId]) {
        acc[gateway.profileId] = [];
      }
      acc[gateway.profileId].push(gateway);
      return acc;
    }, {} as Record<string, FreeSwitchGateway[]>);

    // Generate Sofia configuration
    const profilesXml = profiles
      .filter(profile => profile.isActive)
      .map(profile => this.generateSipProfileXml(profile, gatewaysByProfile[profile.id] || []))
      .join('\n');

    const sofiaConfig = `
<configuration name="sofia.conf" description="sofia Endpoint">
  <global_settings>
    <param name="log-level" value="0"/>
    <param name="abort-on-empty-external-ip" value="true"/>
    <param name="auto-restart" value="false"/>
    <param name="debug-presence" value="0"/>
    <param name="capture-server" value="udp:homer.domain.com:9060"/>
  </global_settings>
  <profiles>
    ${profilesXml}
  </profiles>
</configuration>`;

    // Generate Dialplan configuration
    const contexts = [...new Set(dialplans.map(dp => dp.context))];
    const contextsXml = contexts
      .map(context => this.generateDialplanXml(dialplans, context))
      .join('\n');

    const dialplanConfig = `
<configuration name="dialplan.conf" description="Regex/XML Dialplan">
  ${contextsXml}
</configuration>`;

    // Generate Directory configuration
    const directoryConfig = `
<configuration name="directory.conf" description="User Directory">
  ${this.generateDirectoryXml(extensions, domainName)}
</configuration>`;

    return {
      sofiaConfig,
      dialplanConfig,
      directoryConfig,
    };
  }

  // XML Validation
  validateConfiguration(xml: string): XmlValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic XML structure validation
      if (!xml.trim()) {
        errors.push('XML content is empty');
        return { isValid: false, errors, warnings };
      }

      // Check for basic XML structure
      if (!xml.includes('<configuration') && !xml.includes('<profile') && !xml.includes('<context')) {
        errors.push('Invalid XML structure - missing configuration elements');
      }

      // Check for unclosed tags (basic check)
      const openTags = xml.match(/<[^/][^>]*>/g) || [];
      const closeTags = xml.match(/<\/[^>]*>/g) || [];
      
      if (openTags.length !== closeTags.length) {
        warnings.push('Possible unclosed XML tags detected');
      }

      // Check for required parameters in SIP profiles
      if (xml.includes('<profile') && !xml.includes('sip-port')) {
        warnings.push('SIP profile missing sip-port parameter');
      }

      // Check for security issues
      if (xml.includes('accept-blind-reg') && xml.includes('value="true"')) {
        warnings.push('Security warning: blind registration is enabled');
      }

      if (xml.includes('accept-blind-auth') && xml.includes('value="true"')) {
        warnings.push('Security warning: blind authentication is enabled');
      }

    } catch (error) {
      errors.push(`XML validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Utility methods
  escapeXmlValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  formatXml(xml: string): string {
    // Basic XML formatting
    return xml
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index, array) => {
        const depth = this.getXmlDepth(array.slice(0, index + 1));
        return '  '.repeat(depth) + line;
      })
      .join('\n');
  }

  private getXmlDepth(lines: string[]): number {
    let depth = 0;
    for (const line of lines) {
      if (line.includes('</')) {
        depth--;
      } else if (line.includes('<') && !line.includes('/>')) {
        depth++;
      }
    }
    return Math.max(0, depth);
  }
}
