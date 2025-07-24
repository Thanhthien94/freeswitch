import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsEmail, IsArray, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password (required for non-admin users)',
    example: 'CurrentPassword123!',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Confirm new password',
    example: 'NewPassword123!',
  })
  @IsString()
  confirmPassword: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by domain ID' })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['active', 'inactive', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BulkUpdateDto {
  @ApiPropertyOptional({ description: 'Array of user IDs to update' })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiPropertyOptional({ description: 'Updates to apply' })
  @IsObject()
  updates: Partial<UpdateUserDto>;
}

export class BulkDeleteDto {
  @ApiPropertyOptional({ description: 'Array of user IDs to delete' })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}
