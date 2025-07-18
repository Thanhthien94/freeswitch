import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Domain } from '../auth/entities/domain.entity';
import { UserRole as UserRoleEntity } from '../auth/entities/user-role.entity';

// Legacy enum removed - now using RBAC system

@Entity('users')
@Index(['username'])
@Index(['email'])
@Index(['extension'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  // Role removed - now using RBAC system via userRoles relationship

  @Column({ nullable: true, length: 20 })
  extension: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Domain association
  @Column({ name: 'domain_id', nullable: true })
  domainId: string;

  @ManyToOne(() => Domain, (domain) => domain.users, { nullable: true })
  @JoinColumn({ name: 'domain_id' })
  domain: Domain;

  // Department and team
  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Column({ name: 'team_id', nullable: true })
  teamId: string;

  @Column({ name: 'manager_id', nullable: true })
  managerId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Virtual field for password (not stored in DB)
  password?: string;

  // Relations
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];

  // Computed properties for compatibility
  get roles(): any[] {
    return this.getActiveRoles().map(ur => ({
      name: ur.role?.name,
      permissions: ur.role?.permissions || []
    }));
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  get displayName(): string {
    return this.fullName || this.username;
  }

  // Password hashing hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.passwordHash = await bcrypt.hash(this.password, saltRounds);
      delete this.password; // Remove plain password after hashing
    }
  }

  // Password validation method
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Convert to safe object (without sensitive data)
  toSafeObject() {
    const { passwordHash, ...safeUser } = this;
    return safeUser;
  }

  // Get active roles
  getActiveRoles(): UserRoleEntity[] {
    return this.userRoles?.filter(ur => ur.isValid) || [];
  }

  // Get primary role
  getPrimaryRole(): UserRoleEntity | null {
    return this.userRoles?.find(ur => ur.isPrimary && ur.isValid) || null;
  }

  // Check if user has role
  hasRole(roleName: string): boolean {
    return this.getActiveRoles().some(ur => ur.role?.name === roleName);
  }

  // Check if user belongs to domain
  belongsToDomain(domainId: string): boolean {
    return this.domainId === domainId;
  }
}
