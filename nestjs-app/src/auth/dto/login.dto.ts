import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username for login',
    example: 'admin@localhost',
  })
  @IsString()
  emailOrUsername: string;

  @ApiProperty({
    description: 'Password for login',
    example: 'admin123',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Remember me option for extended session',
    default: false,
  })
  @IsOptional()
  rememberMe?: boolean;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Username for registration',
    example: 'john_doe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Email for registration',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for registration',
    example: 'SecurePassword123!',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
