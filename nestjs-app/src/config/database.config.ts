import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

// Import all entities
import { User } from '../users/user.entity';
import { Domain } from '../auth/entities/domain.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { UserRole } from '../auth/entities/user-role.entity';
import { UserAttribute } from '../auth/entities/user-attribute.entity';
import { Policy } from '../auth/entities/policy.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';
import { CallDetailRecord } from '../cdr/cdr.entity';

// Import all migrations - disabled for now
// import { CreateDomains1700000001 } from '../migrations/1700000001-CreateDomains';
// import { CreatePermissions1700000002 } from '../migrations/1700000002-CreatePermissions';
// import { CreateRoles1700000003 } from '../migrations/1700000003-CreateRoles';
// import { UpdateUsers1700000004 } from '../migrations/1700000004-UpdateUsers';
// import { CreateUserRoles1700000005 } from '../migrations/1700000005-CreateUserRoles';
// import { CreateUserAttributes1700000006 } from '../migrations/1700000006-CreateUserAttributes';
// import { CreatePolicies1700000007 } from '../migrations/1700000007-CreatePolicies';
// import { CreateAuditLogs1700000008 } from '../migrations/1700000008-CreateAuditLogs';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'freeswitch_dev'),
  synchronize: false, // Use migrations instead
  logging: configService.get('NODE_ENV') === 'development',
  entities: [
    User,
    Domain,
    Role,
    Permission,
    UserRole,
    UserAttribute,
    Policy,
    AuditLog,
    CallDetailRecord,
  ],
  migrations: [
    // Migrations temporarily disabled
  ],
  migrationsTableName: 'migrations',
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

// Database configuration for NestJS
export const databaseConfig = {
  type: 'postgres' as const,
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'freeswitch_dev'),
  synchronize: false, // Disable to prevent schema conflicts
  logging: configService.get('NODE_ENV') === 'development',
  entities: [
    User,
    Domain,
    Role,
    Permission,
    UserRole,
    UserAttribute,
    Policy,
    AuditLog,
    CallDetailRecord,
  ],
  migrations: [],
  migrationsTableName: 'migrations',
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false,
  } : false,
};

export default AppDataSource;
