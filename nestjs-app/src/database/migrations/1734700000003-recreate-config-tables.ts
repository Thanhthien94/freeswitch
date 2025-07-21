import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateConfigTables1734700000003 implements MigrationInterface {
  name = 'RecreateConfigTables1734700000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing config tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "config_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config_categories" CASCADE`);

    // Create config_categories table
    await queryRunner.query(`
      CREATE TABLE "config_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "description" text,
        "icon" character varying,
        "order" integer NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_config_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_config_categories" PRIMARY KEY ("id")
      )
    `);

    // Create config_items table
    await queryRunner.query(`
      CREATE TABLE "config_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "categoryId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "description" text,
        "value" text,
        "defaultValue" text,
        "dataType" character varying NOT NULL DEFAULT 'string',
        "validation" jsonb,
        "isRequired" boolean NOT NULL DEFAULT false,
        "isSecret" boolean NOT NULL DEFAULT false,
        "isReadOnly" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "tags" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedBy" character varying,
        CONSTRAINT "PK_config_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_config_items_category_name" UNIQUE ("categoryId", "name"),
        CONSTRAINT "FK_config_items_category" FOREIGN KEY ("categoryId") REFERENCES "config_categories"("id") ON DELETE CASCADE
      )
    `);

    // Create config_history table
    await queryRunner.query(`
      CREATE TABLE "config_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "configItemId" uuid NOT NULL,
        "action" character varying NOT NULL,
        "oldValue" text,
        "newValue" text,
        "changedBy" character varying NOT NULL,
        "changeReason" text,
        "ipAddress" character varying,
        "userAgent" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_config_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_config_history_item" FOREIGN KEY ("configItemId") REFERENCES "config_items"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_config_categories_name" ON "config_categories" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_categories_order" ON "config_categories" ("order")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_config_items_categoryId" ON "config_items" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_items_name" ON "config_items" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_items_order" ON "config_items" ("order")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_items_isActive" ON "config_items" ("isActive")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_config_history_configItemId" ON "config_history" ("configItemId")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_history_action" ON "config_history" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_history_changedBy" ON "config_history" ("changedBy")`);
    await queryRunner.query(`CREATE INDEX "IDX_config_history_createdAt" ON "config_history" ("createdAt")`);

    // Insert default categories
    await queryRunner.query(`
      INSERT INTO "config_categories" ("name", "displayName", "description", "icon", "order", "isActive", "createdAt", "updatedAt")
      VALUES 
        ('system', 'System Configuration', 'Core system settings', 'settings', 1, true, NOW(), NOW()),
        ('network', 'Network Configuration', 'Network and connectivity settings', 'network', 2, true, NOW(), NOW()),
        ('security', 'Security Configuration', 'Security and authentication settings', 'shield', 3, true, NOW(), NOW()),
        ('database', 'Database Configuration', 'Database connection and settings', 'database', 4, true, NOW(), NOW()),
        ('logging', 'Logging Configuration', 'Logging and monitoring settings', 'file-text', 5, true, NOW(), NOW()),
        ('email', 'Email Configuration', 'Email and notification settings', 'mail', 6, true, NOW(), NOW())
    `);

    // Insert sample config items
    await queryRunner.query(`
      INSERT INTO "config_items" (
        "categoryId", "name", "displayName", "description", "value", "defaultValue", 
        "dataType", "isRequired", "isSecret", "isReadOnly", "order", "isActive", 
        "createdAt", "updatedAt", "createdBy"
      )
      SELECT 
        c.id,
        'app_name',
        'Application Name',
        'The name of the application',
        'FreeSWITCH PBX API',
        'FreeSWITCH PBX API',
        'string',
        true,
        false,
        false,
        1,
        true,
        NOW(),
        NOW(),
        'system'
      FROM "config_categories" c WHERE c.name = 'system'
      
      UNION ALL
      
      SELECT 
        c.id,
        'app_version',
        'Application Version',
        'Current version of the application',
        '1.0.0',
        '1.0.0',
        'string',
        true,
        false,
        true,
        2,
        true,
        NOW(),
        NOW(),
        'system'
      FROM "config_categories" c WHERE c.name = 'system'
      
      UNION ALL
      
      SELECT 
        c.id,
        'debug_mode',
        'Debug Mode',
        'Enable debug logging and features',
        'false',
        'false',
        'boolean',
        false,
        false,
        false,
        3,
        true,
        NOW(),
        NOW(),
        'system'
      FROM "config_categories" c WHERE c.name = 'system'
      
      UNION ALL
      
      SELECT 
        c.id,
        'jwt_secret',
        'JWT Secret Key',
        'Secret key for JWT token signing',
        'your-super-secret-jwt-key-change-in-production',
        'change-me',
        'string',
        true,
        true,
        false,
        1,
        true,
        NOW(),
        NOW(),
        'system'
      FROM "config_categories" c WHERE c.name = 'security'
      
      UNION ALL
      
      SELECT 
        c.id,
        'session_timeout',
        'Session Timeout',
        'Session timeout in minutes',
        '60',
        '60',
        'integer',
        true,
        false,
        false,
        2,
        true,
        NOW(),
        NOW(),
        'system'
      FROM "config_categories" c WHERE c.name = 'security'
    `);

    console.log('✅ Config tables recreated successfully with professional schema');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "config_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "config_categories" CASCADE`);
    
    console.log('✅ Config tables dropped successfully');
  }
}
