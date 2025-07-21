import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { FreeSwitchSipProfile } from './freeswitch-sip-profile.entity';
import { FreeSwitchGateway } from './freeswitch-gateway.entity';
import { FreeSwitchDialplan } from './freeswitch-dialplan.entity';
import { FreeSwitchExtension } from './freeswitch-extension.entity';

export interface DomainSettings {
  // SIP Settings
  default_gateway?: string;
  default_areacode?: string;
  transfer_fallback_extension?: string;
  
  // Recording Settings
  record_stereo?: boolean;
  recording_enabled?: boolean;
  recording_path?: string;
  
  // Voicemail Settings
  voicemail_enabled?: boolean;
  voicemail_domain?: string;
  
  // Security Settings
  registration_required?: boolean;
  allow_anonymous_calls?: boolean;
  
  // Custom settings
  [key: string]: any;
}

export interface BillingSettings {
  billing_enabled?: boolean;
  billing_plan?: string;
  cost_center?: string;
  currency?: string;
  rate_table?: string;
  
  // Limits
  max_concurrent_calls?: number;
  max_call_duration?: number;
  max_monthly_minutes?: number;
  
  [key: string]: any;
}

@Entity('freeswitch_domains')
@Index(['name'], { unique: true })
@Index(['isActive'])
@Index(['createdBy'])
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'max_users', type: 'int', default: 100 })
  maxUsers: number;

  @Column({ name: 'max_extensions', type: 'int', default: 1000 })
  maxExtensions: number;

  @Column({ name: 'max_concurrent_calls', type: 'int', default: 50 })
  maxConcurrentCalls: number;

  @Column({ type: 'jsonb', default: {} })
  settings: DomainSettings;

  @Column({ name: 'billing_settings', type: 'jsonb', default: {} })
  billingSettings: BillingSettings;

  @Column({ name: 'admin_email', length: 255 })
  adminEmail: string;

  @Column({ name: 'admin_phone', length: 50, nullable: true })
  adminPhone?: string;

  @Column({ name: 'timezone', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ name: 'language', length: 10, default: 'en' })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  @OneToMany(() => FreeSwitchSipProfile, profile => profile.domain)
  sipProfiles?: FreeSwitchSipProfile[];

  @OneToMany(() => FreeSwitchGateway, gateway => gateway.domain)
  gateways?: FreeSwitchGateway[];

  @OneToMany(() => FreeSwitchDialplan, dialplan => dialplan.domain)
  dialplans?: FreeSwitchDialplan[];

  @OneToMany(() => FreeSwitchExtension, extension => extension.domain)
  extensions?: FreeSwitchExtension[];

  @OneToMany(() => User, user => user.domain)
  users?: User[];

  // Helper methods
  getDirectoryXml(): string {
    return `
  <domain name="${this.name}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=${'$' + '{domain_name}'}:presence_id=${'$' + '{dialed_user}'}@${'$' + '{dialed_domain}'}}user/${'$' + '{dialed_user}'}@${'$' + '{dialed_domain}'}"/>
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <param name="jsonrpc-allowed-event-channels" value="demo,conference,presence"/>
    </params>
    <variables>
      <variable name="record_stereo" value="${this.settings.record_stereo ? 'true' : 'false'}"/>
      <variable name="default_gateway" value="${this.settings.default_gateway || '$' + '{default_provider}'}"/>
      <variable name="default_areacode" value="${this.settings.default_areacode || '$' + '{default_areacode}'}"/>
      <variable name="transfer_fallback_extension" value="${this.settings.transfer_fallback_extension || 'operator'}"/>
      ${Object.entries(this.settings).map(([key, value]) => 
        `<variable name="${key}" value="${value}"/>`
      ).join('\n      ')}
    </variables>
    <groups>
      <group name="default">
        <users>
          <!-- Users will be inserted here -->
        </users>
      </group>
    </groups>
  </domain>`;
  }

  // Validation methods
  isValidDomainName(): boolean {
    // Domain name validation (RFC compliant)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(this.name);
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.adminEmail);
  }

  hasReachedUserLimit(): boolean {
    return this.users ? this.users.length >= this.maxUsers : false;
  }

  hasReachedExtensionLimit(): boolean {
    return this.extensions ? this.extensions.length >= this.maxExtensions : false;
  }

  getUsageStats(): {
    users: { current: number; max: number; percentage: number };
    extensions: { current: number; max: number; percentage: number };
  } {
    const currentUsers = this.users?.length || 0;
    const currentExtensions = this.extensions?.length || 0;

    return {
      users: {
        current: currentUsers,
        max: this.maxUsers,
        percentage: Math.round((currentUsers / this.maxUsers) * 100),
      },
      extensions: {
        current: currentExtensions,
        max: this.maxExtensions,
        percentage: Math.round((currentExtensions / this.maxExtensions) * 100),
      },
    };
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name) {
      errors.push('Domain name is required');
    } else if (!this.isValidDomainName()) {
      errors.push('Invalid domain name format');
    }

    if (!this.adminEmail) {
      errors.push('Admin email is required');
    } else if (!this.isValidEmail()) {
      errors.push('Invalid admin email format');
    }

    if (this.maxUsers <= 0) {
      errors.push('Max users must be greater than 0');
    }

    if (this.maxExtensions <= 0) {
      errors.push('Max extensions must be greater than 0');
    }

    if (this.maxConcurrentCalls <= 0) {
      errors.push('Max concurrent calls must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Static factory methods
  static createBasicDomain(
    name: string,
    displayName: string,
    adminEmail: string,
    createdBy?: number
  ): Partial<Domain> {
    return {
      name,
      displayName,
      adminEmail,
      isActive: true,
      maxUsers: 100,
      maxExtensions: 1000,
      maxConcurrentCalls: 50,
      settings: {
        recording_enabled: true,
        voicemail_enabled: true,
        registration_required: true,
        allow_anonymous_calls: false,
      },
      billingSettings: {
        billing_enabled: false,
        currency: 'USD',
      },
      timezone: 'UTC',
      language: 'en',
      createdBy,
    };
  }
}
