import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { CallRecording } from './recording.entity';

export enum TagType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
  BUSINESS = 'business',
}

@Entity('recording_tags')
@Index(['recordingId'])
@Index(['tagName'])
@Unique(['recordingId', 'tagName'])
export class RecordingTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recording_id' })
  recordingId: string;

  @Column({ name: 'tag_name', length: 50 })
  tagName: string;

  @Column({ name: 'tag_value', length: 100, nullable: true })
  tagValue: string;

  @Column({
    name: 'tag_type',
    type: 'enum',
    enum: TagType,
    default: TagType.CUSTOM,
  })
  tagType: TagType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy: string;

  // Relations
  @ManyToOne(() => CallRecording, (recording) => recording.tags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recording_id' })
  recording: CallRecording;
}
