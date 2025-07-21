import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsObject, 
  IsUUID, 
  IsInt, 
  Min,
  IsNotEmpty,
  MaxLength,
  IsIn
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Configuration Category DTO
 */
export class ConfigCategoryDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Category name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Display name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ description: 'Display order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number = 0;

  @ApiPropertyOptional({ description: 'Is category active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

/**
 * Professional Configuration Item DTO
 */
export class ConfigItemDto {
  @ApiPropertyOptional({ description: 'Configuration item ID' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Configuration name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Display name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Configuration value' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ 
    description: 'Data type',
    enum: ['string', 'number', 'integer', 'boolean', 'json', 'array']
  })
  @IsOptional()
  @IsIn(['string', 'number', 'integer', 'boolean', 'json', 'array'])
  dataType?: string = 'string';

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: any;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiPropertyOptional({ description: 'Is field secret/password' })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean = false;

  @ApiPropertyOptional({ description: 'Is field read-only' })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Display order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number = 0;

  @ApiPropertyOptional({ description: 'Is configuration active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsObject()
  tags?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Created by user' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  updatedBy?: string;
}

/**
 * Create Configuration Item DTO
 */
export class CreateConfigItemDto {
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Configuration name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Display name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Configuration value' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ 
    description: 'Data type',
    enum: ['string', 'number', 'integer', 'boolean', 'json', 'array']
  })
  @IsOptional()
  @IsIn(['string', 'number', 'integer', 'boolean', 'json', 'array'])
  dataType?: string = 'string';

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: any;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiPropertyOptional({ description: 'Is field secret/password' })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean = false;

  @ApiPropertyOptional({ description: 'Is field read-only' })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean = false;

  @ApiPropertyOptional({ description: 'Display order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number = 0;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsObject()
  tags?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

/**
 * Update Configuration Item DTO
 */
export class UpdateConfigItemDto {
  @ApiPropertyOptional({ description: 'Display name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Configuration value' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ 
    description: 'Data type',
    enum: ['string', 'number', 'integer', 'boolean', 'json', 'array']
  })
  @IsOptional()
  @IsIn(['string', 'number', 'integer', 'boolean', 'json', 'array'])
  dataType?: string;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: any;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Is field secret/password' })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @ApiPropertyOptional({ description: 'Is field read-only' })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Display order', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Is configuration active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsOptional()
  @IsObject()
  tags?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

/**
 * Configuration Response DTO
 */
export class ConfigResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: any;

  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Total count' })
  total?: number;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: Date;
}
