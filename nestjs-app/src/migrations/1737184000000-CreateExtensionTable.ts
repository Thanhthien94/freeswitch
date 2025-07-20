import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateExtensionTable1737184000000 implements MigrationInterface {
  name = 'CreateExtensionTable1737184000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create extensions table
    await queryRunner.createTable(
      new Table({
        name: 'extensions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'extension',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'domain_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['user', 'conference', 'queue', 'ivr', 'voicemail', 'gateway'],
            default: "'user'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended', 'pending'],
            default: "'active'",
          },
          {
            name: 'sip_password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'auth_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          // Call Settings
          {
            name: 'caller_id_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'caller_id_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'outbound_caller_id_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'outbound_caller_id_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          // Voicemail Settings
          {
            name: 'voicemail_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'voicemail_password',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'voicemail_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'voicemail_attach_file',
            type: 'boolean',
            default: false,
          },
          {
            name: 'voicemail_delete_file',
            type: 'boolean',
            default: false,
          },
          // Call Forwarding
          {
            name: 'call_forward_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'call_forward_destination',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'call_forward_on_busy',
            type: 'boolean',
            default: false,
          },
          {
            name: 'call_forward_on_no_answer',
            type: 'boolean',
            default: false,
          },
          {
            name: 'call_forward_timeout',
            type: 'int',
            default: 20,
          },
          // Call Recording
          {
            name: 'call_recording_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'call_recording_mode',
            type: 'varchar',
            length: '20',
            default: "'none'",
          },
          // DND and Presence
          {
            name: 'dnd_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'presence_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          // Advanced Settings
          {
            name: 'max_calls',
            type: 'int',
            default: 1,
          },
          {
            name: 'call_timeout',
            type: 'int',
            default: 30,
          },
          {
            name: 'call_group',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pickup_group',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'codec_prefs',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Network Settings
          {
            name: 'force_ping',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sip_force_contact',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sip_force_expires',
            type: 'int',
            isNullable: true,
          },
          // Registration Info
          {
            name: 'is_registered',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_registration',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'registration_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Custom Variables
          {
            name: 'variables',
            type: 'jsonb',
            default: "'{}'",
          },
          // Audit fields
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create unique index on extension + domain_id
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_extensions_extension_domain"
      ON "extensions" ("extension", "domain_id")
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_extensions_extension"
      ON "extensions" ("extension")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_extensions_domain_id"
      ON "extensions" ("domain_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_extensions_status"
      ON "extensions" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_extensions_user_id"
      ON "extensions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_extensions_is_registered"
      ON "extensions" ("is_registered")
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "extensions"
      ADD CONSTRAINT "FK_extensions_domain_id"
      FOREIGN KEY ("domain_id") REFERENCES "domains"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "extensions"
      ADD CONSTRAINT "FK_extensions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query('ALTER TABLE "extensions" DROP CONSTRAINT IF EXISTS "FK_extensions_domain_id"');
    await queryRunner.query('ALTER TABLE "extensions" DROP CONSTRAINT IF EXISTS "FK_extensions_user_id"');

    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_extension_domain"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_extension"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_domain_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_extensions_is_registered"');

    // Drop table
    await queryRunner.dropTable('extensions');
  }
}
