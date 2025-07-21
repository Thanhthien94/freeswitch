import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedSimpleUser(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create simple test user (assuming domain_id 1 exists)
    await queryRunner.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name,
        domain_id, is_active, email_verified, language, timezone,
        created_at, updated_at
      )
      VALUES
        ('admin', 'admin@test.local', $1, 'Admin', 'User', 1, true, true, 'en', 'UTC', NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
    `, [hashedPassword]);

    await queryRunner.commitTransaction();
    console.log('✅ Simple test user created successfully');
    console.log('📋 Test credentials: admin/admin123');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Failed to create test user:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Run if called directly
if (require.main === module) {
  import('../data-source').then(({ AppDataSource }) => {
    AppDataSource.initialize()
      .then(() => seedSimpleUser(AppDataSource))
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
      });
  });
}
