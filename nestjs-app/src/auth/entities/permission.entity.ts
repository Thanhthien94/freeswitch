import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';

export enum PermissionCategory {
  SYSTEM = 'system',
  DOMAIN = 'domain',
  USERS = 'users',
  CALLS = 'calls',
  EXTENSIONS = 'extensions',
  CDR = 'cdr',
  RECORDINGS = 'recordings',
  BILLING = 'billing',
  REPORTS = 'reports',
  ANALYTICS = 'analytics',
  CONFIG = 'config',
  SECURITY = 'security',
  MONITORING = 'monitoring',
}

export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

@Entity('permissions')
@Index(['resource', 'action'])
@Index(['category'])
@Index(['isActive'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50 })
  resource: string;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category: PermissionCategory;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  // Scope and conditions
  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  constraints: Record<string, any>;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  // Computed properties
  get fullPermission(): string {
    return `${this.resource}:${this.action}`;
  }

  get isManagePermission(): boolean {
    return this.action === PermissionAction.MANAGE;
  }

  // Static methods for common permissions
  static createPermission(
    resource: string,
    action: PermissionAction,
    category: PermissionCategory,
    description?: string,
  ): Partial<Permission> {
    return {
      name: `${resource}:${action}`,
      resource,
      action,
      category,
      description: description || `${action} access to ${resource}`,
    };
  }
}
