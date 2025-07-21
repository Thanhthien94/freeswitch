import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateConfigTables1734700000002 implements MigrationInterface {
  name = 'CreateConfigTables1734700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create config_categories table
    await queryRunner.createTable(new Table({
      name: 'config_categories',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'name',
          type: 'varchar',
          isUnique: true,
        },
        {
          name: 'displayName',
          type: 'varchar',
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'icon',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'order',
          type: 'int',
          default: 0,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
      indices: [
        {
          name: 'IDX_config_categories_name',
          columnNames: ['name'],
        },
        {
          name: 'IDX_config_categories_order',
          columnNames: ['order'],
        },
      ],
    }), true);

    // Create config_items table
    await queryRunner.createTable(new Table({
      name: 'config_items',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'categoryId',
          type: 'uuid',
        },
        {
          name: 'name',
          type: 'varchar',
        },
        {
          name: 'displayName',
          type: 'varchar',
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'value',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'defaultValue',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'dataType',
          type: 'varchar',
          default: "'string'",
        },
        {
          name: 'validation',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'isRequired',
          type: 'boolean',
          default: false,
        },
        {
          name: 'isSecret',
          type: 'boolean',
          default: false,
        },
        {
          name: 'isReadOnly',
          type: 'boolean',
          default: false,
        },
        {
          name: 'order',
          type: 'int',
          default: 0,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'tags',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'createdBy',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'updatedBy',
          type: 'varchar',
          isNullable: true,
        },
      ],
      indices: [
        {
          name: 'IDX_config_items_category',
          columnNames: ['categoryId'],
        },
        {
          name: 'IDX_config_items_name',
          columnNames: ['name'],
        },
        {
          name: 'IDX_config_items_category_name',
          columnNames: ['categoryId', 'name'],
          isUnique: true,
        },
        {
          name: 'IDX_config_items_order',
          columnNames: ['order'],
        },
        {
          name: 'IDX_config_items_active',
          columnNames: ['isActive'],
        },
      ],
      foreignKeys: [
        {
          name: 'FK_config_items_category',
          columnNames: ['categoryId'],
          referencedTableName: 'config_categories',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    }), true);

    // Create config_history table for audit trail
    await queryRunner.createTable(new Table({
      name: 'config_history',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'configItemId',
          type: 'uuid',
        },
        {
          name: 'action',
          type: 'varchar',
        },
        {
          name: 'oldValue',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'newValue',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'changedBy',
          type: 'varchar',
        },
        {
          name: 'changeReason',
          type: 'text',
          isNullable: true,
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
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
      indices: [
        {
          name: 'IDX_config_history_item',
          columnNames: ['configItemId'],
        },
        {
          name: 'IDX_config_history_action',
          columnNames: ['action'],
        },
        {
          name: 'IDX_config_history_user',
          columnNames: ['changedBy'],
        },
        {
          name: 'IDX_config_history_created',
          columnNames: ['createdAt'],
        },
      ],
      foreignKeys: [
        {
          name: 'FK_config_history_item',
          columnNames: ['configItemId'],
          referencedTableName: 'config_items',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    }), true);

    // Insert default categories
    await queryRunner.query(`
      INSERT INTO config_categories (name, "displayName", description, icon, "order", "isActive", "createdAt", "updatedAt")
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
      INSERT INTO config_items (
        "categoryId", name, "displayName", description, value, "defaultValue", 
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
      FROM config_categories c WHERE c.name = 'system'
      
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
      FROM config_categories c WHERE c.name = 'system'
      
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
      FROM config_categories c WHERE c.name = 'system'
    `);

    console.log('✅ Config tables created successfully with sample data');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('config_history');
    await queryRunner.dropTable('config_items');
    await queryRunner.dropTable('config_categories');
    
    console.log('✅ Config tables dropped successfully');
  }
}
