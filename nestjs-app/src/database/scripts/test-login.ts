import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';

async function testLogin() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Test password validation
    const user = await queryRunner.query(`
      SELECT id, username, email, password_hash, is_active, domain_id
      FROM users 
      WHERE username = 'admin'
    `);

    if (!user || user.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Found user:');
    console.log({
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      is_active: user[0].is_active,
      domain_id: user[0].domain_id,
      has_password_hash: !!user[0].password_hash
    });

    // Test password validation
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user[0].password_hash);
    
    console.log('\n🔐 Password validation:');
    console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Test with different passwords
    const testPasswords = ['admin123', 'admin', 'password', 'test'];
    
    console.log('\n🧪 Testing multiple passwords:');
    for (const pwd of testPasswords) {
      const valid = await bcrypt.compare(pwd, user[0].password_hash);
      console.log(`"${pwd}": ${valid ? '✅' : '❌'}`);
    }

    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testLogin();
