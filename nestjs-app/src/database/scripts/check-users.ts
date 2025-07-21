import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

async function checkUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Check users table structure
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Get table info
    const tableInfo = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table structure:');
    console.table(tableInfo);

    // Check existing users
    const users = await queryRunner.query(`SELECT id, username, email, is_active FROM users LIMIT 10`);
    
    console.log('\n👥 Existing users:');
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      console.table(users);
    }

    // Check domains
    const domains = await queryRunner.query(`SELECT id, name FROM domains LIMIT 5`);
    console.log('\n🌐 Available domains:');
    if (domains.length === 0) {
      console.log('No domains found in database');
    } else {
      console.table(domains);
    }

    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkUsers();
