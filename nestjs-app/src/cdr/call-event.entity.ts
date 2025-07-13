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

@Entity('call_events')
@Index(['cdrId'])
@Index(['eventType'])
@Index(['eventTimestamp'])
@Index(['processed'])
export class CallEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cdr_id' })
  cdrId: string;

  // Event Information
  @Column({ name: 'event_type', length: 50 })
  eventType: string;

  @Column({ name: 'event_subtype', length: 50, nullable: true })
  eventSubtype: string;

  @Column({ name: 'event_timestamp', type: 'timestamptz' })
  eventTimestamp: Date;

  // Event Details
  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData: any;

  @Column({ name: 'event_source', length: 50, default: 'freeswitch' })
  eventSource: string;

  // Processing
  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CallDetailRecord, (cdr) => cdr.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cdr_id' })
  cdr: CallDetailRecord;
}
