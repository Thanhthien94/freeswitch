import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Domain } from './domain.entity';
import { User } from '../../users/user.entity';
import { FreeSwitchSipProfile } from './freeswitch-sip-profile.entity';

export interface GatewayConfig {
  // Connection Settings
  ping?: number;
  ping_max?: number;
  ping_min?: number;
  
  // Registration Settings
  register_transport?: 'udp' | 'tcp' | 'tls';
  contact_params?: string;
  contact_host?: string;
  
  // Codec Settings
  codec_prefs?: string;
  
  // Custom parameters
  [key: string]: any;
}

export interface AuthSettings {
  auth_username?: string;
  auth_password?: string;
  auth_realm?: string;
  
  // Advanced auth
  digest_auth?: boolean;
  sip_cid_type?: string;
  
  [key: string]: any;
}

export interface RoutingSettings {
  // Routing
  prefix?: string;
  suffix?: string;
  
  // Caller ID
  caller_id_in_from?: boolean;
  supress_cng?: boolean;
  
  // Failover
  failover_to?: string;
  
  [key: string]: any;
}

@Entity('freeswitch_gateways')
@Index(['profileId'])
@Index(['domainId'])
@Index(['isActive'])
export class FreeSwitchGateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ name: 'domain_id', type: 'uuid', nullable: true })
  domainId?: string;

  @Column({ name: 'gateway_host', length: 255 })
  gatewayHost: string;

  @Column({ name: 'gateway_port', type: 'int', default: 5060 })
  gatewayPort: number;

  @Column({ length: 100, nullable: true })
  username?: string;

  @Column({ length: 255, nullable: true })
  password?: string;

  @Column({ length: 255, nullable: true })
  realm?: string;

  @Column({ name: 'from_user', length: 100, nullable: true })
  fromUser?: string;

  @Column({ name: 'from_domain', length: 255, nullable: true })
  fromDomain?: string;

  @Column({ length: 255, nullable: true })
  proxy?: string;

  @Column({ type: 'boolean', default: true })
  register: boolean;

  @Column({ name: 'register_transport', length: 20, default: 'udp' })
  registerTransport: string;

  @Column({ name: 'expire_seconds', type: 'int', default: 3600 })
  expireSeconds: number;

  @Column({ name: 'retry_seconds', type: 'int', default: 30 })
  retrySeconds: number;

  @Column({ name: 'caller_id_in_from', type: 'boolean', default: false })
  callerIdInFrom: boolean;

  @Column({ length: 50, nullable: true })
  extension?: string;

  @Column({ name: 'gateway_config', type: 'jsonb', default: {} })
  gatewayConfig: GatewayConfig;

  @Column({ name: 'auth_settings', type: 'jsonb', default: {} })
  authSettings: AuthSettings;

  @Column({ name: 'routing_settings', type: 'jsonb', default: {} })
  routingSettings: RoutingSettings;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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
  @ManyToOne(() => FreeSwitchSipProfile, profile => profile.gateways, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: FreeSwitchSipProfile;

  @ManyToOne(() => Domain, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'domain_id' })
  domain?: Domain;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  // Helper methods
  getXmlConfiguration(): string {
    return `
    <gateway name="${this.name}">
      <param name="username" value="${this.username || ''}"/>
      <param name="realm" value="${this.realm || this.gatewayHost}"/>
      <param name="from-user" value="${this.fromUser || this.username || ''}"/>
      <param name="from-domain" value="${this.fromDomain || this.gatewayHost}"/>
      <param name="password" value="${this.password || ''}"/>
      <param name="extension" value="${this.extension || ''}"/>
      <param name="proxy" value="${this.proxy || this.gatewayHost}"/>
      <param name="register-proxy" value="${this.proxy || this.gatewayHost}"/>
      <param name="expire-seconds" value="${this.expireSeconds}"/>
      <param name="register" value="${this.register ? 'true' : 'false'}"/>
      <param name="register-transport" value="${this.registerTransport}"/>
      <param name="retry-seconds" value="${this.retrySeconds}"/>
      <param name="caller-id-in-from" value="${this.callerIdInFrom ? 'true' : 'false'}"/>
      ${this.gatewayConfig.ping ? `<param name="ping" value="${this.gatewayConfig.ping}"/>` : ''}
      ${this.gatewayConfig.ping_max ? `<param name="ping-max" value="${this.gatewayConfig.ping_max}"/>` : ''}
      ${this.gatewayConfig.ping_min ? `<param name="ping-min" value="${this.gatewayConfig.ping_min}"/>` : ''}
      ${this.gatewayConfig.contact_params ? `<param name="contact-params" value="${this.gatewayConfig.contact_params}"/>` : ''}
      ${this.gatewayConfig.contact_host ? `<param name="contact-host" value="${this.gatewayConfig.contact_host}"/>` : ''}
      ${this.authSettings.sip_cid_type ? `<param name="sip-cid-type" value="${this.authSettings.sip_cid_type}"/>` : ''}
      ${this.routingSettings.prefix ? `<param name="prefix" value="${this.routingSettings.prefix}"/>` : ''}
      ${this.routingSettings.suffix ? `<param name="suffix" value="${this.routingSettings.suffix}"/>` : ''}
      ${Object.entries(this.gatewayConfig).map(([key, value]) => {
        if (['ping', 'ping_max', 'ping_min', 'contact_params', 'contact_host'].includes(key)) {
          return ''; // Already handled above
        }
        return `<param name="${key.replace(/_/g, '-')}" value="${value}"/>`;
      }).filter(Boolean).join('\n      ')}
    </gateway>`;
  }

  getConnectionString(): string {
    const auth = this.username && this.password ? `${this.username}:${this.password}@` : '';
    const port = this.gatewayPort !== 5060 ? `:${this.gatewayPort}` : '';
    return `sip:${auth}${this.gatewayHost}${port}`;
  }

  isRegistered(): boolean {
    return this.register && !!this.username && !!this.password;
  }

  getDialString(number: string): string {
    const prefix = this.routingSettings.prefix || '';
    const suffix = this.routingSettings.suffix || '';
    return `sofia/gateway/${this.name}/${prefix}${number}${suffix}`;
  }
}
