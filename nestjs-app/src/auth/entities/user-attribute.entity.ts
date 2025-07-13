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
import { User } from '../../users/user.entity';

export enum AttributeType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  ARRAY = 'array',
}

export enum AttributeCategory {
  IDENTITY = 'identity',
  ORGANIZATIONAL = 'organizational',
  LOCATION = 'location',
  SECURITY = 'security',
  BUSINESS = 'business',
  TEMPORAL = 'temporal',
  CUSTOM = 'custom',
}

@Entity('user_attributes')
@Index(['userId', 'attributeName'], { unique: true })
@Index(['userId'])
@Index(['attributeName'])
@Index(['category'])
@Index(['isActive'])
export class UserAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'attribute_name', length: 100 })
  attributeName: string;

  @Column({ name: 'attribute_value', type: 'text' })
  attributeValue: string;

  @Column({
    name: 'attribute_type',
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.STRING,
  })
  attributeType: AttributeType;

  @Column({
    type: 'enum',
    enum: AttributeCategory,
    default: AttributeCategory.CUSTOM,
  })
  category: AttributeCategory;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_sensitive', default: false })
  isSensitive: boolean;

  @Column({ name: 'is_inherited', default: false })
  isInherited: boolean;

  // Time-based attributes
  @Column({ name: 'effective_from', type: 'timestamptz', nullable: true })
  effectiveFrom: Date;

  @Column({ name: 'effective_until', type: 'timestamptz', nullable: true })
  effectiveUntil: Date;

  // Source and validation
  @Column({ name: 'source_system', length: 100, nullable: true })
  sourceSystem: string;

  @Column({ name: 'last_verified', type: 'timestamptz', nullable: true })
  lastVerified: Date;

  @Column({ name: 'verification_method', length: 100, nullable: true })
  verificationMethod: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Audit fields
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  get isEffective(): boolean {
    const now = new Date();
    const afterStart = !this.effectiveFrom || now >= this.effectiveFrom;
    const beforeEnd = !this.effectiveUntil || now <= this.effectiveUntil;
    return this.isActive && afterStart && beforeEnd;
  }

  get isExpired(): boolean {
    return this.effectiveUntil ? new Date() > this.effectiveUntil : false;
  }

  // Methods
  getValue(): any {
    switch (this.attributeType) {
      case AttributeType.NUMBER:
        return parseFloat(this.attributeValue);
      case AttributeType.BOOLEAN:
        return this.attributeValue.toLowerCase() === 'true';
      case AttributeType.DATE:
        return new Date(this.attributeValue);
      case AttributeType.JSON:
        return JSON.parse(this.attributeValue);
      case AttributeType.ARRAY:
        return JSON.parse(this.attributeValue);
      default:
        return this.attributeValue;
    }
  }

  setValue(value: any): void {
    switch (this.attributeType) {
      case AttributeType.JSON:
      case AttributeType.ARRAY:
        this.attributeValue = JSON.stringify(value);
        break;
      case AttributeType.DATE:
        this.attributeValue = value instanceof Date ? value.toISOString() : value;
        break;
      default:
        this.attributeValue = String(value);
    }
  }

  // Static methods
  static createAttribute(
    userId: number,
    name: string,
    value: any,
    type: AttributeType = AttributeType.STRING,
    category: AttributeCategory = AttributeCategory.CUSTOM,
  ): Partial<UserAttribute> {
    const attribute = new UserAttribute();
    attribute.userId = userId;
    attribute.attributeName = name;
    attribute.attributeType = type;
    attribute.category = category;
    attribute.setValue(value);
    return attribute;
  }
}
