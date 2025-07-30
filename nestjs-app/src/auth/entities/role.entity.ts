import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
import { Domain } from '../../freeswitch/entities/domain.entity';
import { UserRole } from './user-role.entity';

export enum RoleType {
  SYSTEM = 'SYSTEM',
  DOMAIN = 'DOMAIN',
  CUSTOM = 'CUSTOM',
}

export enum RoleLevel {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  GUEST = 'GUEST',
}

@Entity('roles')
@Index(['name'])
@Index(['type'])
@Index(['level'])
@Index(['isActive'])
@Index(['domainId'])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.DOMAIN,
  })
  type: RoleType;

  @Column({
    type: 'enum',
    enum: RoleLevel,
    default: RoleLevel.USER,
  })
  level: RoleLevel;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  // Domain association (null for global roles)
  @Column({ name: 'domain_id', nullable: true })
  domainId: string;

  // Role hierarchy
  @Column({ name: 'parent_role_id', nullable: true })
  parentRoleId: number;

  @ManyToOne(() => Role, (role) => role.childRoles, { nullable: true })
  @JoinColumn({ name: 'parent_role_id' })
  parentRole: Role;

  @OneToMany(() => Role, (role) => role.parentRole)
  childRoles: Role[];

  // Role settings
  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  constraints: Record<string, any>;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  // Relations
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  // Computed properties
  get isGlobal(): boolean {
    return this.type === RoleType.SYSTEM;
  }

  get isDomainSpecific(): boolean {
    return this.type !== RoleType.SYSTEM && this.domainId !== null;
  }

  get hierarchyLevel(): string {
    return this.level;
  }

  // Methods
  hasPermission(permission: string): boolean {
    return this.permissions?.some(p => p.fullPermission === permission) || false;
  }

  isHigherThan(otherRole: Role): boolean {
    const levelOrder = {
      [RoleLevel.SUPERADMIN]: 0,
      [RoleLevel.ADMIN]: 1,
      [RoleLevel.MANAGER]: 2,
      [RoleLevel.USER]: 3,
      [RoleLevel.GUEST]: 4,
    };
    return levelOrder[this.level] < levelOrder[otherRole.level];
  }

  isLowerThan(otherRole: Role): boolean {
    const levelOrder = {
      [RoleLevel.SUPERADMIN]: 0,
      [RoleLevel.ADMIN]: 1,
      [RoleLevel.MANAGER]: 2,
      [RoleLevel.USER]: 3,
      [RoleLevel.GUEST]: 4,
    };
    return levelOrder[this.level] > levelOrder[otherRole.level];
  }

  // Static methods for predefined roles
  static createSystemRole(
    name: string,
    level: RoleLevel,
    description?: string,
  ): Partial<Role> {
    return {
      name,
      level,
      type: RoleType.SYSTEM,
      isSystem: true,
      description: description || `System role: ${name}`,
    };
  }

  static createDomainRole(
    name: string,
    level: RoleLevel,
    domainId: string,
    description?: string,
  ): Partial<Role> {
    return {
      name,
      level,
      type: RoleType.DOMAIN,
      domainId,
      description: description || `Domain role: ${name}`,
    };
  }
}
