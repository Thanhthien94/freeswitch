import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ExtensionType, ExtensionStatus } from '../extension.entity';

export class ExtensionQueryDto {
  @IsOptional()
  @IsString()
  domainId?: string;

  @IsOptional()
  @IsEnum(ExtensionType)
  type?: ExtensionType;

  @IsOptional()
  @IsEnum(ExtensionStatus)
  status?: ExtensionStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRegistered?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
