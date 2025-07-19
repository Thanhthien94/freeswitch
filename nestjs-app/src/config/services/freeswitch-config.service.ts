import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FreeSwitchConfig, ExternalIpMode, FreeSwitchConfiguration } from '../entities/freeswitch-config.entity';
import { ConfigAuditService } from './config-audit.service';
import { EslService } from '../../esl/esl.service';
// import { ConfigCacheService } from './config-cache.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class FreeSwitchConfigService {
  private readonly logger = new Logger(FreeSwitchConfigService.name);
  private readonly configPath = process.env.NODE_ENV === 'production'
    ? '/opt/freeswitch/conf'
    : '/usr/src/app/configs/freeswitch';

  constructor(
    @InjectRepository(FreeSwitchConfig)
    private readonly configRepository: Repository<FreeSwitchConfig>,
    private readonly auditService: ConfigAuditService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eslService: EslService,
    // private readonly cacheService: ConfigCacheService,
  ) {}

  /**
   * Get all FreeSWITCH configurations
   */
  async getAllConfigs(): Promise<FreeSwitchConfig[]> {
    return this.configRepository.find({
      where: { is_active: true },
      order: { category: 'ASC', sort_order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get configuration by category
   */
  async getConfigsByCategory(category: string): Promise<FreeSwitchConfig[]> {
    return this.configRepository.find({
      where: { category, is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get specific configuration value
   */
  async getConfigValue(category: string, name: string): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { category, name, is_active: true },
    });
    return config?.value || null;
  }

  /**
   * Set configuration value
   */
  async setConfigValue(
    category: string,
    name: string,
    value: string,
    updatedBy?: string,
  ): Promise<FreeSwitchConfig> {
    let config = await this.configRepository.findOne({
      where: { category, name },
    });

    if (config) {
      config.value = value;
      config.updated_by = updatedBy;
    } else {
      config = this.configRepository.create({
        category,
        name,
        value,
        updated_by: updatedBy,
      });
    }

    const savedConfig = await this.configRepository.save(config);
    this.logger.log(`Updated config: ${category}.${name} = ${value}`);

    return savedConfig;
  }

  /**
   * Get complete FreeSWITCH configuration as structured object
   */
  async getFreeSwitchConfiguration(): Promise<FreeSwitchConfiguration> {
    const configs = await this.getAllConfigs();
    const result: any = {};

    for (const config of configs) {
      if (!result[config.category]) {
        result[config.category] = {};
      }

      // Parse value based on type
      let parsedValue: any = config.value;
      switch (config.type) {
        case 'number':
          parsedValue = parseInt(config.value, 10);
          break;
        case 'boolean':
          parsedValue = config.value.toLowerCase() === 'true';
          break;
        case 'json':
          try {
            parsedValue = JSON.parse(config.value);
          } catch (e) {
            this.logger.warn(`Failed to parse JSON config ${config.category}.${config.name}: ${e.message}`);
          }
          break;
        case 'array':
          parsedValue = config.value.split(',').map(v => v.trim());
          break;
      }

      result[config.category][config.name] = parsedValue;
    }

    return result as FreeSwitchConfiguration;
  }

  /**
   * Auto-detect external IP using HTTP requests
   */
  async detectExternalIp(): Promise<string> {
    this.logger.log('Detecting external IP...');

    const services = [
      'https://api.ipify.org',
      'https://icanhazip.com',
      'https://ipinfo.io/ip',
      'https://checkip.amazonaws.com',
    ];

    for (const service of services) {
      try {
        this.logger.debug(`Trying to detect IP using: ${service}`);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(service, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'FreeSWITCH-Config-Service/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const ip = (await response.text()).trim();

        if (this.isValidIp(ip)) {
          this.logger.log(`Detected external IP: ${ip} using service: ${service}`);
          return ip;
        } else {
          this.logger.warn(`Invalid IP format received from ${service}: ${ip}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to detect IP using service: ${service}`, error.message);
      }
    }

    // Fallback to Docker host IP detection
    try {
      this.logger.debug('Trying to detect Docker host IP...');

      // Try to get default gateway (Docker host) IP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch('http://host.docker.internal:1', {
        signal: controller.signal
      }).catch(() => {
        clearTimeout(timeoutId);
        return null;
      });

      clearTimeout(timeoutId);

      // If we can't connect, that's expected, but we can try other methods
      // For now, return a reasonable default
      const fallbackIp = '192.168.1.1';
      this.logger.warn(`Using fallback IP: ${fallbackIp}`);
      return fallbackIp;

    } catch (error) {
      this.logger.error('Failed to detect any IP address');
    }

    throw new Error('Unable to detect external IP address');
  }

  /**
   * Validate IP address format
   */
  private isValidIp(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Generate FreeSWITCH vars.xml content based on database configuration
   */
  async generateVarsXml(): Promise<string> {
    const config = await this.getFreeSwitchConfiguration();
    const networkConfig = config.network || {} as any;

    let externalRtpIp = '';
    let externalSipIp = '';

    // Determine external IP based on mode
    const externalIpMode = networkConfig.external_ip_mode || ExternalIpMode.STUN;

    switch (externalIpMode) {
      case ExternalIpMode.AUTO:
        try {
          const detectedIp = await this.detectExternalIp();
          externalRtpIp = `<X-PRE-PROCESS cmd="set" data="external_rtp_ip=${detectedIp}"/>`;
          externalSipIp = `<X-PRE-PROCESS cmd="set" data="external_sip_ip=${detectedIp}"/>`;
        } catch (error) {
          this.logger.warn('Failed to auto-detect IP, falling back to STUN');
          externalRtpIp = '<X-PRE-PROCESS cmd="stun-set" data="external_rtp_ip=stun:stun.freeswitch.org"/>';
          externalSipIp = '<X-PRE-PROCESS cmd="stun-set" data="external_sip_ip=stun:stun.freeswitch.org"/>';
        }
        break;

      case ExternalIpMode.MANUAL:
        const manualIp = networkConfig.external_ip || '127.0.0.1';
        externalRtpIp = `<X-PRE-PROCESS cmd="set" data="external_rtp_ip=${manualIp}"/>`;
        externalSipIp = `<X-PRE-PROCESS cmd="set" data="external_sip_ip=${manualIp}"/>`;
        break;

      case ExternalIpMode.STUN:
      default:
        externalRtpIp = '<X-PRE-PROCESS cmd="stun-set" data="external_rtp_ip=stun:stun.freeswitch.org"/>';
        externalSipIp = '<X-PRE-PROCESS cmd="stun-set" data="external_sip_ip=stun:stun.freeswitch.org"/>';
        break;
    }

    // Generate vars.xml template with database values
    const varsXmlTemplate = `<?xml version="1.0" encoding="utf-8"?>
<!-- 
  This file is auto-generated from database configuration.
  Do not edit manually - use the web interface to modify settings.
  Generated at: ${new Date().toISOString()}
-->
<include>
  <!-- Global Variables -->
  <X-PRE-PROCESS cmd="set" data="default_password=${config.global?.default_password || 'FreeSWITCH@2025!'}"/>
  <X-PRE-PROCESS cmd="set" data="domain=${config.sip?.sip_domain || 'localhost'}"/>
  <X-PRE-PROCESS cmd="set" data="domain_name=\$\${domain}"/>
  <X-PRE-PROCESS cmd="set" data="hold_music=local_stream://moh"/>
  <X-PRE-PROCESS cmd="set" data="use_profile=internal"/>
  <X-PRE-PROCESS cmd="set" data="rtp_sdes_suites=AEAD_AES_256_GCM_8|AEAD_AES_128_GCM_8|AES_256_CM_HMAC_SHA1_80|AES_192_CM_HMAC_SHA1_80|AES_CM_128_HMAC_SHA1_80"/>
  <X-PRE-PROCESS cmd="set" data="zrtp_secure_media=true"/>
  <X-PRE-PROCESS cmd="set" data="bind_server_ip=${networkConfig.bind_server_ip || 'auto'}"/>

  <!-- External IP Configuration -->
  ${externalRtpIp}
  ${externalSipIp}

  <!-- RTP Configuration -->
  <X-PRE-PROCESS cmd="set" data="rtp_start_port=${networkConfig.rtp_start_port || 16384}"/>
  <X-PRE-PROCESS cmd="set" data="rtp_end_port=${networkConfig.rtp_end_port || 32768}"/>

  <!-- SIP Configuration -->
  <X-PRE-PROCESS cmd="set" data="internal_sip_port=${config.sip?.sip_port || 5060}"/>
  <X-PRE-PROCESS cmd="set" data="internal_tls_port=${config.sip?.sip_port_tls || 5061}"/>

  <!-- Codec Configuration -->
  <X-PRE-PROCESS cmd="set" data="global_codec_prefs=${config.vars?.global_codec_prefs || 'OPUS,G722,PCMU,PCMA,H264,VP8'}"/>
  <X-PRE-PROCESS cmd="set" data="outbound_codec_prefs=${config.vars?.outbound_codec_prefs || 'OPUS,G722,PCMU,PCMA,H264,VP8'}"/>

  <!-- Additional Variables -->
  <X-PRE-PROCESS cmd="set" data="unroll_loops=true"/>
  <X-PRE-PROCESS cmd="set" data="outbound_caller_id_name=FreeSWITCH"/>
  <X-PRE-PROCESS cmd="set" data="outbound_caller_id_number=0000000000"/>
</include>`;

    return varsXmlTemplate;
  }

  /**
   * Generate switch.conf.xml content
   */
  async generateSwitchConfXml(): Promise<string> {
    const networkConfigs = await this.getConfigsByCategory('network');
    const networkConfig: any = {};

    networkConfigs.forEach(config => {
      let value: any = config.value;
      if (config.type === 'number') {
        value = parseInt(config.value, 10);
      } else if (config.type === 'boolean') {
        value = config.value.toLowerCase() === 'true';
      }
      networkConfig[config.name] = value;
    });

    const switchConfTemplate = `<configuration name="switch.conf" description="Core Configuration">

  <cli-keybindings>
    <key name="1" value="help"/>
    <key name="2" value="status"/>
    <key name="3" value="show channels"/>
    <key name="4" value="show calls"/>
    <key name="5" value="sofia status"/>
    <key name="6" value="reloadxml"/>
    <key name="7" value="console loglevel 0"/>
    <key name="8" value="console loglevel 7"/>
    <key name="9" value="sofia status profile internal"/>
    <key name="10" value="sofia profile internal siptrace on"/>
    <key name="11" value="sofia profile internal siptrace off"/>
    <key name="12" value="version"/>
  </cli-keybindings>

  <default-ptimes>
    <!-- Set this to override the 20ms assumption of various codecs in the sdp with no ptime defined -->
    <!-- <codec name="G729" ptime="40"/> -->
  </default-ptimes>

  <settings>
    <!-- Colorize the Console -->
    <param name="colorize-console" value="true"/>

    <!--Include full timestamps in dialplan logs -->
    <param name="dialplan-timestamps" value="false"/>

    <!-- Maximum number of simultaneous DB handles open -->
    <param name="max-db-handles" value="50"/>
    <!-- Maximum number of seconds to wait for a new DB handle before failing -->
    <param name="db-handle-timeout" value="10"/>

    <!-- Max number of sessions to allow at any given time -->
    <param name="max-sessions" value="1000"/>
    <!--Most channels to create per second -->
    <param name="sessions-per-second" value="30"/>
    <!-- Default Global Log Level - value is one of debug,info,notice,warning,err,crit,alert -->
    <param name="loglevel" value="debug"/>

    <param name="mailer-app" value="sendmail"/>
    <param name="mailer-app-args" value="-t"/>
    <param name="dump-cores" value="yes"/>

    <!-- RTP port range (must match Docker port mapping) -->
    <param name="rtp-start-port" value="${networkConfig.rtp_start_port || 16384}"/>
    <param name="rtp-end-port" value="${networkConfig.rtp_end_port || 32768}"/>

    <!-- Test each port to make sure it is not in use by some other process before allocating it to RTP -->
    <!-- <param name="rtp-port-usage-robustness" value="true"/> -->

  </settings>

</configuration>`;

    return switchConfTemplate;
  }

  /**
   * Generate SIP profile XML files from database configuration
   */
  private async generateSipProfileXmlFiles(): Promise<void> {
    this.logger.log('Generating SIP profile XML files...');

    // Generate internal profile
    const internalXml = await this.generateSipProfileXml('internal');
    const internalPath = path.join(this.configPath, 'sip_profiles', 'internal.xml');
    await fs.writeFile(internalPath, internalXml, 'utf8');

    // Generate external profile
    const externalXml = await this.generateSipProfileXml('external');
    const externalPath = path.join(this.configPath, 'sip_profiles', 'external.xml');
    await fs.writeFile(externalPath, externalXml, 'utf8');

    this.logger.log('SIP profile XML files generated successfully');
  }

  /**
   * Generate SIP profile XML content
   */
  private async generateSipProfileXml(profileType: 'internal' | 'external'): Promise<string> {
    const category = `sip_profile_${profileType}`;

    // Get profile configuration from database
    const configs = await this.getConfigsByCategory(category);
    const config: any = {};

    configs.forEach(c => {
      config[c.name] = c.value;
    });

    // Set defaults if not configured
    const profileConfig = {
      enabled: config.enabled === 'true',
      description: config.description || `${profileType.charAt(0).toUpperCase() + profileType.slice(1)} SIP profile`,
      sip_ip: config.sip_ip || '0.0.0.0',
      sip_port: parseInt(config.sip_port) || (profileType === 'internal' ? 5060 : 5080),
      sip_port_tls: parseInt(config.sip_port_tls) || (profileType === 'internal' ? 5061 : 5081),
      rtp_ip: config.rtp_ip || '0.0.0.0',
      ext_rtp_ip: config.ext_rtp_ip || '$${external_rtp_ip}',
      ext_sip_ip: config.ext_sip_ip || '$${external_sip_ip}',
      rtp_start_port: parseInt(config.rtp_start_port) || 16384,
      rtp_end_port: parseInt(config.rtp_end_port) || 16484,
      rtp_timer_name: config.rtp_timer_name || 'soft',
      rtp_timeout_sec: parseInt(config.rtp_timeout_sec) || 300,
      rtp_hold_timeout_sec: parseInt(config.rtp_hold_timeout_sec) || 1800,
      auth_calls: config.auth_calls !== 'false',
      accept_blind_reg: config.accept_blind_reg === 'true',
      accept_blind_auth: config.accept_blind_auth === 'true',
      apply_inbound_acl: config.apply_inbound_acl || (profileType === 'internal' ? 'domains' : 'providers'),
      apply_register_acl: config.apply_register_acl || (profileType === 'internal' ? 'domains' : 'providers'),
      context: config.context || (profileType === 'internal' ? 'default' : 'public'),
      dialplan: config.dialplan || 'XML',
      dtmf_duration: parseInt(config.dtmf_duration) || 2000,
      codec_prefs: config.codec_prefs || 'OPUS,G722,PCMU,PCMA',
      inbound_codec_prefs: config.inbound_codec_prefs || 'OPUS,G722,PCMU,PCMA',
      outbound_codec_prefs: config.outbound_codec_prefs || 'OPUS,G722,PCMU,PCMA',
      nat_options_ping: config.nat_options_ping !== 'false',
      aggressive_nat_detection: config.aggressive_nat_detection !== 'false',
    };

    return this.generateSipProfileXmlTemplate(profileType, profileConfig);
  }

  /**
   * Generate SIP profile XML template
   */
  private generateSipProfileXmlTemplate(profileType: 'internal' | 'external', config: any): string {
    const profileName = profileType;
    const isInternal = profileType === 'internal';

    return `<profile name="${profileName}">
  <!--
      This is a sofia sip profile/user agent.  This will service exactly one ip and port.
      In FreeSWITCH you can run multiple sip user agents on their own ip and port.

      When you hear someone say "sofia profile" this is what they are talking about.

      Auto-generated from database configuration.
      Generated at: ${new Date().toISOString()}
  -->

  <!-- http://wiki.freeswitch.org/wiki/Sofia_Configuration_Files -->
  <!--aliases are other names that will work as a valid profile name for this profile-->
  <aliases>
    <!--
        <alias name="default"/>
    -->
  </aliases>
  <!-- Outbound Registrations -->
  <gateways>
  </gateways>

  <domains>
    <!-- indicator to parse the directory for domains with parse="true" to get gateways-->
    <!--<domain name="$\${domain}" parse="true"/>-->
    <!-- indicator to parse the directory for domains with parse="true" to get gateways and alias every domain to this profile -->
    <!--<domain name="all" alias="true" parse="true"/>-->
    <domain name="all" alias="true" parse="false"/>
  </domains>

  <settings>
    <param name="debug" value="0"/>
    <!-- If you want FreeSWITCH to shutdown if this profile fails to load, uncomment the next line. -->
    <!-- <param name="shutdown-on-fail" value="true"/> -->
    <param name="sip-trace" value="no"/>
    <param name="sip-capture" value="no"/>

    <!-- Basic Configuration -->
    <param name="context" value="${config.context}"/>
    <param name="rfc2833-pt" value="101"/>
    <param name="sip-port" value="${config.sip_port}"/>
    <param name="dialplan" value="${config.dialplan}"/>
    <param name="dtmf-duration" value="${config.dtmf_duration}"/>

    <!-- Codec Configuration -->
    <param name="inbound-codec-prefs" value="${config.inbound_codec_prefs}"/>
    <param name="outbound-codec-prefs" value="${config.outbound_codec_prefs}"/>

    <!-- RTP Configuration -->
    <param name="rtp-timer-name" value="${config.rtp_timer_name}"/>
    <param name="rtp-ip" value="${config.rtp_ip}"/>
    <param name="sip-ip" value="${config.sip_ip}"/>
    <param name="rtp-start-port" value="${config.rtp_start_port}"/>
    <param name="rtp-end-port" value="${config.rtp_end_port}"/>

    <!-- External IP Configuration -->
    <param name="ext-rtp-ip" value="${config.ext_rtp_ip}"/>
    <param name="ext-sip-ip" value="${config.ext_sip_ip}"/>

    <!-- Media Timeouts -->
    <param name="media_timeout" value="${config.rtp_timeout_sec}"/>
    <param name="media_hold_timeout" value="${config.rtp_hold_timeout_sec}"/>

    <!-- Security Configuration -->
    <param name="auth-calls" value="${config.auth_calls}"/>
    <param name="accept-blind-reg" value="${config.accept_blind_reg}"/>
    <param name="accept-blind-auth" value="${config.accept_blind_auth}"/>
    <param name="apply-inbound-acl" value="${config.apply_inbound_acl}"/>
    <param name="apply-register-acl" value="${config.apply_register_acl}"/>

    <!-- NAT Configuration -->
    <param name="nat-options-ping" value="${config.nat_options_ping}"/>
    <param name="aggressive-nat-detection" value="${config.aggressive_nat_detection}"/>
    <param name="NDLB-force-rport" value="true"/>
    <param name="NDLB-received-in-nat-reg-contact" value="true"/>

    <!-- TLS Configuration -->
    <param name="tls" value="false"/>
    <param name="tls-only" value="false"/>
    <param name="tls-bind-params" value="transport=tls"/>
    <param name="tls-sip-port" value="${config.sip_port_tls}"/>
    <param name="tls-passphrase" value=""/>
    <param name="tls-verify-date" value="true"/>
    <param name="tls-verify-policy" value="none"/>
    <param name="tls-verify-depth" value="2"/>
    <param name="tls-verify-in-subjects" value=""/>
    <param name="tls-version" value="tlsv1,tlsv1.1,tlsv1.2"/>

    <!-- Additional Settings -->
    <param name="hold-music" value="$\${hold_music}"/>
    <param name="inbound-late-negotiation" value="true"/>
    <param name="nonce-ttl" value="60"/>
    <param name="challenge-realm" value="auto_from"/>
    <param name="multiple-registrations" value="false"/>
    <param name="inbound-codec-negotiation" value="generous"/>
    <param name="all-reg-options-ping" value="true"/>
    <param name="unregister-on-options-fail" value="false"/>
    <param name="session-timeout" value="1800"/>
    <param name="minimum-session-expires" value="120"/>
    <param name="enable-timer" value="false"/>
    <param name="rtp-autofix-timing" value="true"/>
    <param name="rtp-rewrite-timestamps" value="true"/>
    <param name="rtp-autoflush-during-bridge" value="true"/>
    <param name="rtp-autoflush" value="false"/>
    <param name="enable-100rel" value="false"/>
    <param name="ignore-183nosdp" value="true"/>
    <param name="manual-rtp-bugs" value="SEND_LINEAR_TIMESTAMPS|START_SEQ_AT_ZERO"/>
    <param name="send_silence_when_idle" value="400"/>

    <!-- WebSocket Support -->
    ${isInternal ? '<param name="ws-binding" value=":5066"/>' : ''}
    ${isInternal ? '<param name="wss-binding" value=":7443"/>' : ''}
  </settings>
</profile>`;
  }

  /**
   * Apply configuration changes to FreeSWITCH
   */
  async applyConfiguration(): Promise<void> {
    this.logger.log('Applying FreeSWITCH configuration...');

    try {
      // Generate new vars.xml
      const varsXml = await this.generateVarsXml();

      // Write to FreeSWITCH config directory
      const varsPath = path.join(this.configPath, 'vars.xml');
      await fs.writeFile(varsPath, varsXml, 'utf8');

      // Generate new switch.conf.xml
      const switchConfXml = await this.generateSwitchConfXml();

      // Write to FreeSWITCH autoload_configs directory
      const switchConfPath = path.join(this.configPath, 'autoload_configs', 'switch.conf.xml');
      await fs.writeFile(switchConfPath, switchConfXml, 'utf8');

      // Generate SIP profile XML files
      await this.generateSipProfileXmlFiles();

      // Generate and write additional config files
      await this.generateAndWriteAdditionalConfigs();

      // Generate dialplan configuration
      // await this.generateDialplanConfig(); // TODO: Implement this method

      this.logger.log('FreeSWITCH configuration applied successfully');

      // Reload FreeSWITCH configuration
      await this.reloadFreeSwitchConfig();

    } catch (error) {
      this.logger.error('Failed to apply FreeSWITCH configuration:', error);
      throw error;
    }
  }

  /**
   * Generate and write additional configuration files
   */
  private async generateAndWriteAdditionalConfigs(): Promise<void> {
    this.logger.log('Generating additional configuration files...');

    try {
      // Generate event_multicast.conf.xml
      const eventMulticastXml = await this.generateEventMulticastXml();
      const eventMulticastPath = path.join(this.configPath, 'autoload_configs', 'event_multicast.conf.xml');
      await fs.writeFile(eventMulticastPath, eventMulticastXml, 'utf8');

      // Generate verto.conf.xml
      const vertoXml = await this.generateVertoXml();
      const vertoPath = path.join(this.configPath, 'autoload_configs', 'verto.conf.xml');
      await fs.writeFile(vertoPath, vertoXml, 'utf8');

      // Generate acl.conf.xml
      const aclXml = await this.generateAclXml();
      const aclPath = path.join(this.configPath, 'autoload_configs', 'acl.conf.xml');
      await fs.writeFile(aclPath, aclXml, 'utf8');

      this.logger.log('Additional configuration files generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate additional configuration files:', error);
      throw error;
    }
  }

  /**
   * Reload FreeSWITCH configuration using ESL
   */
  private async reloadFreeSwitchConfig(): Promise<void> {
    this.logger.log('Reloading FreeSWITCH configuration...');

    try {
      // Check if ESL is connected
      const isConnected = await this.eslService.isConnected();

      if (!isConnected) {
        this.logger.warn('ESL not connected, configuration files updated but FreeSWITCH not reloaded');
        return;
      }

      // Use the public method to reload configuration
      await this.eslService.reloadConfiguration();
      this.logger.log('FreeSWITCH configuration reloaded successfully');

    } catch (error) {
      this.logger.error('Failed to reload FreeSWITCH configuration:', error);
      // Don't throw error here - configuration files are still updated
      this.logger.warn('Configuration files updated successfully, but FreeSWITCH reload failed. Manual reload may be required.');
    }
  }

  /**
   * Generate acl.conf.xml content
   */
  private async generateAclXml(): Promise<string> {
    // Get ACL rules from database
    const aclConfigStr = await this.getConfigValue('security', 'acl_rules');
    let aclRules;

    if (aclConfigStr) {
      try {
        aclRules = JSON.parse(aclConfigStr);
      } catch (error) {
        this.logger.warn('Failed to parse ACL rules from database, using defaults');
        aclRules = await this.getDefaultAclRules();
      }
    } else {
      aclRules = await this.getDefaultAclRules();
    }

    return `<configuration name="acl.conf" description="Network Lists">
  <network-lists>
    <!-- Default allow all for local networks -->
    <list name="domains" default="deny">
${aclRules.domains?.map(rule => `      <node type="${rule.type}" cidr="${rule.cidr}"/>`).join('\n') || this.getDefaultDomainsAcl()}
    </list>

    <!-- ESL access for CLI -->
    <list name="esl_access" default="deny">
${aclRules.esl_access?.map(rule => `      <node type="${rule.type}" cidr="${rule.cidr}"/>`).join('\n') || this.getDefaultEslAcl()}
    </list>

    <!-- SIP profiles access -->
    <list name="sip_profiles" default="deny">
${aclRules.sip_profiles?.map(rule => `      <node type="${rule.type}" cidr="${rule.cidr}"/>`).join('\n') || this.getDefaultSipProfilesAcl()}
    </list>
  </network-lists>
</configuration>
`;
  }

  /**
   * Get default ACL rules (public method for controller access)
   */
  async getDefaultAclRules(): Promise<any> {
    return {
      domains: [
        { type: 'allow', cidr: '127.0.0.1/32' },
        { type: 'allow', cidr: '192.168.0.0/16' },
        { type: 'allow', cidr: '10.0.0.0/8' },
        { type: 'allow', cidr: '172.16.0.0/12' },
        { type: 'allow', cidr: '192.168.65.0/24' }
      ],
      esl_access: [
        { type: 'allow', cidr: '127.0.0.1/32' },
        { type: 'allow', cidr: '172.16.0.0/12' }
      ],
      sip_profiles: [
        { type: 'allow', cidr: '127.0.0.1/32' },
        { type: 'allow', cidr: '192.168.0.0/16' },
        { type: 'allow', cidr: '10.0.0.0/8' },
        { type: 'allow', cidr: '172.16.0.0/12' },
        { type: 'allow', cidr: '192.168.65.0/24' }
      ]
    };
  }

  /**
   * Get default domains ACL as string
   */
  private getDefaultDomainsAcl(): string {
    return `      <node type="allow" cidr="127.0.0.1/32"/>
      <node type="allow" cidr="192.168.0.0/16"/>
      <node type="allow" cidr="10.0.0.0/8"/>
      <node type="allow" cidr="172.16.0.0/12"/>
      <node type="allow" cidr="192.168.65.0/24"/>`;
  }

  /**
   * Get default ESL ACL as string
   */
  private getDefaultEslAcl(): string {
    return `      <node type="allow" cidr="127.0.0.1/32"/>
      <node type="allow" cidr="172.16.0.0/12"/>`;
  }

  /**
   * Get default SIP profiles ACL as string
   */
  private getDefaultSipProfilesAcl(): string {
    return `      <node type="allow" cidr="127.0.0.1/32"/>
      <node type="allow" cidr="192.168.0.0/16"/>
      <node type="allow" cidr="10.0.0.0/8"/>
      <node type="allow" cidr="172.16.0.0/12"/>
      <node type="allow" cidr="192.168.65.0/24"/>`;
  }

  /**
   * Detect current network configuration
   */
  async detectNetworkRanges(): Promise<any> {
    this.logger.log('Detecting network ranges...');

    try {
      const execAsync = promisify(exec);
      const networkInfo = {
        interfaces: [],
        routes: [],
        detectedRanges: []
      };

      // Get network interfaces (works in Docker)
      try {
        const { stdout: ifconfig } = await execAsync('ip addr show || ifconfig -a');
        networkInfo.interfaces = this.parseNetworkInterfaces(ifconfig);
      } catch (error) {
        this.logger.warn('Could not get network interfaces:', error.message);
      }

      // Get routing table
      try {
        const { stdout: routes } = await execAsync('ip route || route -n');
        networkInfo.routes = this.parseRoutes(routes);
      } catch (error) {
        this.logger.warn('Could not get routes:', error.message);
      }

      // Detect common network ranges
      networkInfo.detectedRanges = this.detectCommonRanges(networkInfo.interfaces);

      this.logger.log('Network detection completed:', networkInfo);
      return networkInfo;

    } catch (error) {
      this.logger.error('Failed to detect network ranges:', error);
      return {
        interfaces: [],
        routes: [],
        detectedRanges: this.getDefaultNetworkRanges()
      };
    }
  }

  /**
   * Parse network interfaces output
   */
  private parseNetworkInterfaces(output: string): any[] {
    const interfaces = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Look for IP addresses
      const ipMatch = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)\/(\d+)/);
      if (ipMatch) {
        const [, ip, prefix] = ipMatch;
        interfaces.push({
          ip,
          prefix: parseInt(prefix),
          cidr: `${ip}/${prefix}`,
          network: this.calculateNetwork(ip, parseInt(prefix))
        });
      }
    }

    return interfaces;
  }

  /**
   * Parse routes output
   */
  private parseRoutes(output: string): any[] {
    const routes = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Simple route parsing
      if (line.includes('default') || line.includes('0.0.0.0')) {
        routes.push({ type: 'default', line: line.trim() });
      } else if (line.match(/\d+\.\d+\.\d+\.\d+/)) {
        routes.push({ type: 'network', line: line.trim() });
      }
    }

    return routes;
  }

  /**
   * Calculate network address from IP and prefix
   */
  private calculateNetwork(ip: string, prefix: number): string {
    const ipParts = ip.split('.').map(Number);
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;

    const networkInt = (ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3]) & mask;

    const networkParts = [
      (networkInt >>> 24) & 0xFF,
      (networkInt >>> 16) & 0xFF,
      (networkInt >>> 8) & 0xFF,
      networkInt & 0xFF
    ];

    return `${networkParts.join('.')}/${prefix}`;
  }

  /**
   * Detect common network ranges
   */
  private detectCommonRanges(interfaces: any[]): any[] {
    const ranges = [];

    for (const iface of interfaces) {
      const ip = iface.ip;

      // Skip loopback
      if (ip.startsWith('127.')) continue;

      // Detect common private ranges
      if (ip.startsWith('192.168.')) {
        ranges.push({ type: 'allow', cidr: '192.168.0.0/16', description: 'Private Class C' });
      } else if (ip.startsWith('10.')) {
        ranges.push({ type: 'allow', cidr: '10.0.0.0/8', description: 'Private Class A' });
      } else if (ip.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
        ranges.push({ type: 'allow', cidr: '172.16.0.0/12', description: 'Private Class B' });
      }

      // Add specific interface network
      if (iface.network) {
        ranges.push({
          type: 'allow',
          cidr: iface.network,
          description: `Interface network (${ip})`
        });
      }
    }

    // Always include localhost
    ranges.unshift({ type: 'allow', cidr: '127.0.0.1/32', description: 'Localhost' });

    // Remove duplicates
    return ranges.filter((range, index, self) =>
      index === self.findIndex(r => r.cidr === range.cidr)
    );
  }

  /**
   * Get default network ranges
   */
  private getDefaultNetworkRanges(): any[] {
    return [
      { type: 'allow', cidr: '127.0.0.1/32', description: 'Localhost' },
      { type: 'allow', cidr: '192.168.0.0/16', description: 'Private Class C' },
      { type: 'allow', cidr: '10.0.0.0/8', description: 'Private Class A' },
      { type: 'allow', cidr: '172.16.0.0/12', description: 'Private Class B' }
    ];
  }

  /**
   * Initialize default configuration values
   */
  async initializeDefaultConfig(): Promise<void> {
    this.logger.log('Initializing default FreeSWITCH configuration...');

    const defaultConfigs = [
      // Network Configuration
      { category: 'network', name: 'external_ip_mode', value: 'stun', type: 'enum', description: 'External IP detection mode' },
      { category: 'network', name: 'external_ip', value: '', type: 'string', description: 'Manual external IP address' },
      { category: 'network', name: 'bind_server_ip', value: 'auto', type: 'string', description: 'Server bind IP' },
      { category: 'network', name: 'rtp_start_port', value: '16384', type: 'number', description: 'RTP port range start' },
      { category: 'network', name: 'rtp_end_port', value: '32768', type: 'number', description: 'RTP port range end' },

      // SIP Configuration
      { category: 'sip', name: 'sip_port', value: '5060', type: 'number', description: 'SIP port' },
      { category: 'sip', name: 'sip_port_tls', value: '5061', type: 'number', description: 'SIP TLS port' },
      { category: 'sip', name: 'sip_domain', value: 'localhost', type: 'string', description: 'SIP domain' },
      { category: 'sip', name: 'context', value: 'default', type: 'string', description: 'Default context' },
    ];

    for (const configData of defaultConfigs) {
      const existing = await this.configRepository.findOne({
        where: { category: configData.category, name: configData.name },
      });

      if (!existing) {
        const config = this.configRepository.create(configData);
        await this.configRepository.save(config);
        this.logger.log(`Created default config: ${configData.category}.${configData.name}`);
      }
    }
  }

  /**
   * Generate event_multicast.conf.xml content
   */
  private async generateEventMulticastXml(): Promise<string> {
    // Get multicast config from database
    const configStr = await this.getConfigValue('multicast', 'config');
    let multicastConfig;

    if (configStr) {
      try {
        multicastConfig = JSON.parse(configStr);
      } catch (error) {
        this.logger.warn('Failed to parse multicast config from database, using defaults');
        multicastConfig = this.getDefaultMulticastConfig();
      }
    } else {
      multicastConfig = this.getDefaultMulticastConfig();
    }

    const pskSection = multicastConfig.psk ?
      `    <param name="psk" value="${multicastConfig.psk}"/>` :
      '    <!-- <param name="psk" value="ClueCon"/> -->';

    const loopbackSection = multicastConfig.loopback ?
      `    <param name="loopback" value="yes"/>` :
      '    <!-- <param name="loopback" value="no"/>-->';

    return `<configuration name="event_multicast.conf" description="Multicast Event">
  <settings>
    <param name="address" value="${multicastConfig.address}"/>
    <param name="port" value="${multicastConfig.port}"/>
    <param name="bindings" value="${multicastConfig.bindings}"/>
    <param name="ttl" value="${multicastConfig.ttl}"/>
    ${loopbackSection}
    <!-- Uncomment this to enable pre-shared key encryption on the packets. -->
    <!-- For this option to work, you'll need to have the openssl development -->
    <!-- headers installed when you ran ./configure -->
    ${pskSection}
  </settings>
</configuration>
`;
  }

  /**
   * Generate verto.conf.xml content
   */
  private async generateVertoXml(): Promise<string> {
    // Get verto config from database
    const configStr = await this.getConfigValue('webrtc', 'verto_config');
    let vertoConfig;

    if (configStr) {
      try {
        vertoConfig = JSON.parse(configStr);
      } catch (error) {
        this.logger.warn('Failed to parse verto config from database, using defaults');
        vertoConfig = this.getDefaultVertoConfig();
      }
    } else {
      vertoConfig = this.getDefaultVertoConfig();
    }

    if (!vertoConfig.enabled) {
      return `<configuration name="verto.conf" description="HTML5 Verto Endpoint">
  <!-- Verto is disabled -->
</configuration>
`;
    }

    return `<configuration name="verto.conf" description="HTML5 Verto Endpoint">

  <settings>
    <param name="debug" value="0"/>
    <param name="rtp-ip" value="$\${local_ip_v4}"/>
    <param name="ext-rtp-ip" value="$\${external_rtp_ip}"/>
    <param name="local-network" value="localnet.auto"/>
    <param name="outbound-codec-string" value="${vertoConfig.outboundCodecs}"/>
    <param name="inbound-codec-string" value="${vertoConfig.inboundCodecs}"/>
  </settings>

  <profiles>
    <profile name="default-v4">
      <param name="bind-local" value="$\${local_ip_v4}:${vertoConfig.port}"/>
      <param name="bind-local" value="$\${local_ip_v4}:${vertoConfig.securePort}" secure="true"/>
      <param name="force-register-domain" value="$\${domain}"/>
      <param name="secure-combined" value="$\${certs_dir}/wss.pem"/>
      <param name="secure-chain" value="$\${certs_dir}/wss.pem"/>
      <param name="userauth" value="${vertoConfig.userAuth ? 'true' : 'false'}"/>
      <param name="context" value="${vertoConfig.context}"/>
      <param name="dialplan" value="XML"/>
      <param name="blind-reg" value="false"/>
      <param name="mcast-ip" value="${vertoConfig.mcastIp}"/>
      <param name="mcast-port" value="${vertoConfig.mcastPort}"/>
      <param name="rtp-ip" value="$\${local_ip_v4}"/>
      <param name="ext-rtp-ip" value="$\${external_rtp_ip}"/>
      <param name="local-network" value="localnet.auto"/>
      <param name="outbound-codec-string" value="${vertoConfig.outboundCodecs}"/>
      <param name="inbound-codec-string" value="${vertoConfig.inboundCodecs}"/>
      <param name="apply-candidate-acl" value="localnet.auto"/>
      <param name="apply-candidate-acl" value="wan_v4.auto"/>
      <param name="rtp-timeout-sec" value="${vertoConfig.rtpTimeout}"/>
      <param name="rtp-hold-timeout-sec" value="${vertoConfig.rtpHoldTimeout}"/>
      <param name="enable-3pcc" value="${vertoConfig.enable3pcc ? 'true' : 'false'}"/>
    </profile>

    <profile name="default-v6">
      <param name="bind-local" value="[$\${local_ip_v6}]:${vertoConfig.port}"/>
      <param name="bind-local" value="[$\${local_ip_v6}]:${vertoConfig.securePort}" secure="true"/>
      <param name="force-register-domain" value="$\${domain}"/>
      <param name="secure-combined" value="$\${certs_dir}/wss.pem"/>
      <param name="secure-chain" value="$\${certs_dir}/wss.pem"/>
      <param name="userauth" value="${vertoConfig.userAuth ? 'true' : 'false'}"/>
      <param name="context" value="${vertoConfig.context}"/>
      <param name="dialplan" value="XML"/>
      <param name="blind-reg" value="false"/>
      <param name="rtp-ip" value="$\${local_ip_v6}"/>
      <param name="ext-rtp-ip" value="$\${external_rtp_ip}"/>
      <param name="local-network" value="localnet.auto"/>
      <param name="outbound-codec-string" value="${vertoConfig.outboundCodecs}"/>
      <param name="inbound-codec-string" value="${vertoConfig.inboundCodecs}"/>
      <param name="apply-candidate-acl" value="localnet.auto"/>
      <param name="apply-candidate-acl" value="wan_v6.auto"/>
      <param name="rtp-timeout-sec" value="${vertoConfig.rtpTimeout}"/>
      <param name="rtp-hold-timeout-sec" value="${vertoConfig.rtpHoldTimeout}"/>
      <param name="enable-3pcc" value="${vertoConfig.enable3pcc ? 'true' : 'false'}"/>
    </profile>
  </profiles>

</configuration>
`;
  }

  /**
   * Get default multicast configuration
   */
  private getDefaultMulticastConfig(): any {
    return {
      address: '225.1.1.1',
      port: 4242,
      bindings: 'all',
      ttl: 1,
      loopback: false
    };
  }

  /**
   * Get default Verto configuration
   */
  private getDefaultVertoConfig(): any {
    return {
      enabled: false,
      port: 8081,
      securePort: 8082,
      mcastIp: '224.1.1.1',
      mcastPort: 1337,
      userAuth: true,
      context: 'default',
      outboundCodecs: 'opus,vp8',
      inboundCodecs: 'opus,vp8',
      rtpTimeout: 300,
      rtpHoldTimeout: 1800,
      enable3pcc: true
    };
  }
}
