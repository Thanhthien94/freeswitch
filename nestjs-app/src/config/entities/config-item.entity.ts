import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Configuration Category Entity
 */
@Entity('config_categories')
export class ConfigCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Professional Configuration Item Entity
 * Clean, simple, and matches database schema
 */
@Entity('config_items')
@Index(['categoryId', 'name'], { unique: true })
@Index(['categoryId'])
@Index(['order'])
@Index(['isActive'])
export class ConfigItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  categoryId: string;

  @Column()
  @Index()
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'text', nullable: true })
  defaultValue: string;

  @Column({ default: 'string' })
  dataType: string;

  @Column({ type: 'jsonb', nullable: true })
  validation: any;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: false })
  isSecret: boolean;

  @Column({ default: false })
  isReadOnly: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  order: number;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => ConfigCategory)
  @JoinColumn({ name: 'categoryId' })
  category: ConfigCategory;

  // Helper methods
  getParsedValue(): any {
    if (!this.value) return this.getDefaultValue();

    try {
      switch (this.dataType) {
        case 'boolean':
          return this.value.toLowerCase() === 'true';
        case 'number':
          return parseFloat(this.value);
        case 'integer':
          return parseInt(this.value, 10);
        case 'json':
          return JSON.parse(this.value);
        case 'array':
          return JSON.parse(this.value);
        default:
          return this.value;
      }
    } catch (error) {
      return this.getDefaultValue();
    }
  }

  getDefaultValue(): any {
    if (!this.defaultValue) return null;

    try {
      switch (this.dataType) {
        case 'boolean':
          return this.defaultValue.toLowerCase() === 'true';
        case 'number':
          return parseFloat(this.defaultValue);
        case 'integer':
          return parseInt(this.defaultValue, 10);
        case 'json':
          return JSON.parse(this.defaultValue);
        case 'array':
          return JSON.parse(this.defaultValue);
        default:
          return this.defaultValue;
      }
    } catch (error) {
      return null;
    }
  }

  getDisplayValue(): string {
    if (this.isSecret && this.value) {
      return '***';
    }
    return this.value || this.defaultValue || '';
  }

  setValue(value: any): void {
    if (value === null || value === undefined) {
      this.value = null;
      return;
    }

    switch (this.dataType) {
      case 'boolean':
        this.value = Boolean(value).toString();
        break;
      case 'number':
      case 'integer':
        this.value = value.toString();
        break;
      case 'json':
      case 'array':
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = value.toString();
    }
  }

  isValidValue(value: any): boolean {
    try {
      switch (this.dataType) {
        case 'boolean':
          return typeof value === 'boolean' || ['true', 'false'].includes(value?.toString()?.toLowerCase());
        case 'number':
          return !isNaN(parseFloat(value));
        case 'integer':
          return Number.isInteger(parseFloat(value));
        case 'json':
        case 'array':
          JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }
}
