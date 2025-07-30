import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';

/**
 * 🚀 UNIFIED DATABASE INITIALIZATION
 * 
 * This is the SINGLE source of truth for initializing all required data
 * for the FreeSWITCH PBX system. It handles:
 * 
 * 1. Core system data (domains, roles, permissions)
 * 2. Default admin user
 * 3. Basic FreeSWITCH configuration
 * 4. Essential system settings
 */

interface SeedResult {
  success: boolean;
  message: string;
  data?: any;
}

class DatabaseSeeder {
  private dataSource: DataSource;
  private queryRunner: any;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async initialize(): Promise<void> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async finalize(commit: boolean = true): Promise<void> {
    try {
      if (commit) {
        await this.queryRunner.commitTransaction();
        console.log('✅ All seeds committed successfully');
      } else {
        await this.queryRunner.rollbackTransaction();
        console.log('❌ Seeds rolled back');
      }
    } finally {
      await this.queryRunner.release();
    }
  }

  /**
   * 🏢 Seed core domains
   */
  async seedDomains(): Promise<SeedResult> {
    try {
      console.log('🏢 Seeding domains...');
      
      const result = await this.queryRunner.query(`
        INSERT INTO domains (name, display_name, description, is_active, created_at, updated_at)
        VALUES 
          ('localhost', 'Local Domain', 'Default local domain for development', true, NOW(), NOW()),
          ('pbx.local', 'PBX Domain', 'Main PBX domain', true, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET 
          updated_at = NOW()
        RETURNING id, name
      `);

      return {
        success: true,
        message: `Created/updated ${result.length} domains`,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to seed domains: ${error.message}`
      };
    }
  }

  /**
   * 👥 Seed roles and permissions
   */
  async seedRolesAndPermissions(): Promise<SeedResult> {
    try {
      console.log('👥 Seeding roles and permissions...');

      // Create roles
      await this.queryRunner.query(`
        INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
        VALUES 
          ('superadmin', 'Super Administrator', 'Full system access', true, NOW(), NOW()),
          ('admin', 'Administrator', 'Administrative access', true, NOW(), NOW()),
          ('operator', 'Operator', 'Call center operator', true, NOW(), NOW()),
          ('user', 'User', 'Basic user access', true, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET 
          updated_at = NOW()
      `);

      // Create permissions
      await this.queryRunner.query(`
        INSERT INTO permissions (name, display_name, description, resource, action, created_at, updated_at)
        VALUES 
          ('*:manage', 'Full Access', 'Complete system management', '*', 'manage', NOW(), NOW()),
          ('users:manage', 'User Management', 'Manage users and accounts', 'users', 'manage', NOW(), NOW()),
          ('calls:manage', 'Call Management', 'Manage calls and routing', 'calls', 'manage', NOW(), NOW()),
          ('cdr:view', 'CDR View', 'View call detail records', 'cdr', 'view', NOW(), NOW()),
          ('recordings:view', 'Recordings View', 'View call recordings', 'recordings', 'view', NOW(), NOW()),
          ('system:view', 'System View', 'View system status', 'system', 'view', NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET 
          updated_at = NOW()
      `);

      // Assign permissions to roles
      await this.queryRunner.query(`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r, permissions p
        WHERE (r.name = 'superadmin' AND p.name = '*:manage')
           OR (r.name = 'admin' AND p.name IN ('users:manage', 'calls:manage', 'cdr:view', 'recordings:view', 'system:view'))
           OR (r.name = 'operator' AND p.name IN ('calls:manage', 'cdr:view', 'system:view'))
           OR (r.name = 'user' AND p.name IN ('cdr:view', 'system:view'))
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);

      return {
        success: true,
        message: 'Roles and permissions seeded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to seed roles: ${error.message}`
      };
    }
  }

  /**
   * 👤 Seed default admin user
   */
  async seedDefaultUser(): Promise<SeedResult> {
    try {
      console.log('👤 Seeding default admin user...');

      // Get localhost domain
      const domain = await this.queryRunner.query(`
        SELECT id FROM domains WHERE name = 'localhost' LIMIT 1
      `);

      if (!domain.length) {
        throw new Error('Localhost domain not found');
      }

      const domainId = domain[0].id;
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Create admin user
      const userResult = await this.queryRunner.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, display_name,
          domain_id, is_active, email_verified, language, timezone,
          created_at, updated_at
        )
        VALUES (
          'admin', 'admin@localhost', $1, 'System', 'Administrator', 'Admin',
          $2, true, true, 'en', 'UTC', NOW(), NOW()
        )
        ON CONFLICT (username) DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
        RETURNING id, username
      `, [hashedPassword, domainId]);

      // Assign superadmin role
      const userId = userResult[0].id;
      await this.queryRunner.query(`
        INSERT INTO user_roles (user_id, role_id, created_at)
        SELECT $1, r.id, NOW()
        FROM roles r
        WHERE r.name = 'superadmin'
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [userId]);

      return {
        success: true,
        message: 'Default admin user created successfully',
        data: { username: 'admin', password: 'admin123' }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to seed admin user: ${error.message}`
      };
    }
  }

  /**
   * ⚙️ Seed basic system configuration
   */
  async seedSystemConfig(): Promise<SeedResult> {
    try {
      console.log('⚙️ Seeding system configuration...');

      // Basic system settings
      await this.queryRunner.query(`
        INSERT INTO config_items (
          category_id, key, name, description, value, default_value, 
          type, is_required, is_sensitive, is_readonly, sort_order, 
          is_active, created_at, updated_at, scope
        )
        SELECT 
          c.id, 'system_name', 'System Name', 'PBX system name', 
          'FreeSWITCH PBX', 'FreeSWITCH PBX', 'string', 
          true, false, false, 1, true, NOW(), NOW(), 'system'
        FROM config_categories c WHERE c.name = 'system'
        ON CONFLICT (category_id, key) DO UPDATE SET updated_at = NOW()
      `);

      return {
        success: true,
        message: 'System configuration seeded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to seed system config: ${error.message}`
      };
    }
  }

  /**
   * 🚀 Run all seeds in correct order
   */
  async runAllSeeds(): Promise<void> {
    console.log('🚀 Starting unified database initialization...\n');

    const results: SeedResult[] = [];

    // Run seeds in dependency order
    results.push(await this.seedDomains());
    results.push(await this.seedRolesAndPermissions());
    results.push(await this.seedDefaultUser());
    results.push(await this.seedSystemConfig());

    // Check results
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      console.log('\n❌ Some seeds failed:');
      failed.forEach(f => console.log(`  - ${f.message}`));
      await this.finalize(false);
      throw new Error('Database seeding failed');
    } else {
      console.log('\n✅ All seeds completed successfully:');
      results.forEach(r => console.log(`  - ${r.message}`));
      await this.finalize(true);
    }

    console.log('\n🎉 Database initialization completed!');
    console.log('📋 Default credentials: admin / admin123');
  }
}

/**
 * Main execution function
 */
async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const seeder = new DatabaseSeeder(AppDataSource);
    await seeder.initialize();
    await seeder.runAllSeeds();

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run if called directly
if (require.main === module) {
  runSeeds();
}

export { DatabaseSeeder, runSeeds };
