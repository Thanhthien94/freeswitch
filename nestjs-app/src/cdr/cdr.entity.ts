import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CallEvent } from './call-event.entity';
import { CallParticipant } from './call-participant.entity';

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
  TRANSFER = 'transfer',
}

export enum CallStatus {
  RINGING = 'ringing',
  ANSWERED = 'answered',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
}

@Entity('call_detail_records')
@Index(['callUuid'])
@Index(['callerIdNumber'])
@Index(['destinationNumber'])
@Index(['callCreatedAt'])
@Index(['callAnsweredAt'])
@Index(['callEndedAt'])
@Index(['direction'])
@Index(['callStatus'])
@Index(['hangupCause'])
@Index(['domainName'])

@Index(['callerIdNumber', 'callCreatedAt'])
@Index(['destinationNumber', 'callCreatedAt'])
@Index(['callCreatedAt', 'callStatus'])
export class CallDetailRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Call Identification
  @Column({ name: 'call_uuid' })
  callUuid: string;

  @Column({ name: 'call_session_id', nullable: true })
  callSessionId: string;

  @Column({ name: 'parent_call_uuid', nullable: true })
  parentCallUuid: string;

  // Call Participants
  @Column({ name: 'caller_id_number', length: 50 })
  callerIdNumber: string;

  @Column({ name: 'caller_id_name', length: 100, nullable: true })
  callerIdName: string;

  @Column({ name: 'destination_number', length: 50 })
  destinationNumber: string;

  @Column({ name: 'destination_name', length: 100, nullable: true })
  destinationName: string;

  // Call Direction & Context
  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.INTERNAL,
  })
  direction: CallDirection;

  // B-leg billing flag for agent billing
  @Column({ name: 'is_billing_leg', default: false })
  isBillingLeg: boolean;

  @Column({ default: 'default', length: 50 })
  context: string;

  @Column({ name: 'domain_name', length: 100, nullable: true })
  domainName: string;

  // Call Timestamps
  @Column({ name: 'call_created_at', type: 'timestamptz' })
  callCreatedAt: Date;

  @Column({ name: 'call_ringing_at', type: 'timestamptz', nullable: true })
  callRingingAt: Date;

  @Column({ name: 'call_answered_at', type: 'timestamptz', nullable: true })
  callAnsweredAt: Date;

  @Column({ name: 'call_bridged_at', type: 'timestamptz', nullable: true })
  callBridgedAt: Date;

  @Column({ name: 'call_ended_at', type: 'timestamptz', nullable: true })
  callEndedAt: Date;

  // Call Duration (in seconds)
  @Column({ name: 'ring_duration', default: 0 })
  ringDuration: number;

  @Column({ name: 'talk_duration', default: 0 })
  talkDuration: number;

  @Column({ name: 'total_duration', default: 0 })
  totalDuration: number;

  @Column({ name: 'billable_duration', default: 0 })
  billableDuration: number;

  // Call Status & Results
  @Column({
    name: 'call_status',
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.COMPLETED,
  })
  callStatus: CallStatus;

  @Column({ name: 'hangup_cause', length: 50, nullable: true })
  hangupCause: string;

  @Column({ name: 'hangup_disposition', length: 50, nullable: true })
  hangupDisposition: string;

  @Column({ name: 'answer_disposition', length: 50, nullable: true })
  answerDisposition: string;

  // Network & Technical Info
  @Column({ name: 'caller_ip_address', type: 'inet', nullable: true })
  callerIpAddress: string;

  @Column({ name: 'callee_ip_address', type: 'inet', nullable: true })
  calleeIpAddress: string;

  @Column({ name: 'sip_user_agent', type: 'text', nullable: true })
  sipUserAgent: string;

  @Column({ name: 'codec_used', length: 20, nullable: true })
  codecUsed: string;

  // Routing Information
  @Column({ name: 'gateway_used', length: 100, nullable: true })
  gatewayUsed: string;

  @Column({ name: 'route_used', length: 100, nullable: true })
  routeUsed: string;

  @Column({ name: 'trunk_used', length: 100, nullable: true })
  trunkUsed: string;

  // Quality Metrics
  @Column({ name: 'audio_quality_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  audioQualityScore: number;

  @Column({ name: 'packet_loss_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  packetLossPercent: number;

  @Column({ name: 'jitter_ms', type: 'decimal', precision: 8, scale: 2, nullable: true })
  jitterMs: number;

  @Column({ name: 'latency_ms', type: 'decimal', precision: 8, scale: 2, nullable: true })
  latencyMs: number;

  // Business Information (billing details will be in separate billing tables)
  @Column({ name: 'billing_account', length: 100, nullable: true })
  billingAccount: string;

  // Call Features Used
  @Column({ name: 'recording_enabled', default: false })
  recordingEnabled: boolean;

  @Column({ name: 'recording_file_path', length: 500, nullable: true })
  recordingFilePath: string;

  @Column({ name: 'transfer_occurred', default: false })
  transferOccurred: boolean;

  @Column({ name: 'conference_used', default: false })
  conferenceUsed: boolean;

  @Column({ name: 'voicemail_used', default: false })
  voicemailUsed: boolean;

  // Custom Fields
  @Column({ name: 'custom_field_1', nullable: true })
  customField1: string;

  @Column({ name: 'custom_field_2', nullable: true })
  customField2: string;

  @Column({ name: 'custom_field_3', nullable: true })
  customField3: string;

  // Audit Fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  // Relations
  @OneToMany(() => CallEvent, (event) => event.cdr)
  events: CallEvent[];

  @OneToMany(() => CallParticipant, (participant) => participant.cdr)
  participants: CallParticipant[];

  // Computed Properties
  get isAnswered(): boolean {
    return this.callAnsweredAt !== null;
  }

  get callResult(): string {
    if (this.callAnsweredAt) return 'answered';
    if (this.callStatus === CallStatus.RINGING) return 'ringing';
    return 'missed';
  }

  get durationFormatted(): string {
    const duration = this.totalDuration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }


}
