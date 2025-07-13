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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  // Time-based access
  @Column({ name: 'granted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  grantedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  // Context and constraints
  @Column({ name: 'granted_by', nullable: true })
  grantedBy: string;

  @Column({ name: 'grant_reason', length: 255, nullable: true })
  grantReason: string;

  @Column({ type: 'jsonb', nullable: true })
  constraints: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  @Column({ name: 'revoked_by', nullable: true })
  revokedBy: string;

  @Column({ name: 'revoke_reason', length: 255, nullable: true })
  revokeReason: string;

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
    return this.isActive && !this.isExpired && !this.revokedAt;
  }

  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const diffTime = this.expiresAt.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Methods
  revoke(revokedBy: string, reason?: string): void {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revokeReason = reason;
  }

  extend(newExpiryDate: Date, extendedBy: string): void {
    this.expiresAt = newExpiryDate;
    this.context = {
      ...this.context,
      lastExtendedBy: extendedBy,
      lastExtendedAt: new Date(),
    };
  }

  // Static methods
  static createUserRole(
    userId: number,
    roleId: string,
    grantedBy: string,
    options?: {
      isPrimary?: boolean;
      expiresAt?: Date;
      reason?: string;
      constraints?: Record<string, any>;
    }
  ): Partial<UserRole> {
    return {
      userId,
      roleId,
      grantedBy,
      isPrimary: options?.isPrimary || false,
      expiresAt: options?.expiresAt,
      grantReason: options?.reason,
      constraints: options?.constraints,
    };
  }
}
