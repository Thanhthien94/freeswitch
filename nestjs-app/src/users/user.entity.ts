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
import { Domain } from '../freeswitch/entities/domain.entity';
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

  // Enhanced authentication fields
  @Column({ name: 'currentSessionId', nullable: true })
  currentSessionId: string;

  @Column({ name: 'lastActivityAt', type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ name: 'lastActivityIp', nullable: true })
  lastActivityIp: string;

  @Column({ name: 'lastActivityUserAgent', type: 'text', nullable: true })
  lastActivityUserAgent: string;

  @Column({ name: 'requirePasswordChange', type: 'boolean', default: false })
  requirePasswordChange: boolean;

  @Column({ name: 'mfaEnabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfaSecret', nullable: true })
  mfaSecret: string;

  @Column({ name: 'language', default: 'en' })
  language: string;

  @Column({ name: 'timezone', default: 'UTC' })
  timezone: string;

  @Column({ name: 'loginAttempts', type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ name: 'lockedUntil', type: 'timestamptz', nullable: true })
  lockedUntil: Date;

  // Additional fields for compatibility
  @Column({ name: 'emailVerified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'lastLoginAt', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

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

  // Enhanced authentication helper methods
  isAccountLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  shouldRequirePasswordChange(): boolean {
    return this.requirePasswordChange;
  }

  isMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts = (this.loginAttempts || 0) + 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
  }

  lockAccount(durationMinutes: number = 15): void {
    this.lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  }

  updateLastActivity(ip: string, userAgent: string): void {
    this.lastActivityAt = new Date();
    this.lastActivityIp = ip;
    this.lastActivityUserAgent = userAgent;
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  clearCurrentSession(): void {
    this.currentSessionId = null;
  }

  isSessionValid(sessionId: string): boolean {
    return this.currentSessionId === sessionId;
  }

  getPreferences(): { language: string; timezone: string } {
    return {
      language: this.language || 'en',
      timezone: this.timezone || 'UTC',
    };
  }

  updatePreferences(language?: string, timezone?: string): void {
    if (language) this.language = language;
    if (timezone) this.timezone = timezone;
  }

  // Security status methods
  getSecurityStatus(): {
    isLocked: boolean;
    requiresPasswordChange: boolean;
    mfaEnabled: boolean;
    loginAttempts: number;
    lastActivity: Date | null;
  } {
    return {
      isLocked: this.isAccountLocked(),
      requiresPasswordChange: this.shouldRequirePasswordChange(),
      mfaEnabled: this.isMfaEnabled(),
      loginAttempts: this.loginAttempts || 0,
      lastActivity: this.lastActivityAt,
    };
  }

  // Permission helper methods
  hasPermission(permission: string): boolean {
    const activeRoles = this.getActiveRoles();
    return activeRoles.some(ur =>
      ur.role?.permissions?.some(p => p.isActive && p.fullPermission === permission)
    );
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  getAllPermissions(): string[] {
    const activeRoles = this.getActiveRoles();
    const permissions = new Set<string>();

    activeRoles.forEach(ur => {
      ur.role?.permissions?.forEach(p => {
        if (p.isActive) {
          permissions.add(p.fullPermission);
        }
      });
    });

    return Array.from(permissions);
  }

  // Role hierarchy helper methods
  isSuperAdmin(): boolean {
    return this.hasRole('superadmin');
  }

  isAdmin(): boolean {
    return this.hasRole('admin') || this.isSuperAdmin();
  }

  isOperator(): boolean {
    return this.hasRole('operator') || this.isAdmin();
  }

  isViewer(): boolean {
    return this.hasRole('viewer') || this.isOperator();
  }

  getHighestRole(): string {
    if (this.isSuperAdmin()) return 'superadmin';
    if (this.isAdmin()) return 'admin';
    if (this.isOperator()) return 'operator';
    if (this.isViewer()) return 'viewer';
    return 'none';
  }
}
