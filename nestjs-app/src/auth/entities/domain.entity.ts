import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Extension } from '../../extensions/extension.entity';

@Entity('domains')
@Index(['name'])
@Index(['isActive'])
export class Domain {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'max_users', default: 1000 })
  maxUsers: number;

  @Column({ name: 'max_extensions', default: 1000 })
  maxExtensions: number;

  // Domain settings
  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  // Billing information
  @Column({ name: 'billing_plan', length: 50, default: 'basic' })
  billingPlan: string;

  @Column({ name: 'cost_center', length: 100, nullable: true })
  costCenter: string;

  // Contact information
  @Column({ name: 'admin_email', length: 255, nullable: true })
  adminEmail: string;

  @Column({ name: 'admin_phone', length: 50, nullable: true })
  adminPhone: string;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  // Relations
  @OneToMany(() => User, (user) => user.domain)
  users: User[];

  @OneToMany(() => Extension, (extension) => extension.domain)
  extensions: Extension[];

  // Computed properties
  get isOverUserLimit(): boolean {
    return this.users?.length > this.maxUsers;
  }
}
