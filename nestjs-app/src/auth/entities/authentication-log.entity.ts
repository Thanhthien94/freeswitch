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
 * Authentication Log Entity
 * Comprehensive audit logging for authentication events
 */
@Entity('authentication_logs')
@Index(['userId'])
@Index(['action'])
@Index(['success'])
@Index(['ipAddress'])
@Index(['timestamp'])
@Index(['sessionId'])
export class AuthenticationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  username: string;

  @Column({ type: 'varchar' })
  @Index()
  action: string; // 'login', 'logout', 'access_granted', 'access_denied', 'token_refresh', etc.

  @Column({ type: 'varchar', nullable: true })
  resource: string; // The endpoint or resource being accessed

  @Column({ type: 'boolean', default: false })
  @Index()
  success: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  sessionId: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', nullable: true })
  duration: number; // Request duration in milliseconds

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional metadata (roles, permissions, etc.)

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
  isSuccessful(): boolean {
    return this.success;
  }

  isFailed(): boolean {
    return !this.success;
  }

  isLoginAttempt(): boolean {
    return this.action === 'login';
  }

  isAccessAttempt(): boolean {
    return ['access_granted', 'access_denied'].includes(this.action);
  }

  getFormattedDuration(): string {
    if (!this.duration) return 'N/A';
    return `${this.duration}ms`;
  }

  getClientInfo(): { ip: string; userAgent: string } {
    return {
      ip: this.ipAddress || 'unknown',
      userAgent: this.userAgent || 'unknown',
    };
  }
}
