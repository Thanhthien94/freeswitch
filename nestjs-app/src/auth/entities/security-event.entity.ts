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

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security Event Entity
 * Comprehensive security event logging and monitoring
 */
@Entity('security_events')
@Index(['userId'])
@Index(['eventType'])
@Index(['severity'])
@Index(['resolved'])
@Index(['timestamp'])
@Index(['ipAddress'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  username: string;

  @Column({ type: 'varchar' })
  @Index()
  eventType: string; // 'failed_login', 'rate_limit_exceeded', 'suspicious_activity', etc.

  @Column({
    type: 'enum',
    enum: SecurityEventSeverity,
    default: SecurityEventSeverity.MEDIUM,
  })
  @Index()
  severity: SecurityEventSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', nullable: true })
  resource: string; // The resource or endpoint involved

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional event-specific data

  @Column({ type: 'boolean', default: false })
  @Index()
  resolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedBy' })
  resolver: User;

  // Helper methods
  isResolved(): boolean {
    return this.resolved;
  }

  isPending(): boolean {
    return !this.resolved;
  }

  isCritical(): boolean {
    return this.severity === SecurityEventSeverity.CRITICAL;
  }

  isHigh(): boolean {
    return this.severity === SecurityEventSeverity.HIGH;
  }

  requiresImmedateAttention(): boolean {
    return this.isCritical() || this.isHigh();
  }

  getAgeInHours(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.timestamp.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  getAgeInDays(): number {
    return Math.floor(this.getAgeInHours() / 24);
  }

  isStale(): boolean {
    // Consider events older than 30 days as stale
    return this.getAgeInDays() > 30;
  }

  getClientInfo(): { ip: string; userAgent: string } {
    return {
      ip: this.ipAddress || 'unknown',
      userAgent: this.userAgent || 'unknown',
    };
  }

  getSeverityColor(): string {
    switch (this.severity) {
      case SecurityEventSeverity.CRITICAL:
        return '#dc3545'; // Red
      case SecurityEventSeverity.HIGH:
        return '#fd7e14'; // Orange
      case SecurityEventSeverity.MEDIUM:
        return '#ffc107'; // Yellow
      case SecurityEventSeverity.LOW:
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  }

  getSeverityIcon(): string {
    switch (this.severity) {
      case SecurityEventSeverity.CRITICAL:
        return '🚨';
      case SecurityEventSeverity.HIGH:
        return '⚠️';
      case SecurityEventSeverity.MEDIUM:
        return '⚡';
      case SecurityEventSeverity.LOW:
        return 'ℹ️';
      default:
        return '❓';
    }
  }

  markAsResolved(resolvedBy: string): void {
    this.resolved = true;
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
  }

  markAsPending(): void {
    this.resolved = false;
    this.resolvedAt = null;
    this.resolvedBy = null;
  }
}
