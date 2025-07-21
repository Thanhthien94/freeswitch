import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';

async function updateAdminPassword() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Hash the password admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed');

    // Update admin user password
    const result = await queryRunner.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE username = 'admin'
    `, [hashedPassword]);

    console.log('✅ Admin password updated successfully');
    console.log('📋 Credentials: admin/admin123');

    // Verify the user
    const user = await queryRunner.query(`
      SELECT id, username, email, is_active 
      FROM users 
      WHERE username = 'admin'
    `);

    console.log('👤 Updated user:');
    console.table(user);

    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

updateAdminPassword();
