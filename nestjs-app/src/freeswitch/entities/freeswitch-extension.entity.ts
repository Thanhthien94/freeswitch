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

export interface DirectorySettings {
  // User variables
  user_context?: string;
  effective_caller_id_name?: string;
  effective_caller_id_number?: string;
  outbound_caller_id_name?: string;
  outbound_caller_id_number?: string;
  
  // Voicemail settings
  vm_enabled?: boolean;
  vm_password?: string;
  vm_email_all_messages?: boolean;
  vm_attach_file?: boolean;
  vm_mailto?: string;
  
  // Call settings
  call_timeout?: number;
  call_screen?: boolean;
  max_calls?: number;
  
  // Custom variables
  [key: string]: any;
}

export interface DialSettings {
  // Dial string settings
  dial_string?: string;
  presence_id?: string;
  
  // Call forwarding
  call_forward_all?: string;
  call_forward_busy?: string;
  call_forward_no_answer?: string;
  
  // Do not disturb
  do_not_disturb?: boolean;
  
  [key: string]: any;
}

export interface VoicemailSettings {
  enabled?: boolean;
  password?: string;
  greeting_id?: number;
  email_address?: string;
  attach_file?: boolean;
  delete_file?: boolean;
  say_menu?: boolean;
  say_cid?: boolean;
  say_file?: boolean;
  say_date?: boolean;
  
  [key: string]: any;
}

@Entity('freeswitch_extensions')
@Index(['extensionNumber'])
@Index(['domainId'])
@Index(['userId'])
@Index(['extensionNumber', 'domainId'], { unique: true })
export class FreeSwitchExtension {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extension_number', length: 50 })
  extensionNumber: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'domain_id', type: 'uuid', nullable: true })
  domainId?: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number;

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId?: string;

  @Column({ length: 255, nullable: true })
  password?: string;

  @Column({ name: 'effective_caller_id_name', length: 100, nullable: true })
  effectiveCallerIdName?: string;

  @Column({ name: 'effective_caller_id_number', length: 50, nullable: true })
  effectiveCallerIdNumber?: string;

  @Column({ name: 'outbound_caller_id_name', length: 100, nullable: true })
  outboundCallerIdName?: string;

  @Column({ name: 'outbound_caller_id_number', length: 50, nullable: true })
  outboundCallerIdNumber?: string;

  @Column({ name: 'directory_settings', type: 'jsonb', default: {} })
  directorySettings: DirectorySettings;

  @Column({ name: 'dial_settings', type: 'jsonb', default: {} })
  dialSettings: DialSettings;

  @Column({ name: 'voicemail_settings', type: 'jsonb', default: {} })
  voicemailSettings: VoicemailSettings;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => FreeSwitchSipProfile, profile => profile.extensions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_id' })
  profile?: FreeSwitchSipProfile;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  // Helper methods
  getDirectoryXml(): string {
    const domainName = this.domain?.name || '${domain_name}';
    const userContext = this.directorySettings.user_context || 'default';
    const effectiveCallerIdName = this.effectiveCallerIdName || this.displayName || this.extensionNumber;
    const effectiveCallerIdNumber = this.effectiveCallerIdNumber || this.extensionNumber;
    
    return `
    <user id="${this.extensionNumber}">
      <params>
        <param name="password" value="${this.password || '1234'}"/>
        <param name="vm-password" value="${this.voicemailSettings.password || this.extensionNumber}"/>
        <param name="vm-email-all-messages" value="${this.voicemailSettings.email_address ? 'true' : 'false'}"/>
        ${this.voicemailSettings.email_address ? `<param name="vm-mailto" value="${this.voicemailSettings.email_address}"/>` : ''}
        <param name="vm-attach-file" value="${this.voicemailSettings.attach_file ? 'true' : 'false'}"/>
        <param name="vm-delete-file" value="${this.voicemailSettings.delete_file ? 'true' : 'false'}"/>
      </params>
      <variables>
        <variable name="toll_allow" value="domestic,international,local"/>
        <variable name="accountcode" value="${this.extensionNumber}"/>
        <variable name="user_context" value="${userContext}"/>
        <variable name="effective_caller_id_name" value="${effectiveCallerIdName}"/>
        <variable name="effective_caller_id_number" value="${effectiveCallerIdNumber}"/>
        ${this.outboundCallerIdName ? `<variable name="outbound_caller_id_name" value="${this.outboundCallerIdName}"/>` : ''}
        ${this.outboundCallerIdNumber ? `<variable name="outbound_caller_id_number" value="${this.outboundCallerIdNumber}"/>` : ''}
        <variable name="callgroup" value="techsupport"/>
        <variable name="call_timeout" value="${this.directorySettings.call_timeout || 30}"/>
        ${this.directorySettings.max_calls ? `<variable name="max_calls" value="${this.directorySettings.max_calls}"/>` : ''}
        ${this.dialSettings.call_forward_all ? `<variable name="call_forward_all" value="${this.dialSettings.call_forward_all}"/>` : ''}
        ${this.dialSettings.call_forward_busy ? `<variable name="call_forward_busy" value="${this.dialSettings.call_forward_busy}"/>` : ''}
        ${this.dialSettings.call_forward_no_answer ? `<variable name="call_forward_no_answer" value="${this.dialSettings.call_forward_no_answer}"/>` : ''}
        ${this.dialSettings.do_not_disturb ? '<variable name="do_not_disturb" value="true"/>' : ''}
        ${Object.entries(this.directorySettings).map(([key, value]) => 
          `<variable name="${key}" value="${value}"/>`
        ).join('\n        ')}
      </variables>
    </user>`;
  }

  getDialString(): string {
    if (this.dialSettings.dial_string) {
      return this.dialSettings.dial_string;
    }

    const domainName = this.domain?.name || '${domain_name}';
    const presenceId = this.dialSettings.presence_id || `${this.extensionNumber}@${domainName}`;
    
    return `{^^:sip_invite_domain=${domainName}:presence_id=${presenceId}}user/${this.extensionNumber}@${domainName}`;
  }

  // Validation methods
  isValidExtensionNumber(): boolean {
    return /^[0-9]{3,10}$/.test(this.extensionNumber);
  }

  isValidPassword(): boolean {
    return this.password && this.password.length >= 4;
  }

  hasVoicemail(): boolean {
    return this.voicemailSettings.enabled !== false;
  }

  isCallForwardingEnabled(): boolean {
    return !!(
      this.dialSettings.call_forward_all ||
      this.dialSettings.call_forward_busy ||
      this.dialSettings.call_forward_no_answer
    );
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.extensionNumber) {
      errors.push('Extension number is required');
    } else if (!this.isValidExtensionNumber()) {
      errors.push('Extension number must be 3-10 digits');
    }

    if (!this.isValidPassword()) {
      errors.push('Password must be at least 4 characters');
    }

    if (this.voicemailSettings.enabled && this.voicemailSettings.email_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.voicemailSettings.email_address)) {
        errors.push('Invalid email address for voicemail');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Static factory methods
  static createBasicExtension(
    extensionNumber: string,
    displayName: string,
    password: string,
    domainId?: string
  ): Partial<FreeSwitchExtension> {
    return {
      extensionNumber,
      displayName,
      password,
      domainId,
      effectiveCallerIdName: displayName,
      effectiveCallerIdNumber: extensionNumber,
      directorySettings: {
        user_context: 'default',
        call_timeout: 30,
        vm_enabled: true
      },
      voicemailSettings: {
        enabled: true,
        password: extensionNumber,
        attach_file: false,
        delete_file: false
      }
    };
  }
}
