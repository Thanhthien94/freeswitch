import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, Length, Matches, Min, Max } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9.-]+$/, { message: 'Domain name must contain only letters, numbers, dots, and hyphens' })
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsString()
  @Length(1, 100)
  displayName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxExtensions?: number;

  @IsOptional()
  settings?: Record<string, any>;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  billingPlan?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  costCenter?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  adminPhone?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
