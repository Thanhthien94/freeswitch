import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedTestUser(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create test domain
    const domainResult = await queryRunner.query(`
      INSERT INTO domains (name, display_name, description, is_active, created_at, updated_at)
      VALUES ('test.local', 'Test Domain', 'Test domain for authentication', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    
    const domainId = domainResult[0]?.id || 1;

    // Create roles if not exist
    await queryRunner.query(`
      INSERT INTO roles (name, display_name, description, is_active, created_at, updated_at)
      VALUES 
        ('superadmin', 'Super Administrator', 'Full system access', true, NOW(), NOW()),
        ('admin', 'Administrator', 'Domain administration access', true, NOW(), NOW()),
        ('operator', 'Operator', 'Operational access', true, NOW(), NOW()),
        ('viewer', 'Viewer', 'Read-only access', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    `);

    // Create permissions if not exist
    await queryRunner.query(`
      INSERT INTO permissions (name, description, resource, action, full_permission, is_active, created_at, updated_at)
      VALUES 
        ('Config Read', 'Read configuration items', 'config', 'read', 'config:read', true, NOW(), NOW()),
        ('Config Create', 'Create configuration items', 'config', 'create', 'config:create', true, NOW(), NOW()),
        ('Config Update', 'Update configuration items', 'config', 'update', 'config:update', true, NOW(), NOW()),
        ('Config Delete', 'Delete configuration items', 'config', 'delete', 'config:delete', true, NOW(), NOW()),
        ('System Health', 'View system health', 'system', 'health', 'system:health', true, NOW(), NOW()),
        ('User Read', 'Read user information', 'user', 'read', 'user:read', true, NOW(), NOW()),
        ('User Create', 'Create users', 'user', 'create', 'user:create', true, NOW(), NOW()),
        ('User Update', 'Update users', 'user', 'update', 'user:update', true, NOW(), NOW()),
        ('User Delete', 'Delete users', 'user', 'delete', 'user:delete', true, NOW(), NOW())
      ON CONFLICT (full_permission) DO UPDATE SET updated_at = NOW()
    `);

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create test users
    await queryRunner.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, display_name,
        domain_id, is_active, email_verified, language, timezone,
        created_at, updated_at
      )
      VALUES 
        ('admin', 'admin@test.local', $1, 'Admin', 'User', 'Administrator', $2, true, true, 'en', 'UTC', NOW(), NOW()),
        ('operator', 'operator@test.local', $1, 'Operator', 'User', 'Operator', $2, true, true, 'en', 'UTC', NOW(), NOW()),
        ('viewer', 'viewer@test.local', $1, 'Viewer', 'User', 'Viewer', $2, true, true, 'en', 'UTC', NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
    `, [hashedPassword, domainId]);

    // Get role and user IDs
    const roles = await queryRunner.query(`SELECT id, name FROM roles WHERE name IN ('superadmin', 'admin', 'operator', 'viewer')`);
    const users = await queryRunner.query(`SELECT id, username FROM users WHERE username IN ('admin', 'operator', 'viewer')`);

    const roleMap = roles.reduce((acc, role) => ({ ...acc, [role.name]: role.id }), {});
    const userMap = users.reduce((acc, user) => ({ ...acc, [user.username]: user.id }), {});

    // Assign roles to users
    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id, is_active, is_primary, created_at, updated_at)
      VALUES 
        ($1, $2, true, true, NOW(), NOW()),
        ($3, $4, true, true, NOW(), NOW()),
        ($5, $6, true, true, NOW(), NOW())
      ON CONFLICT (user_id, role_id) DO UPDATE SET 
        is_active = true,
        updated_at = NOW()
    `, [
      userMap['admin'], roleMap['admin'],
      userMap['operator'], roleMap['operator'],
      userMap['viewer'], roleMap['viewer']
    ]);

    // Assign permissions to roles
    const permissions = await queryRunner.query(`SELECT id, full_permission FROM permissions`);
    const permissionMap = permissions.reduce((acc, perm) => ({ ...acc, [perm.full_permission]: perm.id }), {});

    // Admin role permissions
    const adminPermissions = [
      'config:read', 'config:create', 'config:update', 'config:delete',
      'system:health', 'user:read', 'user:create', 'user:update'
    ];

    // Operator role permissions
    const operatorPermissions = [
      'config:read', 'config:create', 'config:update',
      'system:health', 'user:read'
    ];

    // Viewer role permissions
    const viewerPermissions = [
      'config:read', 'system:health', 'user:read'
    ];

    // Insert role permissions
    for (const permission of adminPermissions) {
      if (permissionMap[permission]) {
        await queryRunner.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (role_id, permission_id) DO UPDATE SET updated_at = NOW()
        `, [roleMap['admin'], permissionMap[permission]]);
      }
    }

    for (const permission of operatorPermissions) {
      if (permissionMap[permission]) {
        await queryRunner.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (role_id, permission_id) DO UPDATE SET updated_at = NOW()
        `, [roleMap['operator'], permissionMap[permission]]);
      }
    }

    for (const permission of viewerPermissions) {
      if (permissionMap[permission]) {
        await queryRunner.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (role_id, permission_id) DO UPDATE SET updated_at = NOW()
        `, [roleMap['viewer'], permissionMap[permission]]);
      }
    }

    await queryRunner.commitTransaction();
    console.log('✅ Test users seeded successfully');
    console.log('📋 Test credentials:');
    console.log('   - admin/admin123 (Admin role)');
    console.log('   - operator/admin123 (Operator role)');
    console.log('   - viewer/admin123 (Viewer role)');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Failed to seed test users:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Run if called directly
if (require.main === module) {
  import('../data-source').then(({ AppDataSource }) => {
    AppDataSource.initialize()
      .then(() => seedTestUser(AppDataSource))
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
      });
  });
}
