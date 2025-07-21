import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

async function checkSchema() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Check users table columns
    const userColumns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table columns:');
    console.table(userColumns);

    // Check if our new columns exist
    const newColumns = [
      'currentSessionId', 'current_session_id',
      'lastActivityAt', 'last_activity_at',
      'lastActivityIp', 'last_activity_ip',
      'lastActivityUserAgent', 'last_activity_user_agent',
      'requirePasswordChange', 'require_password_change',
      'mfaEnabled', 'mfa_enabled',
      'mfaSecret', 'mfa_secret',
      'language', 'timezone',
      'loginAttempts', 'login_attempts',
      'lockedUntil', 'locked_until',
      'emailVerified', 'email_verified',
      'lastLoginAt', 'last_login_at'
    ];

    console.log('\n🔍 Checking for new columns:');
    const existingColumnNames = userColumns.map(col => col.column_name);
    
    for (const col of newColumns) {
      const exists = existingColumnNames.includes(col);
      console.log(`${col}: ${exists ? '✅' : '❌'}`);
    }

    // Check migration table
    const migrations = await queryRunner.query(`
      SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5
    `);
    
    console.log('\n📋 Recent migrations:');
    console.table(migrations);

    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkSchema();
