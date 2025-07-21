import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { ConfigItem, ConfigCategory } from './entities/config-item.entity';

// Services
import { ConfigProfessionalService } from './services/config-professional.service';

// Controllers
import { ConfigProfessionalController } from './controllers/config-professional.controller';

/**
 * Professional Configuration Management Module
 * 
 * Clean, modern config system with:
 * - Professional authentication integration
 * - Clean entity structure matching database
 * - Comprehensive API with Swagger documentation
 * - Proper validation and error handling
 * - Audit logging and security
 */
@Module({
  imports: [
    // TypeORM for database entities
    TypeOrmModule.forFeature([
      ConfigItem,
      ConfigCategory,
    ]),

    // JWT for authentication (inherited from auth module)
    JwtModule.registerAsync({
      imports: [NestConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),

    // Config module for environment variables
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],

  providers: [
    // Professional Config Service
    ConfigProfessionalService,
  ],

  controllers: [
    // Professional Config Controller
    ConfigProfessionalController,
  ],

  exports: [
    // Export TypeORM module for other modules to use entities
    TypeOrmModule,
    
    // Export Professional Config Service
    ConfigProfessionalService,
  ],
})
export class ConfigModule {
  constructor() {
    console.log('🚀 Professional Configuration Module initialized');
  }
}
