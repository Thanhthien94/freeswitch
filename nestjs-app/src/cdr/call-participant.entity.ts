import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CallDetailRecord } from './cdr.entity';

export enum ParticipantType {
  CALLER = 'caller',
  CALLEE = 'callee',
  TRANSFER_TARGET = 'transfer_target',
  CONFERENCE_MEMBER = 'conference_member',
}

@Entity('call_participants')
@Index(['cdrId'])
@Index(['participantNumber'])
@Index(['participantType'])
export class CallParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cdr_id' })
  cdrId: string;

  // Participant Info
  @Column({ name: 'participant_number', length: 50 })
  participantNumber: string;

  @Column({ name: 'participant_name', length: 100, nullable: true })
  participantName: string;

  @Column({
    name: 'participant_type',
    type: 'enum',
    enum: ParticipantType,
    nullable: true,
  })
  participantType: ParticipantType;

  // Participation Timeline
  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date;

  @Column({ name: 'duration_seconds', default: 0 })
  durationSeconds: number;

  // Technical Info
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CallDetailRecord, (cdr) => cdr.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cdr_id' })
  cdr: CallDetailRecord;

  // Computed Properties
  get isActive(): boolean {
    return this.joinedAt !== null && this.leftAt === null;
  }

  get participationDuration(): number {
    if (this.joinedAt && this.leftAt) {
      return Math.floor((this.leftAt.getTime() - this.joinedAt.getTime()) / 1000);
    }
    return 0;
  }
}
