import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum FreeSwitchConfigType {
  SIP_PROFILE = 'sip_profile',
  GATEWAY = 'gateway',
  DIALPLAN = 'dialplan',
  EXTENSION = 'extension',
  CONFERENCE = 'conference',
  IVR = 'ivr',
}

@Entity('freeswitch_config_versions')
@Index(['configType', 'configId'])
@Index(['isActive'])
@Index(['configType', 'configId', 'version'], { unique: true })
export class FreeSwitchConfigVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'config_type',
    type: 'enum',
    enum: FreeSwitchConfigType,
  })
  configType: FreeSwitchConfigType;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'config_data', type: 'jsonb' })
  configData: Record<string, any>;

  @Column({ name: 'xml_content', type: 'text', nullable: true })
  xmlContent?: string;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary?: string;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  // Helper methods
  getConfigSummary(): string {
    switch (this.configType) {
      case FreeSwitchConfigType.SIP_PROFILE:
        return `SIP Profile: ${this.configData.name} (${this.configData.type})`;
      case FreeSwitchConfigType.GATEWAY:
        return `Gateway: ${this.configData.name} -> ${this.configData.gatewayHost}`;
      case FreeSwitchConfigType.DIALPLAN:
        return `Dialplan: ${this.configData.name} in ${this.configData.context}`;
      case FreeSwitchConfigType.EXTENSION:
        return `Extension: ${this.configData.extensionNumber}`;
      case FreeSwitchConfigType.CONFERENCE:
        return `Conference: ${this.configData.name}`;
      case FreeSwitchConfigType.IVR:
        return `IVR: ${this.configData.name}`;
      default:
        return `${this.configType}: ${this.configData.name || this.configId}`;
    }
  }

  getChangeDescription(): string {
    if (this.changeSummary) {
      return this.changeSummary;
    }

    if (this.version === 1) {
      return 'Initial configuration created';
    }

    return `Configuration updated to version ${this.version}`;
  }

  isLatestVersion(): boolean {
    return this.isActive;
  }

  getConfigSize(): number {
    return JSON.stringify(this.configData).length;
  }

  hasXmlContent(): boolean {
    return !!this.xmlContent;
  }

  // Static methods for version management
  static createVersion(
    configType: FreeSwitchConfigType,
    configId: string,
    configData: Record<string, any>,
    xmlContent?: string,
    changeSummary?: string,
    createdBy?: number
  ): Partial<FreeSwitchConfigVersion> {
    return {
      configType,
      configId,
      configData,
      xmlContent,
      changeSummary,
      createdBy,
      isActive: true, // New version becomes active
    };
  }

  static getVersionKey(configType: FreeSwitchConfigType, configId: string): string {
    return `${configType}:${configId}`;
  }
}

@Entity('freeswitch_config_deployments')
export class FreeSwitchConfigDeployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'deployment_name', length: 200 })
  deploymentName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'domain_id', type: 'uuid', nullable: true })
  domainId?: string;

  @Column({ name: 'config_versions', type: 'jsonb', default: [] })
  configVersions: Array<{
    configType: FreeSwitchConfigType;
    configId: string;
    versionId: string;
    version: number;
  }>;

  @Column({ name: 'deployment_status', length: 50, default: 'pending' })
  deploymentStatus: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolled_back';

  @Column({ name: 'deployed_at', type: 'timestamp', nullable: true })
  deployedAt?: Date;

  @Column({ name: 'rollback_data', type: 'jsonb', nullable: true })
  rollbackData?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  @Column({ name: 'deployed_by', type: 'int', nullable: true })
  deployedBy?: number;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deployed_by' })
  deployer?: User;

  // Helper methods
  getConfigCount(): number {
    return this.configVersions.length;
  }

  getConfigTypesSummary(): string {
    const types = this.configVersions.map(cv => cv.configType);
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.join(', ');
  }

  isDeployed(): boolean {
    return this.deploymentStatus === 'deployed';
  }

  canRollback(): boolean {
    return this.isDeployed() && !!this.rollbackData;
  }

  getDeploymentDuration(): number | null {
    if (!this.deployedAt) return null;
    return this.deployedAt.getTime() - this.createdAt.getTime();
  }

  // Static factory methods
  static createDeployment(
    deploymentName: string,
    configVersions: Array<{
      configType: FreeSwitchConfigType;
      configId: string;
      versionId: string;
      version: number;
    }>,
    description?: string,
    domainId?: string,
    createdBy?: string
  ): Partial<FreeSwitchConfigDeployment> {
    return {
      deploymentName,
      description,
      domainId,
      configVersions,
      deploymentStatus: 'pending',
      createdBy,
    };
  }
}
