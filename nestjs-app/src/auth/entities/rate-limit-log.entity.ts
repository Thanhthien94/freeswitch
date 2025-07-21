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

/**
 * Rate Limit Log Entity
 * Audit logging for rate limiting events
 */
@Entity('rate_limit_logs')
@Index(['userId'])
@Index(['ipAddress'])
@Index(['endpoint'])
@Index(['exceeded'])
@Index(['timestamp'])
export class RateLimitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  username: string;

  @Column({ type: 'varchar' })
  @Index()
  ipAddress: string;

  @Column({ type: 'varchar' })
  @Index()
  endpoint: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'int' })
  currentCount: number;

  @Column({ type: 'int' })
  maxRequests: number;

  @Column({ type: 'int' })
  windowMs: number;

  @Column({ type: 'boolean', default: false })
  @Index()
  exceeded: boolean;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Helper methods
  isExceeded(): boolean {
    return this.exceeded;
  }

  isWarning(): boolean {
    return !this.exceeded && this.currentCount > this.maxRequests * 0.8;
  }

  getUsagePercentage(): number {
    return Math.round((this.currentCount / this.maxRequests) * 100);
  }

  getWindowDuration(): string {
    const seconds = this.windowMs / 1000;
    if (seconds < 60) return `${seconds}s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes}m`;
    const hours = minutes / 60;
    return `${hours}h`;
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.currentCount);
  }

  getClientInfo(): { ip: string; userAgent: string } {
    return {
      ip: this.ipAddress || 'unknown',
      userAgent: this.userAgent || 'unknown',
    };
  }
}
