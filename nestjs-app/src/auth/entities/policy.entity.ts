import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PolicyType {
  RBAC = 'rbac',
  ABAC = 'abac',
  HYBRID = 'hybrid',
}

export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum PolicyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  DEPRECATED = 'deprecated',
}

export enum PolicyPriority {
  CRITICAL = 0,
  HIGH = 10,
  MEDIUM = 50,
  LOW = 100,
}

@Entity('policies')
@Index(['name'])
@Index(['type'])
@Index(['status'])
@Index(['priority'])
@Index(['domainId'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PolicyType,
    default: PolicyType.ABAC,
  })
  type: PolicyType;

  @Column({
    type: 'enum',
    enum: PolicyEffect,
    default: PolicyEffect.ALLOW,
  })
  effect: PolicyEffect;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.ACTIVE,
  })
  status: PolicyStatus;

  @Column({
    type: 'enum',
    enum: PolicyPriority,
    default: PolicyPriority.MEDIUM,
  })
  priority: PolicyPriority;

  // Scope
  @Column({ name: 'domain_id', nullable: true })
  domainId: string;

  @Column({ type: 'simple-array', nullable: true })
  resources: string[];

  @Column({ type: 'simple-array', nullable: true })
  actions: string[];

  // Policy Rules
  @Column({ type: 'text' })
  condition: string;

  @Column({ type: 'jsonb', nullable: true })
  rules: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  obligations: Record<string, any>;

  // Time-based policy
  @Column({ name: 'effective_from', type: 'timestamptz', nullable: true })
  effectiveFrom: Date;

  @Column({ name: 'effective_until', type: 'timestamptz', nullable: true })
  effectiveUntil: Date;

  // Policy metadata
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'version', default: 1 })
  version: number;

  @Column({ name: 'parent_policy_id', nullable: true })
  parentPolicyId: string;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  // Usage tracking
  @Column({ name: 'evaluation_count', default: 0 })
  evaluationCount: number;

  @Column({ name: 'last_evaluated', type: 'timestamptz', nullable: true })
  lastEvaluated: Date;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'failure_count', default: 0 })
  failureCount: number;

  // Computed properties
  get isActive(): boolean {
    return this.status === PolicyStatus.ACTIVE;
  }

  get isEffective(): boolean {
    if (!this.isActive) return false;
    
    const now = new Date();
    const afterStart = !this.effectiveFrom || now >= this.effectiveFrom;
    const beforeEnd = !this.effectiveUntil || now <= this.effectiveUntil;
    
    return afterStart && beforeEnd;
  }

  get successRate(): number {
    const total = this.successCount + this.failureCount;
    return total > 0 ? (this.successCount / total) * 100 : 0;
  }

  // Methods
  incrementEvaluationCount(): void {
    this.evaluationCount++;
    this.lastEvaluated = new Date();
  }

  incrementSuccessCount(): void {
    this.successCount++;
  }

  incrementFailureCount(): void {
    this.failureCount++;
  }

  appliesTo(resource: string, action: string): boolean {
    const resourceMatch = !this.resources || this.resources.length === 0 || 
                         this.resources.includes(resource) || 
                         this.resources.includes('*');
    
    const actionMatch = !this.actions || this.actions.length === 0 || 
                       this.actions.includes(action) || 
                       this.actions.includes('*');
    
    return resourceMatch && actionMatch;
  }

  // Static methods
  static createTimeBasedPolicy(
    name: string,
    condition: string,
    effect: PolicyEffect,
    startTime: Date,
    endTime: Date,
  ): Partial<Policy> {
    return {
      name,
      condition,
      effect,
      type: PolicyType.ABAC,
      effectiveFrom: startTime,
      effectiveUntil: endTime,
      status: PolicyStatus.ACTIVE,
    };
  }

  static createDomainPolicy(
    name: string,
    domainId: string,
    condition: string,
    resources: string[],
    actions: string[],
  ): Partial<Policy> {
    return {
      name,
      domainId,
      condition,
      resources,
      actions,
      type: PolicyType.ABAC,
      effect: PolicyEffect.ALLOW,
      status: PolicyStatus.ACTIVE,
    };
  }

  static createRoleBasedPolicy(
    name: string,
    roleName: string,
    resources: string[],
    actions: string[],
  ): Partial<Policy> {
    return {
      name,
      condition: `user.roles.includes('${roleName}')`,
      resources,
      actions,
      type: PolicyType.RBAC,
      effect: PolicyEffect.ALLOW,
      status: PolicyStatus.ACTIVE,
    };
  }
}
