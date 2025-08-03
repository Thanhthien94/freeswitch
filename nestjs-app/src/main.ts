import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
// import * as helmet from 'helmet';
import * as compression from 'compression';
import * as session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create Enhanced Winston logger
  const logger = WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'freeswitch-api' },
    transports: [
      // Console transport with colors for development
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
          }),
        ),
      }),
      // Error log file
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 10,
      }),
      // HTTP requests log file
      new winston.transports.File({
        filename: 'logs/http.log',
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            return (typeof info.message === 'string' && info.message.includes('HTTP')) ? info : false;
          })(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Performance log file
      new winston.transports.File({
        filename: 'logs/performance.log',
        level: 'debug',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format((info) => {
            return (typeof info.message === 'string' && (info.message.includes('PERFORMANCE') || info.message.includes('SLOW'))) ? info : false;
          })(),
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Setup WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const configService = app.get(ConfigService);

  // Setup Redis for session storage with comprehensive monitoring
  const redisUrl = configService.get('REDIS_URL');
  const redisHost = configService.get('REDIS_HOST', 'localhost');
  const redisPort = configService.get('REDIS_PORT', 6379);
  const redisPassword = configService.get('REDIS_PASSWORD');

  let redisClient: any;
  let redisConnected = false;

  try {
    logger.log('🔄 Initializing Redis connection...', 'Bootstrap');

    if (redisUrl) {
      // Production: Use REDIS_URL
      logger.log(`🔗 Connecting to Redis via URL: ${redisUrl}`, 'Bootstrap');
      redisClient = createClient({ url: redisUrl });
    } else {
      // Development: Use host/port
      logger.log(`🔗 Connecting to Redis at ${redisHost}:${redisPort}`, 'Bootstrap');
      redisClient = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        password: redisPassword,
      });
    }

    // Add Redis event listeners for monitoring
    redisClient.on('connect', () => {
      logger.log('🟢 Redis client connected', 'Redis');
    });

    redisClient.on('ready', () => {
      logger.log('✅ Redis client ready for commands', 'Redis');
      redisConnected = true;
    });

    redisClient.on('error', (err: any) => {
      logger.error('🔴 Redis client error:', err, 'Redis');
      redisConnected = false;
    });

    redisClient.on('end', () => {
      logger.warn('🟡 Redis client connection ended', 'Redis');
      redisConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.log('🔄 Redis client reconnecting...', 'Redis');
    });

    // Connect with timeout
    const connectTimeout = setTimeout(() => {
      logger.error('⏰ Redis connection timeout after 10 seconds', 'Redis');
      throw new Error('Redis connection timeout');
    }, 10000);

    await redisClient.connect();
    clearTimeout(connectTimeout);

    // Test Redis connection
    const pingResult = await redisClient.ping();
    logger.log(`🏓 Redis ping test: ${pingResult}`, 'Bootstrap');

    logger.log('✅ Redis connected successfully', 'Bootstrap');

    // Setup session middleware with monitoring
    const sessionStore = new RedisStore({
      client: redisClient,
    });

    // Monitor session store events
    sessionStore.on('connect', () => {
      logger.log('🟢 Session store connected to Redis', 'Session');
    });

    sessionStore.on('disconnect', () => {
      logger.warn('🔴 Session store disconnected from Redis', 'Session');
    });

    app.use(
      session({
        store: sessionStore,
        secret: configService.get('SESSION_SECRET', 'your-secret-key'),
        resave: false,
        saveUninitialized: false,
        name: 'pbx.session.id', // Custom session name
        cookie: {
          secure: false, // Set to false for HTTP in production (behind proxy)
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax',
          domain: '.finstar.vn', // Share cookies across subdomains
        },
      }),
    );

    logger.log('✅ Session middleware configured with Redis store', 'Bootstrap');

    // Setup periodic Redis health check
    setInterval(async () => {
      try {
        if (redisClient && redisConnected) {
          const pingResult = await redisClient.ping();
          if (pingResult === 'PONG') {
            logger.debug('🏓 Redis health check: OK', 'Redis');
          }
        }
      } catch (error) {
        logger.error('❌ Redis health check failed:', error, 'Redis');
        redisConnected = false;
      }
    }, 30000); // Check every 30 seconds
  } catch (error) {
    logger.error('Redis connection failed, continuing without sessions:', error);
    // Continue without Redis sessions - JWT still works
  }

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
  const corsOrigins = new Set([
    // Default development origins
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ]);

  // Add origins from CORS_ORIGIN environment variable
  const corsOriginEnv = configService.get('CORS_ORIGIN');
  if (corsOriginEnv) {
    corsOriginEnv.split(',').forEach((origin: string) => {
      corsOrigins.add(origin.trim());
    });
  }

  // Add current domain from DOMAIN env var
  const domain = configService.get('DOMAIN');
  if (domain) {
    corsOrigins.add(domain);
    // Also add with port 3002 for frontend
    try {
      const domainUrl = new URL(domain);
      corsOrigins.add(`${domainUrl.protocol}//${domainUrl.hostname}:3002`);
    } catch (error) {
      // If domain is not a valid URL, try to construct it
      corsOrigins.add(`http://${domain}:3002`);
    }
  }

  // Convert Set to Array for logging and usage
  const corsOriginsArray = Array.from(corsOrigins);

  // Log CORS origins for debugging
  logger.log(`CORS Origins: ${corsOriginsArray.join(', ')}`, 'Bootstrap');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (corsOriginsArray.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`, 'Bootstrap');
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Query-Params'],
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
