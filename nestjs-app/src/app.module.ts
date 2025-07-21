import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WinstonModule } from 'nest-winston';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as winston from 'winston';

// Modules
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CallsModule } from './calls/calls.module';
import { CdrModule } from './cdr/cdr.module';

import { RecordingModule } from './recording/recording.module';
import { EslModule } from './esl/esl.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { WebSocketModule } from './websocket/websocket.module';

import { ConfigModule as ProfessionalConfigModule } from './config/config.module';
import { FreeSwitchModule } from './freeswitch/freeswitch.module';

// Controllers
import { AppController } from './app.controller';

// Services
import { AppService } from './app.service';

// Interceptors and Middleware
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { HttpLoggingMiddleware } from './common/middleware/http-logging.middleware';
import { CustomTypeOrmLogger } from './common/interceptors/database-logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'pbx_user'),
        password: configService.get('POSTGRES_PASSWORD', 'pbx_password'),
        database: configService.get('POSTGRES_DB', 'pbx_db'),
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
        ],
        migrations: [
          __dirname + '/migrations/*{.ts,.js}',
        ],
        synchronize: false, // Disable to prevent schema conflicts
        logging: configService.get('NODE_ENV') === 'development',
        logger: new CustomTypeOrmLogger(),
        retryAttempts: 3,
        retryDelay: 3000,
        maxQueryExecutionTime: 5000,
        extra: {
          max: configService.get('DB_POOL_MAX', 10),
          min: configService.get('DB_POOL_MIN', 2),
          idleTimeoutMillis: configService.get('DB_POOL_IDLE_TIMEOUT', 30000),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('RATE_LIMIT_TTL', 60) * 1000,
          limit: configService.get('RATE_LIMIT_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // Event emitter for real-time features
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Winston logging
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logPath = configService.get('LOG_FILE_PATH', './logs');
        const logFileEnabled = configService.get('LOG_FILE_ENABLED', 'true') === 'true';

        // Ensure log directory exists
        const fs = require('fs');
        const path = require('path');
        if (logFileEnabled && !fs.existsSync(logPath)) {
          fs.mkdirSync(logPath, { recursive: true });
        }

        const transports: any[] = [
          new winston.transports.Console({
            level: configService.get('LOG_LEVEL', 'info'),
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ];

        if (logFileEnabled) {
          transports.push(
            new winston.transports.File({
              filename: path.join(logPath, 'error.log'),
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            } as any),
            new winston.transports.File({
              filename: path.join(logPath, 'combined.log'),
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            } as any)
          );
        }

        return { transports };
      },
      inject: [ConfigService],
    }),

    // Application modules
    SharedModule,
    AuthModule,
    UsersModule,
    CallsModule,
    CdrModule,
    RecordingModule,
    EslModule,
    HealthModule,
    MetricsModule,
    WebSocketModule,
    // EnterpriseConfigModule, // TEMPORARILY DISABLED - Has conflicts
    ProfessionalConfigModule, // Professional Config Module
    FreeSwitchModule, // Enterprise FreeSWITCH Config Module
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggingMiddleware)
      .forRoutes('*');
  }
}
