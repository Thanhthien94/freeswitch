import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RecordingAccessLog } from './recording-access-log.entity';
import { RecordingTag } from './recording-tag.entity';

export enum RecordingDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
}

export enum RecordingStatus {
  RECORDING = 'recording',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSING = 'processing',
}

@Entity('call_recordings')
@Index(['callUuid'])
@Index(['callerNumber'])
@Index(['calleeNumber'])
@Index(['callStartedAt'])
@Index(['recordingStatus'])
@Index(['domainName'])
export class CallRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Call Information
  @Column({ name: 'call_uuid', unique: true })
  callUuid: string;

  @Column({ name: 'caller_number', length: 50 })
  callerNumber: string;

  @Column({ name: 'callee_number', length: 50 })
  calleeNumber: string;

  @Column({
    type: 'enum',
    enum: RecordingDirection,
    default: RecordingDirection.INTERNAL,
  })
  direction: RecordingDirection;

  // Recording File Information
  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'file_format', default: 'wav', length: 10 })
  fileFormat: string;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  // Recording Metadata
  @Column({ name: 'recording_started_at', type: 'timestamptz', nullable: true })
  recordingStartedAt: Date;

  @Column({ name: 'recording_ended_at', type: 'timestamptz', nullable: true })
  recordingEndedAt: Date;

  @Column({ name: 'recording_quality', default: 'standard', length: 20 })
  recordingQuality: string;

  @Column({ name: 'is_stereo', default: true })
  isStereo: boolean;

  // Call Metadata
  @Column({ name: 'call_started_at', type: 'timestamptz' })
  callStartedAt: Date;

  @Column({ name: 'call_answered_at', type: 'timestamptz', nullable: true })
  callAnsweredAt: Date;

  @Column({ name: 'call_ended_at', type: 'timestamptz', nullable: true })
  callEndedAt: Date;

  @Column({ name: 'hangup_cause', length: 50, nullable: true })
  hangupCause: string;

  // Business Information
  @Column({ name: 'domain_name', length: 100, nullable: true })
  domainName: string;

  @Column({ default: 'default', length: 50 })
  context: string;

  // Status and Flags
  @Column({
    name: 'recording_status',
    type: 'enum',
    enum: RecordingStatus,
    default: RecordingStatus.COMPLETED,
  })
  recordingStatus: RecordingStatus;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  // Audit Fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  // Relations
  @OneToMany(() => RecordingAccessLog, (log) => log.recording)
  accessLogs: RecordingAccessLog[];

  @OneToMany(() => RecordingTag, (tag) => tag.recording)
  tags: RecordingTag[];

  // Computed Properties
  get recordingDurationMs(): number {
    if (this.recordingStartedAt && this.recordingEndedAt) {
      return this.recordingEndedAt.getTime() - this.recordingStartedAt.getTime();
    }
    return 0;
  }

  get callDurationMs(): number {
    if (this.callStartedAt && this.callEndedAt) {
      return this.callEndedAt.getTime() - this.callStartedAt.getTime();
    }
    return 0;
  }

  get isRecordingActive(): boolean {
    return this.recordingStatus === RecordingStatus.RECORDING;
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
