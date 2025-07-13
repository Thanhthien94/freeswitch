import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  newPassword: string;
}
