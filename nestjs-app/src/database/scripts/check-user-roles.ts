import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

async function checkUserRoles() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Check if tables exist
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'roles', 'user_roles', 'permissions', 'role_permissions')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    console.table(tables);

    // Check admin user with relations
    const adminUser = await queryRunner.query(`
      SELECT u.id, u.username, u.email, u.domain_id, u.is_active
      FROM users u
      WHERE u.username = 'admin'
    `);
    
    console.log('\n👤 Admin user:');
    console.table(adminUser);

    // Check if user_roles table exists and has data
    try {
      const userRoles = await queryRunner.query(`
        SELECT ur.*, r.name as role_name
        FROM user_roles ur
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [adminUser[0]?.id]);
      
      console.log('\n🎭 User roles:');
      if (userRoles.length === 0) {
        console.log('No roles assigned to admin user');
      } else {
        console.table(userRoles);
      }
    } catch (error) {
      console.log('\n❌ user_roles table might not exist:', error.message);
    }

    // Check if roles table exists
    try {
      const roles = await queryRunner.query(`SELECT * FROM roles LIMIT 5`);
      console.log('\n🎭 Available roles:');
      if (roles.length === 0) {
        console.log('No roles found');
      } else {
        console.table(roles);
      }
    } catch (error) {
      console.log('\n❌ roles table might not exist:', error.message);
    }

    await queryRunner.release();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkUserRoles();
