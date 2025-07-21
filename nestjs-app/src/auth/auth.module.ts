import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './auth.service';

// Strategies
import { ProfessionalJwtStrategy } from './strategies/professional-jwt.strategy';

// Guards
import { ProfessionalAuthGuard } from './guards/professional-auth.guard';

// Entities
import { User } from '../users/user.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthenticationLog } from './entities/authentication-log.entity';
import { RateLimitLog } from './entities/rate-limit-log.entity';
import { SecurityEvent } from './entities/security-event.entity';

// Shared Module
import { SharedModule } from '../shared/shared.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AuditLog,
      AuthenticationLog,
      RateLimitLog,
      SecurityEvent,
    ]),
    SharedModule,
    PassportModule,
    EventEmitterModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRY', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ProfessionalJwtStrategy,
    ProfessionalAuthGuard,

    // Legacy support (will be removed)
    {
      provide: 'JwtAuthGuard',
      useClass: ProfessionalAuthGuard,
    },
  ],
  exports: [
    AuthService,
    ProfessionalAuthGuard,
    ProfessionalJwtStrategy,
    JwtModule,
    TypeOrmModule,
    SharedModule,

    // Legacy support (will be removed)
    'JwtAuthGuard',
  ],
})
export class AuthModule {}
