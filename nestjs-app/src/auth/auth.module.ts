import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './auth.service';
import { RBACService } from './services/rbac.service';
import { ABACService } from './services/abac.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PolicyGuard } from './guards/policy.guard';

// Entities
import { User } from '../users/user.entity';
import { Domain } from './entities/domain.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { UserAttribute } from './entities/user-attribute.entity';
import { Policy } from './entities/policy.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Domain,
      Role,
      Permission,
      UserRole,
      UserAttribute,
      Policy,
      AuditLog,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRY', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RBACService,
    ABACService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
  exports: [
    AuthService,
    RBACService,
    ABACService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
})
export class AuthModule {}
