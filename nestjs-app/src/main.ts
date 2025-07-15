import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
// import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);

  // Security middleware - Disabled for CORS testing
  // app.use(helmet.default({
  //   crossOriginResourcePolicy: false,
  // }));
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ];

  // Add production origins from environment
  const productionOrigin = configService.get('CORS_ORIGIN');
  if (productionOrigin) {
    corsOrigins.push(...productionOrigin.split(',').map(origin => origin.trim()));
  }

  // Add current domain from DOMAIN env var
  const domain = configService.get('DOMAIN');
  if (domain) {
    corsOrigins.push(domain);
    // Also add with port 3002 for frontend
    try {
      const domainUrl = new URL(domain);
      corsOrigins.push(`${domainUrl.protocol}//${domainUrl.hostname}:3002`);
    } catch (error) {
      // If domain is not a valid URL, try to construct it
      corsOrigins.push(`http://${domain}:3002`);
    }
  }

  // Log CORS origins for debugging
  logger.log(`CORS Origins: ${corsOrigins.join(', ')}`, 'Bootstrap');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`, 'Bootstrap');
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  if (configService.get('SWAGGER_ENABLED', true)) {
    const config = new DocumentBuilder()
      .setTitle('FreeSWITCH PBX API')
      .setDescription('Enterprise PBX API with FreeSWITCH and NestJS')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Calls', 'Call management endpoints')
      .addTag('CDR', 'Call Detail Records endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = configService.get('SWAGGER_PATH', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger documentation available at /${swaggerPath}`, 'Bootstrap');
  }

  // Start server
  const port = configService.get('API_PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Health check available at: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
