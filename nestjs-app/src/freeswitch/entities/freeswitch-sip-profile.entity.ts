import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Domain } from './domain.entity';
import { User } from '../../users/user.entity';
import { FreeSwitchGateway } from './freeswitch-gateway.entity';
import { FreeSwitchExtension } from './freeswitch-extension.entity';

export enum FreeSwitchProfileType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  CUSTOM = 'custom',
}

export interface SipProfileSettings {
  // Basic Settings
  context?: string;
  dialplan?: string;
  dtmf_duration?: number;
  dtmf_type?: string;
  
  // Authentication
  auth_calls?: boolean;
  accept_blind_reg?: boolean;
  accept_blind_auth?: boolean;
  
  // Network Settings
  rtp_timer_name?: string;
  rtp_timeout_sec?: number;
  rtp_hold_timeout_sec?: number;
  
  // Media Settings
  disable_rtp_auto_adjust?: boolean;
  inbound_codec_prefs?: string;
  outbound_codec_prefs?: string;
  
  // Custom parameters
  [key: string]: any;
}

export interface SecuritySettings {
  apply_inbound_acl?: string;
  apply_register_acl?: string;
  auth_all_packets?: boolean;
  tls_enabled?: boolean;
  tls_cert_dir?: string;
  tls_private_key?: string;
  tls_ca_file?: string;
  [key: string]: any;
}

export interface CodecSettings {
  inbound_codec_prefs?: string[];
  outbound_codec_prefs?: string[];
  inbound_codec_negotiation?: string;
  outbound_codec_negotiation?: string;
  disable_transcoding?: boolean;
  [key: string]: any;
}

@Entity('freeswitch_sip_profiles')
@Index(['domainId'])
@Index(['type'])
@Index(['isActive'])
export class FreeSwitchSipProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FreeSwitchProfileType,
    default: FreeSwitchProfileType.CUSTOM,
  })
  type: FreeSwitchProfileType;

  @Column({ name: 'domain_id', type: 'int', nullable: true })
  domainId?: number;

  @Column({ name: 'bind_ip', type: 'inet', nullable: true })
  bindIp?: string;

  @Column({ name: 'bind_port', type: 'int', default: 5060 })
  bindPort: number;

  @Column({ name: 'tls_port', type: 'int', nullable: true })
  tlsPort?: number;

  @Column({ name: 'rtp_ip', type: 'inet', nullable: true })
  rtpIp?: string;

  @Column({ name: 'ext_rtp_ip', type: 'inet', nullable: true })
  extRtpIp?: string;

  @Column({ name: 'ext_sip_ip', type: 'inet', nullable: true })
  extSipIp?: string;

  @Column({ name: 'sip_port', type: 'int', nullable: true })
  sipPort?: number;

  @Column({ type: 'jsonb', default: {} })
  settings: SipProfileSettings;

  @Column({ name: 'advanced_settings', type: 'jsonb', default: {} })
  advancedSettings: Record<string, any>;

  @Column({ name: 'security_settings', type: 'jsonb', default: {} })
  securitySettings: SecuritySettings;

  @Column({ name: 'codec_settings', type: 'jsonb', default: {} })
  codecSettings: CodecSettings;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;

  // Relations
  @ManyToOne(() => Domain, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'domain_id' })
  domain?: Domain;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  @OneToMany(() => FreeSwitchGateway, gateway => gateway.profile)
  gateways?: FreeSwitchGateway[];

  @OneToMany(() => FreeSwitchExtension, extension => extension.profile)
  extensions?: FreeSwitchExtension[];

  // Helper methods
  getXmlConfiguration(): string {
    return `
    <profile name="${this.name}">
      <aliases>
        <alias name="${this.name}"/>
      </aliases>
      <gateways>
        <!-- Gateways will be inserted here -->
      </gateways>
      <domains>
        <domain name="all" alias="false" parse="true"/>
      </domains>
      <settings>
        <param name="debug" value="0"/>
        <param name="sip-trace" value="no"/>
        <param name="sip-capture" value="no"/>
        <param name="rfc2833-pt" value="101"/>
        <param name="sip-port" value="${this.bindPort}"/>
        <param name="dialplan" value="${this.settings.dialplan || 'XML'}"/>
        <param name="context" value="${this.settings.context || 'public'}"/>
        <param name="dtmf-duration" value="${this.settings.dtmf_duration || 2000}"/>
        <param name="dtmf-type" value="${this.settings.dtmf_type || 'rfc2833'}"/>
        <param name="use-rtp-timer" value="true"/>
        <param name="rtp-timer-name" value="${this.settings.rtp_timer_name || 'soft'}"/>
        <param name="rtp-ip" value="${this.rtpIp || '$' + '{local_ip_v4}'}"/>
        <param name="sip-ip" value="${this.bindIp || '$' + '{local_ip_v4}'}"/>
        <param name="hold-music" value="${'$' + '{hold_music}'}"/>
        <param name="apply-nat-acl" value="nat.auto"/>
        <param name="manage-presence" value="true"/>
        <param name="presence-hosts" value="${this.bindIp || '$' + '{domain}'}"/>
        <param name="presence-privacy" value="${'$' + '{presence_privacy}'}"/>
        <param name="inbound-codec-prefs" value="${this.codecSettings.inbound_codec_prefs?.join(',') || '$' + '{global_codec_prefs}'}"/>
        <param name="outbound-codec-prefs" value="${this.codecSettings.outbound_codec_prefs?.join(',') || '$' + '{global_codec_prefs}'}"/>
        <param name="inbound-codec-negotiation" value="${this.codecSettings.inbound_codec_negotiation || 'generous'}"/>
        <param name="outbound-codec-negotiation" value="${this.codecSettings.outbound_codec_negotiation || 'generous'}"/>
        <param name="auth-calls" value="${this.settings.auth_calls ? 'true' : 'false'}"/>
        <param name="accept-blind-reg" value="${this.settings.accept_blind_reg ? 'true' : 'false'}"/>
        <param name="accept-blind-auth" value="${this.settings.accept_blind_auth ? 'true' : 'false'}"/>
        ${this.tlsPort ? `<param name="tls-sip-port" value="${this.tlsPort}"/>` : ''}
        ${this.securitySettings.tls_enabled ? '<param name="tls" value="true"/>' : ''}
        ${Object.entries(this.advancedSettings).map(([key, value]) => 
          `<param name="${key}" value="${value}"/>`
        ).join('\n        ')}
      </settings>
    </profile>`;
  }

  isInternal(): boolean {
    return this.type === FreeSwitchProfileType.INTERNAL;
  }

  isExternal(): boolean {
    return this.type === FreeSwitchProfileType.EXTERNAL;
  }

  getDefaultContext(): string {
    return this.isInternal() ? 'default' : 'public';
  }
}
