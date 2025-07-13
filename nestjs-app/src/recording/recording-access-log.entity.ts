import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CallRecording } from './recording.entity';

export enum AccessType {
  VIEW = 'view',
  DOWNLOAD = 'download',
  PLAY = 'play',
  DELETE = 'delete',
}

export enum AccessMethod {
  WEB = 'web',
  API = 'api',
  SYSTEM = 'system',
}

@Entity('recording_access_logs')
@Index(['recordingId'])
@Index(['accessedBy'])
@Index(['accessedAt'])
export class RecordingAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recording_id' })
  recordingId: string;

  // Access Information
  @Column({ name: 'accessed_by', length: 100 })
  accessedBy: string;

  @Column({
    name: 'access_type',
    type: 'enum',
    enum: AccessType,
  })
  accessType: AccessType;

  @Column({
    name: 'access_method',
    type: 'enum',
    enum: AccessMethod,
    default: AccessMethod.WEB,
  })
  accessMethod: AccessMethod;

  // Client Information
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  // Audit
  @CreateDateColumn({ name: 'accessed_at', type: 'timestamptz' })
  accessedAt: Date;

  // Relations
  @ManyToOne(() => CallRecording, (recording) => recording.accessLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recording_id' })
  recording: CallRecording;
}
