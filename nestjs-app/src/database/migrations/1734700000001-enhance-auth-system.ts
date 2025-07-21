import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class EnhanceAuthSystem1734700000001 implements MigrationInterface {
  name = 'EnhanceAuthSystem1734700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table for enhanced authentication
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'currentSessionId',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Current active session ID for session validation',
      }),
      new TableColumn({
        name: 'lastActivityAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Last activity timestamp',
      }),
      new TableColumn({
        name: 'lastActivityIp',
        type: 'varchar',
        length: '45',
        isNullable: true,
        comment: 'Last activity IP address',
      }),
      new TableColumn({
        name: 'lastActivityUserAgent',
        type: 'text',
        isNullable: true,
        comment: 'Last activity user agent',
      }),
      new TableColumn({
        name: 'requirePasswordChange',
        type: 'boolean',
        default: false,
        comment: 'Whether user must change password on next login',
      }),
      new TableColumn({
        name: 'mfaEnabled',
        type: 'boolean',
        default: false,
        comment: 'Whether multi-factor authentication is enabled',
      }),
      new TableColumn({
        name: 'mfaSecret',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'MFA secret key (encrypted)',
      }),
      new TableColumn({
        name: 'language',
        type: 'varchar',
        length: '10',
        default: "'en'",
        comment: 'User preferred language',
      }),
      new TableColumn({
        name: 'timezone',
        type: 'varchar',
        length: '50',
        default: "'UTC'",
        comment: 'User preferred timezone',
      }),
      new TableColumn({
        name: 'loginAttempts',
        type: 'int',
        default: 0,
        comment: 'Failed login attempts counter',
      }),
      new TableColumn({
        name: 'lockedUntil',
        type: 'timestamp',
        isNullable: true,
        comment: 'Account locked until this timestamp',
      }),
      new TableColumn({
        name: 'emailVerified',
        type: 'boolean',
        default: false,
        comment: 'Whether email is verified',
      }),
      new TableColumn({
        name: 'lastLoginAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Last login timestamp',
      }),
    ]);

    // Add indexes for performance
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_currentSessionId',
      columnNames: ['currentSessionId'],
    }));
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_lastActivityAt', 
      columnNames: ['lastActivityAt'],
    }));
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_lastActivityIp',
      columnNames: ['lastActivityIp'],
    }));

    // Create authentication_logs table
    await queryRunner.createTable(new Table({
      name: 'authentication_logs',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'userId',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'username',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'action',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'resource',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'success',
          type: 'boolean',
          default: false,
        },
        {
          name: 'ipAddress',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'userAgent',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'sessionId',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'errorMessage',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'duration',
          type: 'int',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
      indices: [
        {
          name: 'IDX_auth_logs_userId',
          columnNames: ['userId'],
        },
        {
          name: 'IDX_auth_logs_action',
          columnNames: ['action'],
        },
        {
          name: 'IDX_auth_logs_success',
          columnNames: ['success'],
        },
        {
          name: 'IDX_auth_logs_ipAddress',
          columnNames: ['ipAddress'],
        },
        {
          name: 'IDX_auth_logs_timestamp',
          columnNames: ['timestamp'],
        },
        {
          name: 'IDX_auth_logs_sessionId',
          columnNames: ['sessionId'],
        },
      ],
    }), true);

    // Create rate_limit_logs table
    await queryRunner.createTable(new Table({
      name: 'rate_limit_logs',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'userId',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'username',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'ipAddress',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'endpoint',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'userAgent',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'currentCount',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'maxRequests',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'windowMs',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'exceeded',
          type: 'boolean',
          default: false,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
      indices: [
        {
          name: 'IDX_rate_limit_userId',
          columnNames: ['userId'],
        },
        {
          name: 'IDX_rate_limit_ipAddress',
          columnNames: ['ipAddress'],
        },
        {
          name: 'IDX_rate_limit_endpoint',
          columnNames: ['endpoint'],
        },
        {
          name: 'IDX_rate_limit_exceeded',
          columnNames: ['exceeded'],
        },
        {
          name: 'IDX_rate_limit_timestamp',
          columnNames: ['timestamp'],
        },
      ],
    }), true);

    console.log('Enhanced authentication system migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new tables
    await queryRunner.dropTable('rate_limit_logs');
    await queryRunner.dropTable('authentication_logs');

    // Drop indexes
    await queryRunner.dropIndex('users', 'IDX_users_currentSessionId');
    await queryRunner.dropIndex('users', 'IDX_users_lastActivityAt');
    await queryRunner.dropIndex('users', 'IDX_users_lastActivityIp');

    // Drop new columns from users table
    await queryRunner.dropColumns('users', [
      'currentSessionId',
      'lastActivityAt',
      'lastActivityIp',
      'lastActivityUserAgent',
      'requirePasswordChange',
      'mfaEnabled',
      'mfaSecret',
      'language',
      'timezone',
      'loginAttempts',
      'lockedUntil',
      'emailVerified',
      'lastLoginAt',
    ]);

    console.log('Enhanced authentication system migration rolled back successfully');
  }
}
