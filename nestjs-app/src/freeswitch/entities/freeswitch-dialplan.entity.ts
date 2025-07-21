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

export interface DialplanAction {
  application: string;
  data?: string;
  inline?: boolean;
}

export interface DialplanAntiAction {
  application: string;
  data?: string;
}

export interface DialplanVariables {
  [key: string]: string | number | boolean;
}

export interface DialplanCondition {
  field: string;
  expression: string;
  break?: 'on-true' | 'on-false' | 'always' | 'never';
  actions: DialplanAction[];
  antiActions?: DialplanAntiAction[];
}

@Entity('freeswitch_dialplans')
@Index(['context'])
@Index(['domainId'])
@Index(['isActive'])
@Index(['name', 'context'], { unique: true })
export class FreeSwitchDialplan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, default: 'default' })
  context: string;

  @Column({ name: 'domain_id', type: 'uuid', nullable: true })
  domainId?: string;

  @Column({ name: 'extension_pattern', length: 255, nullable: true })
  extensionPattern?: string;

  @Column({ name: 'condition_field', length: 100, default: 'destination_number' })
  conditionField: string;

  @Column({ name: 'condition_expression', type: 'text', nullable: true })
  conditionExpression?: string;

  @Column({ type: 'jsonb', default: [] })
  actions: DialplanAction[];

  @Column({ name: 'anti_actions', type: 'jsonb', default: [] })
  antiActions: DialplanAntiAction[];

  @Column({ type: 'jsonb', default: {} })
  variables: DialplanVariables;

  @Column({ name: 'dialplan_xml', type: 'text', nullable: true })
  dialplanXml?: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_template', type: 'boolean', default: false })
  isTemplate: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

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

  // Helper methods
  getXmlConfiguration(): string {
    const variablesXml = Object.entries(this.variables).map(([key, value]) => 
      `<action application="set" data="${key}=${value}"/>`
    ).join('\n      ');

    const actionsXml = this.actions.map(action => {
      const inline = action.inline ? ' inline="true"' : '';
      const data = action.data ? ` data="${action.data}"` : '';
      return `<action application="${action.application}"${data}${inline}/>`;
    }).join('\n      ');

    const antiActionsXml = this.antiActions.map(antiAction => {
      const data = antiAction.data ? ` data="${antiAction.data}"` : '';
      return `<anti-action application="${antiAction.application}"${data}/>`;
    }).join('\n      ');

    return `
    <extension name="${this.name}">
      ${this.description ? `<!-- ${this.description} -->` : ''}
      <condition field="${this.conditionField}" expression="${this.conditionExpression || '.*'}">
        ${variablesXml}
        ${actionsXml}
        ${antiActionsXml}
      </condition>
    </extension>`;
  }

  // Common dialplan patterns
  static createBasicExtension(
    name: string,
    extensionNumber: string,
    context: string = 'default'
  ): Partial<FreeSwitchDialplan> {
    return {
      name,
      context,
      extensionPattern: extensionNumber,
      conditionField: 'destination_number',
      conditionExpression: `^(${extensionNumber})$`,
      actions: [
        {
          application: 'export',
          data: 'dialed_extension=$1'
        },
        {
          application: 'bind_meta_app',
          data: '1 b s execute_extension::dx XML features'
        },
        {
          application: 'bind_meta_app',
          data: '2 b s record_session::$${recordings_dir}/${caller_id_number}.${strftime(%Y-%m-%d-%H-%M-%S)}.wav'
        },
        {
          application: 'bind_meta_app',
          data: '3 b s execute_extension::cf XML features'
        },
        {
          application: 'set',
          data: 'ringback=${us-ring}'
        },
        {
          application: 'set',
          data: 'transfer_ringback=$${hold_music}'
        },
        {
          application: 'set',
          data: 'call_timeout=30'
        },
        {
          application: 'set',
          data: 'hangup_after_bridge=true'
        },
        {
          application: 'set',
          data: 'continue_on_fail=true'
        },
        {
          application: 'bridge',
          data: 'user/${extensionNumber}@${domain_name}'
        }
      ]
    };
  }

  static createOutboundRoute(
    name: string,
    pattern: string,
    gateway: string,
    context: string = 'default'
  ): Partial<FreeSwitchDialplan> {
    return {
      name,
      context,
      conditionField: 'destination_number',
      conditionExpression: pattern,
      actions: [
        {
          application: 'set',
          data: 'effective_caller_id_name=${outbound_caller_name}'
        },
        {
          application: 'set',
          data: 'effective_caller_id_number=${outbound_caller_id}'
        },
        {
          application: 'bridge',
          data: `sofia/gateway/${gateway}/$1`
        }
      ]
    };
  }

  static createConferenceExtension(
    name: string,
    conferenceNumber: string,
    context: string = 'default'
  ): Partial<FreeSwitchDialplan> {
    return {
      name,
      context,
      conditionField: 'destination_number',
      conditionExpression: `^(${conferenceNumber})$`,
      actions: [
        {
          application: 'set',
          data: 'conference_auto_outcall_caller_id_name=$${outbound_caller_name}'
        },
        {
          application: 'set',
          data: 'conference_auto_outcall_caller_id_number=$${outbound_caller_id}'
        },
        {
          application: 'conference',
          data: `$1-${conferenceNumber}@default`
        }
      ]
    };
  }

  static createIvrExtension(
    name: string,
    ivrNumber: string,
    ivrMenu: string,
    context: string = 'default'
  ): Partial<FreeSwitchDialplan> {
    return {
      name,
      context,
      conditionField: 'destination_number',
      conditionExpression: `^(${ivrNumber})$`,
      actions: [
        {
          application: 'answer'
        },
        {
          application: 'sleep',
          data: '1000'
        },
        {
          application: 'ivr',
          data: ivrMenu
        }
      ]
    };
  }

  // Validation methods
  isValidExpression(): boolean {
    if (!this.conditionExpression) return false;
    
    try {
      new RegExp(this.conditionExpression);
      return true;
    } catch (error) {
      return false;
    }
  }

  hasRequiredActions(): boolean {
    return this.actions && this.actions.length > 0;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name) {
      errors.push('Name is required');
    }

    if (!this.context) {
      errors.push('Context is required');
    }

    if (!this.isValidExpression()) {
      errors.push('Invalid regular expression in condition');
    }

    if (!this.hasRequiredActions()) {
      errors.push('At least one action is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
