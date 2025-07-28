import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface NetworkMetadata {
  // Advanced RTP Settings
  rtpTimeout?: number;
  rtpHoldTimeout?: number;
  
  // SIP Settings
  sipSessionTimeout?: number;
  sipMinSessionExpires?: number;
  
  // NAT Settings
  natDetection?: boolean;
  natPingInterval?: number;
  
  // Security Settings
  sipAuthRealm?: string;
  sipAuthMethods?: string[];
  
  // Codec Settings
  codecNegotiation?: 'generous' | 'greedy' | 'scrooge';
  disableTranscoding?: boolean;
  
  // Media Settings
  mediaTimeout?: number;
  mediaHoldTimeout?: number;
  
  // Custom parameters
  [key: string]: any;
}

export enum NetworkConfigStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  ERROR = 'error',
  DISABLED = 'disabled',
}

@Entity('global_network_configs')
@Index(['isActive'])
export class GlobalNetworkConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'config_name', type: 'varchar', length: 100, default: 'default' })
  @Index({ unique: true })
  configName: string;

  @Column({ name: 'display_name', type: 'varchar', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Network Configuration
  @Column({ name: 'external_ip', type: 'varchar', length: 45, nullable: true })
  externalIp?: string;

  @Column({ name: 'bind_server_ip', type: 'varchar', length: 45, default: 'auto' })
  bindServerIp: string;

  @Column({ name: 'domain', type: 'varchar', length: 255, default: 'localhost' })
  domain: string;

  // SIP Ports
  @Column({ name: 'sip_port', type: 'int', default: 5060 })
  sipPort: number;

  @Column({ name: 'external_sip_port', type: 'int', nullable: true })
  externalSipPort?: number;

  @Column({ name: 'tls_port', type: 'int', default: 5061 })
  tlsPort: number;

  @Column({ name: 'external_tls_port', type: 'int', nullable: true })
  externalTlsPort?: number;

  // RTP Configuration
  @Column({ name: 'rtp_start_port', type: 'int', default: 16384 })
  rtpStartPort: number;

  @Column({ name: 'rtp_end_port', type: 'int', default: 16484 })
  rtpEndPort: number;

  @Column({ name: 'external_rtp_ip', type: 'varchar', length: 45, nullable: true })
  externalRtpIp?: string;

  // STUN Configuration
  @Column({ name: 'stun_server', type: 'varchar', length: 255, default: 'stun:stun.freeswitch.org' })
  stunServer: string;

  @Column({ name: 'stun_enabled', type: 'boolean', default: true })
  stunEnabled: boolean;

  // Codec Configuration
  @Column({ name: 'global_codec_prefs', type: 'varchar', length: 500, default: 'OPUS,G722,PCMU,PCMA' })
  globalCodecPrefs: string;

  @Column({ name: 'outbound_codec_prefs', type: 'varchar', length: 500, default: 'OPUS,G722,PCMU,PCMA' })
  outboundCodecPrefs: string;

  // Transport Configuration
  @Column({ name: 'transport_protocols', type: 'simple-array', default: 'udp,tcp' })
  transportProtocols: string[];

  @Column({ name: 'enable_tls', type: 'boolean', default: false })
  enableTls: boolean;

  // NAT Configuration
  @Column({ name: 'nat_detection', type: 'boolean', default: true })
  natDetection: boolean;

  @Column({ name: 'auto_nat', type: 'boolean', default: true })
  autoNat: boolean;

  // Status and Control
  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: NetworkConfigStatus, 
    default: NetworkConfigStatus.ACTIVE 
  })
  @Index()
  status: NetworkConfigStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  @Index()
  isDefault: boolean;

  @Column({ name: 'auto_apply', type: 'boolean', default: false })
  autoApply: boolean;

  // Advanced Configuration
  @Column({ type: 'jsonb', default: {} })
  metadata: NetworkMetadata;

  @Column({ type: 'jsonb', nullable: true })
  tags: any;

  // Audit Fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;

  @Column({ name: 'last_applied_at', type: 'timestamp', nullable: true })
  lastAppliedAt?: Date;

  @Column({ name: 'last_applied_by', type: 'varchar', length: 100, nullable: true })
  lastAppliedBy?: string;

  // Helper Methods
  getExternalIpForConfig(): string {
    if (this.externalIp && this.externalIp !== 'auto') {
      return this.externalIp;
    }
    return this.stunEnabled ? this.stunServer : 'auto';
  }

  getBindIpForConfig(): string {
    return this.bindServerIp === 'auto' ? 'auto' : this.bindServerIp;
  }

  getRtpPortRange(): string {
    return `${this.rtpStartPort}-${this.rtpEndPort}`;
  }

  getTransportProtocolsString(): string {
    return this.transportProtocols.join(',');
  }

  // Validation Methods
  validatePortRanges(): string[] {
    const errors: string[] = [];

    if (this.rtpStartPort >= this.rtpEndPort) {
      errors.push('RTP start port must be less than end port');
    }

    if (this.rtpStartPort < 1024 || this.rtpEndPort > 65535) {
      errors.push('RTP ports must be between 1024 and 65535');
    }

    if (this.sipPort < 1 || this.sipPort > 65535) {
      errors.push('SIP port must be between 1 and 65535');
    }

    if (this.tlsPort < 1 || this.tlsPort > 65535) {
      errors.push('TLS port must be between 1 and 65535');
    }

    if (this.sipPort === this.tlsPort) {
      errors.push('SIP and TLS ports cannot be the same');
    }

    return errors;
  }

  validateIpAddresses(): string[] {
    const errors: string[] = [];
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (this.externalIp && this.externalIp !== 'auto' && !ipRegex.test(this.externalIp)) {
      errors.push('Invalid external IP address format');
    }

    if (this.bindServerIp && this.bindServerIp !== 'auto' && !ipRegex.test(this.bindServerIp)) {
      errors.push('Invalid bind server IP address format');
    }

    if (this.externalRtpIp && this.externalRtpIp !== 'auto' && !ipRegex.test(this.externalRtpIp)) {
      errors.push('Invalid external RTP IP address format');
    }

    return errors;
  }

  validate(): string[] {
    const errors: string[] = [];
    errors.push(...this.validatePortRanges());
    errors.push(...this.validateIpAddresses());
    return errors;
  }

  // Configuration Generation
  generateVarsXmlConfig(): string {
    return `
  <!-- Global Network Configuration - Generated from Database -->
  <X-PRE-PROCESS cmd="set" data="bind_server_ip=${this.getBindIpForConfig()}"/>
  <X-PRE-PROCESS cmd="set" data="external_rtp_ip=${this.getExternalIpForConfig()}"/>
  <X-PRE-PROCESS cmd="set" data="external_sip_ip=${this.getExternalIpForConfig()}"/>
  <X-PRE-PROCESS cmd="set" data="rtp_start_port=${this.rtpStartPort}"/>
  <X-PRE-PROCESS cmd="set" data="rtp_end_port=${this.rtpEndPort}"/>
  <X-PRE-PROCESS cmd="set" data="internal_sip_port=${this.sipPort}"/>
  <X-PRE-PROCESS cmd="set" data="internal_tls_port=${this.tlsPort}"/>
  <X-PRE-PROCESS cmd="set" data="global_codec_prefs=${this.globalCodecPrefs}"/>
  <X-PRE-PROCESS cmd="set" data="outbound_codec_prefs=${this.outboundCodecPrefs}"/>
  <X-PRE-PROCESS cmd="set" data="domain=${this.domain}"/>`;
  }
}
