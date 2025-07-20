import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Domain } from '../auth/entities/domain.entity';
import { User } from '../users/user.entity';

export enum ExtensionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum ExtensionType {
  USER = 'user',
  CONFERENCE = 'conference',
  QUEUE = 'queue',
  IVR = 'ivr',
  VOICEMAIL = 'voicemail',
  GATEWAY = 'gateway',
}

@Entity('extensions')
@Index(['extension', 'domainId'], { unique: true })
@Index(['extension'])
@Index(['domainId'])
@Index(['status'])
@Index(['userId'])
export class Extension {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  extension: string;

  @Column({ name: 'domain_id' })
  domainId: string;

  @ManyToOne(() => Domain, { nullable: false })
  @JoinColumn({ name: 'domain_id' })
  domain: Domain;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExtensionType,
    default: ExtensionType.USER,
  })
  type: ExtensionType;

  @Column({
    type: 'enum',
    enum: ExtensionStatus,
    default: ExtensionStatus.ACTIVE,
  })
  status: ExtensionStatus;

  // SIP Authentication
  @Column({ name: 'sip_password' })
  @Exclude()
  sipPassword: string;

  @Column({ name: 'freeswitch_password', nullable: true })
  @Exclude()
  freeswitchPassword: string; // Plain password for FreeSWITCH XML

  @Column({ name: 'auth_id', nullable: true })
  authId: string;

  // Call Settings
  @Column({ name: 'caller_id_name', length: 100, nullable: true })
  callerIdName: string;

  @Column({ name: 'caller_id_number', length: 20, nullable: true })
  callerIdNumber: string;

  @Column({ name: 'outbound_caller_id_name', length: 100, nullable: true })
  outboundCallerIdName: string;

  @Column({ name: 'outbound_caller_id_number', length: 20, nullable: true })
  outboundCallerIdNumber: string;

  // Voicemail Settings
  @Column({ name: 'voicemail_enabled', default: true })
  voicemailEnabled: boolean;

  @Column({ name: 'voicemail_password', length: 20, nullable: true })
  @Exclude()
  voicemailPassword: string;

  @Column({ name: 'voicemail_email', length: 255, nullable: true })
  voicemailEmail: string;

  @Column({ name: 'voicemail_attach_file', default: false })
  voicemailAttachFile: boolean;

  @Column({ name: 'voicemail_delete_file', default: false })
  voicemailDeleteFile: boolean;

  // Call Forwarding
  @Column({ name: 'call_forward_enabled', default: false })
  callForwardEnabled: boolean;

  @Column({ name: 'call_forward_destination', length: 50, nullable: true })
  callForwardDestination: string;

  @Column({ name: 'call_forward_on_busy', default: false })
  callForwardOnBusy: boolean;

  @Column({ name: 'call_forward_on_no_answer', default: false })
  callForwardOnNoAnswer: boolean;

  @Column({ name: 'call_forward_timeout', default: 20 })
  callForwardTimeout: number;

  // Call Recording
  @Column({ name: 'call_recording_enabled', default: false })
  callRecordingEnabled: boolean;

  @Column({ name: 'call_recording_mode', length: 20, default: 'none' })
  callRecordingMode: string; // none, inbound, outbound, all

  // DND and Presence
  @Column({ name: 'dnd_enabled', default: false })
  dndEnabled: boolean;

  @Column({ name: 'presence_id', length: 100, nullable: true })
  presenceId: string;

  // Advanced Settings
  @Column({ name: 'max_calls', default: 1 })
  maxCalls: number;

  @Column({ name: 'call_timeout', default: 30 })
  callTimeout: number;

  @Column({ name: 'call_group', length: 100, nullable: true })
  callGroup: string;

  @Column({ name: 'pickup_group', length: 100, nullable: true })
  pickupGroup: string;

  // Codec Settings
  @Column({ name: 'codec_prefs', length: 255, nullable: true })
  codecPrefs: string;

  // Network Settings
  @Column({ name: 'force_ping', default: false })
  forcePing: boolean;

  @Column({ name: 'sip_force_contact', length: 255, nullable: true })
  sipForceContact: string;

  @Column({ name: 'sip_force_expires', nullable: true })
  sipForceExpires: number;

  // Registration Info (Runtime data)
  @Column({ name: 'is_registered', default: false })
  isRegistered: boolean;

  @Column({ name: 'last_registration', type: 'timestamptz', nullable: true })
  lastRegistration: Date;

  @Column({ name: 'registration_ip', length: 45, nullable: true })
  registrationIp: string;

  @Column({ name: 'user_agent', length: 255, nullable: true })
  userAgent: string;

  // Custom Variables
  @Column({ type: 'jsonb', default: '{}' })
  variables: Record<string, any>;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  // Virtual field for password (not stored in DB)
  password?: string;

  // Additional properties for FreeSWITCH directory generation
  @Column({ name: 'toll_allow', nullable: true })
  tollAllow?: string;

  @Column({ name: 'account_code', nullable: true })
  accountCode?: string;

  @Column({ name: 'context', default: 'default' })
  context: string;

  @Column({ name: 'hangup_after_bridge', default: false })
  hangupAfterBridge: boolean;

  @Column({ name: 'continue_on_fail', default: false })
  continueOnFail: boolean;

  @Column({ name: 'forward_all', nullable: true })
  forwardAll?: string;

  @Column({ name: 'forward_busy', nullable: true })
  forwardBusy?: string;

  @Column({ name: 'forward_no_answer', nullable: true })
  forwardNoAnswer?: string;

  @Column({ name: 'record_calls', default: false })
  recordCalls: boolean;

  @Column({ name: 'vm_password', nullable: true })
  vmPassword?: string;

  @Column({ name: 'a1_hash', nullable: true })
  a1Hash?: string;

  // JSON columns for flexible configuration
  @Column({ type: 'jsonb', default: '{}' })
  params: Record<string, any>;

  // Password hashing hooks - DISABLED to avoid conflict with manual hashing
  // @BeforeInsert()
  // @BeforeUpdate()
  // async hashSipPassword() {
  //   if (this.password) {
  //     // For SIP, we typically use MD5 hash or plain text
  //     // For now, using bcrypt for security
  //     const saltRounds = 10;
  //     this.sipPassword = await bcrypt.hash(this.password, saltRounds);
  //     delete this.password; // Remove plain password after hashing
  //   }
  // }

  // Password validation method
  async validateSipPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.sipPassword);
  }

  // Computed properties
  get fullExtension(): string {
    return `${this.extension}@${this.domain?.name || 'unknown'}`;
  }

  get isActive(): boolean {
    return this.status === ExtensionStatus.ACTIVE;
  }

  get displayInfo(): string {
    return `${this.extension} - ${this.displayName}`;
  }

  // Helper methods
  canMakeCalls(): boolean {
    return this.isActive && this.isRegistered && !this.dndEnabled;
  }

  getEffectiveCallerIdName(): string {
    return this.callerIdName || this.displayName || this.extension;
  }

  getEffectiveCallerIdNumber(): string {
    return this.callerIdNumber || this.extension;
  }
}
