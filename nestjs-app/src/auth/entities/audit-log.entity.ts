import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  POLICY_EVALUATED = 'policy_evaluated',
  ATTRIBUTE_CHANGED = 'attribute_changed',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
  WARNING = 'warning',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['result'])
@Index(['riskLevel'])
@Index(['timestamp'])
@Index(['domainId'])
@Index(['resourceType', 'resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User and session info
  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'username', length: 100, nullable: true })
  username: string;

  // Action details
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResult,
  })
  result: AuditResult;

  @Column({ length: 500, nullable: true })
  description: string;

  // Resource information
  @Column({ name: 'resource_type', length: 100, nullable: true })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'resource_name', length: 255, nullable: true })
  resourceName: string;

  // Context information
  @Column({ name: 'domain_id', nullable: true })
  domainId: string;

  @Column({ name: 'client_ip', length: 45, nullable: true })
  clientIp: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  // Risk and security
  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({ name: 'risk_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskScore: number;

  @Column({ name: 'threat_indicators', type: 'simple-array', nullable: true })
  threatIndicators: string[];

  // Policy and authorization details
  @Column({ name: 'policies_evaluated', type: 'simple-array', nullable: true })
  policiesEvaluated: string[];

  @Column({ name: 'permissions_checked', type: 'simple-array', nullable: true })
  permissionsChecked: string[];

  @Column({ name: 'roles_involved', type: 'simple-array', nullable: true })
  rolesInvolved: string[];

  // Additional data
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'error_message', length: 1000, nullable: true })
  errorMessage: string;

  @Column({ name: 'stack_trace', type: 'text', nullable: true })
  stackTrace: string;

  // Timing
  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;

  // Compliance and retention
  @Column({ name: 'compliance_tags', type: 'simple-array', nullable: true })
  complianceTags: string[];

  @Column({ name: 'retention_until', type: 'timestamptz', nullable: true })
  retentionUntil: Date;

  @Column({ name: 'is_sensitive', default: false })
  isSensitive: boolean;

  // Computed properties
  get isHighRisk(): boolean {
    return this.riskLevel === RiskLevel.HIGH || this.riskLevel === RiskLevel.CRITICAL;
  }

  get isFailure(): boolean {
    return this.result === AuditResult.FAILURE || this.result === AuditResult.ERROR;
  }

  get age(): number {
    return Date.now() - this.timestamp.getTime();
  }

  // Static methods
  static createAccessLog(
    userId: number,
    action: AuditAction,
    result: AuditResult,
    resourceType?: string,
    resourceId?: string,
    options?: {
      description?: string;
      clientIp?: string;
      userAgent?: string;
      riskLevel?: RiskLevel;
      metadata?: Record<string, any>;
    }
  ): Partial<AuditLog> {
    return {
      userId,
      action,
      result,
      resourceType,
      resourceId,
      description: options?.description,
      clientIp: options?.clientIp,
      userAgent: options?.userAgent,
      riskLevel: options?.riskLevel || RiskLevel.LOW,
      metadata: options?.metadata,
    };
  }

  static createSecurityEvent(
    userId: number,
    action: AuditAction,
    riskLevel: RiskLevel,
    description: string,
    threatIndicators?: string[],
    metadata?: Record<string, any>
  ): Partial<AuditLog> {
    return {
      userId,
      action,
      result: AuditResult.WARNING,
      riskLevel,
      description,
      threatIndicators,
      metadata,
    };
  }

  static createPolicyEvaluation(
    userId: number,
    result: AuditResult,
    policiesEvaluated: string[],
    permissionsChecked: string[],
    resourceType: string,
    resourceId: string,
    durationMs?: number
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.POLICY_EVALUATED,
      result,
      resourceType,
      resourceId,
      policiesEvaluated,
      permissionsChecked,
      durationMs,
    };
  }
}
