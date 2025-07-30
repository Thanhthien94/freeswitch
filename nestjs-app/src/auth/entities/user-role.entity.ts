import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
@Index(['userId'])
@Index(['roleId'])
@Index(['isActive'])
@Index(['expiresAt'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  // Time-based access
  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  // Context and constraints
  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }

  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const diffTime = this.expiresAt.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }



  // Static methods
  static createUserRole(
    userId: number,
    roleId: number,
    assignedBy: string,
    options?: {
      isPrimary?: boolean;
      expiresAt?: Date;
    }
  ): Partial<UserRole> {
    return {
      userId,
      roleId,
      assignedBy,
      isPrimary: options?.isPrimary || false,
      expiresAt: options?.expiresAt,
    };
  }
}
