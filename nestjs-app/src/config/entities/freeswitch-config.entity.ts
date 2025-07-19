import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExternalIpMode {
  AUTO = 'auto',
  STUN = 'stun',
  MANUAL = 'manual',
}

export enum SipTransport {
  UDP = 'udp',
  TCP = 'tcp',
  TLS = 'tls',
  WSS = 'wss',
}

@Entity('freeswitch_configs')
@Index(['category', 'name'], { unique: true })
export class FreeSwitchConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  category: string; // 'network', 'sip', 'rtp', 'security', etc.

  @Column({ type: 'varchar', length: 100 })
  name: string; // 'external_ip_mode', 'external_ip', 'sip_port', etc.

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 50, default: 'string' })
  type: string; // 'string', 'number', 'boolean', 'enum', 'json'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  validation_rules: string; // JSON string with validation rules

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  requires_restart: boolean; // Whether changing this requires FreeSWITCH restart

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by: string; // User who last updated this config
}

// Network Configuration Interface
export interface NetworkConfig {
  external_ip_mode: ExternalIpMode;
  external_ip?: string;
  external_rtp_ip?: string;
  external_sip_ip?: string;
  local_ip_v4?: string;
  bind_server_ip?: string;
  rtp_start_port: number;
  rtp_end_port: number;
}

// SIP Configuration Interface
export interface SipConfig {
  sip_port: number;
  sip_port_tls: number;
  sip_domain: string;
  context: string;
  transport: SipTransport[];
  auth_calls: boolean;
  accept_blind_reg: boolean;
  accept_blind_auth: boolean;
  suppress_cng: boolean;
  nonce_ttl: number;
}

// RTP Configuration Interface
export interface RtpConfig {
  rtp_timer_name: string;
  rtp_ip: string;
  rtp_timeout_sec: number;
  rtp_hold_timeout_sec: number;
  disable_rtp_auto_adjust: boolean;
  inbound_codec_prefs: string[];
  outbound_codec_prefs: string[];
}

// Security Configuration Interface
export interface SecurityConfig {
  apply_inbound_acl: string;
  apply_register_acl: string;
  auth_all_packets: boolean;
  ext_rtp_ip: string;
  ext_sip_ip: string;
  force_register_domain: string;
  force_subscription_domain: string;
}

// Complete FreeSWITCH Configuration
export interface FreeSwitchConfiguration {
  network: NetworkConfig;
  sip: SipConfig;
  rtp: RtpConfig;
  security: SecurityConfig;
  [key: string]: any; // Allow additional custom configurations
}
