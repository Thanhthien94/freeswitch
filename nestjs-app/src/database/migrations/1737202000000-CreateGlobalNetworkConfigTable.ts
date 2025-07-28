import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGlobalNetworkConfigTable1737202000000 implements MigrationInterface {
  name = 'CreateGlobalNetworkConfigTable1737202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for network config status
    await queryRunner.query(`
      CREATE TYPE "network_config_status_enum" AS ENUM('active', 'pending', 'error', 'disabled')
    `);

    // Create global_network_configs table
    await queryRunner.createTable(
      new Table({
        name: 'global_network_configs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'config_name',
            type: 'varchar',
            length: '100',
            default: "'default'",
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          // Network Configuration
          {
            name: 'external_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'bind_server_ip',
            type: 'varchar',
            length: '45',
            default: "'auto'",
          },
          {
            name: 'domain',
            type: 'varchar',
            length: '255',
            default: "'localhost'",
          },
          // SIP Ports
          {
            name: 'sip_port',
            type: 'int',
            default: 5060,
          },
          {
            name: 'external_sip_port',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tls_port',
            type: 'int',
            default: 5061,
          },
          {
            name: 'external_tls_port',
            type: 'int',
            isNullable: true,
          },
          // RTP Configuration
          {
            name: 'rtp_start_port',
            type: 'int',
            default: 16384,
          },
          {
            name: 'rtp_end_port',
            type: 'int',
            default: 16484,
          },
          {
            name: 'external_rtp_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          // STUN Configuration
          {
            name: 'stun_server',
            type: 'varchar',
            length: '255',
            default: "'stun:stun.freeswitch.org'",
          },
          {
            name: 'stun_enabled',
            type: 'boolean',
            default: true,
          },
          // Codec Configuration
          {
            name: 'global_codec_prefs',
            type: 'varchar',
            length: '500',
            default: "'OPUS,G722,PCMU,PCMA'",
          },
          {
            name: 'outbound_codec_prefs',
            type: 'varchar',
            length: '500',
            default: "'OPUS,G722,PCMU,PCMA'",
          },
          // Transport Configuration
          {
            name: 'transport_protocols',
            type: 'text',
            default: "'udp,tcp'",
          },
          {
            name: 'enable_tls',
            type: 'boolean',
            default: false,
          },
          // NAT Configuration
          {
            name: 'nat_detection',
            type: 'boolean',
            default: true,
          },
          {
            name: 'auto_nat',
            type: 'boolean',
            default: true,
          },
          // Status and Control
          {
            name: 'status',
            type: 'network_config_status_enum',
            default: "'active'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'auto_apply',
            type: 'boolean',
            default: false,
          },
          // Advanced Configuration
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          // Audit Fields
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
          {
            name: 'last_applied_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_applied_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_global_network_configs_config_name" ON "global_network_configs" ("config_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_global_network_configs_is_active" ON "global_network_configs" ("is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_global_network_configs_status" ON "global_network_configs" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_global_network_configs_is_default" ON "global_network_configs" ("is_default")
    `);

    // Insert default configuration
    await queryRunner.query(`
      INSERT INTO global_network_configs (
        config_name,
        display_name,
        description,
        external_ip,
        bind_server_ip,
        domain,
        sip_port,
        tls_port,
        rtp_start_port,
        rtp_end_port,
        stun_server,
        stun_enabled,
        global_codec_prefs,
        outbound_codec_prefs,
        transport_protocols,
        enable_tls,
        nat_detection,
        auto_nat,
        status,
        is_active,
        is_default,
        auto_apply,
        metadata,
        created_by
      ) VALUES (
        'default',
        'Default Network Configuration',
        'Default global network configuration for FreeSWITCH PBX system',
        'auto',
        'auto',
        'localhost',
        5060,
        5061,
        16384,
        16484,
        'stun:stun.freeswitch.org',
        true,
        'OPUS,G722,PCMU,PCMA',
        'OPUS,G722,PCMU,PCMA',
        'udp,tcp',
        false,
        true,
        true,
        'active',
        true,
        true,
        false,
        '{}',
        'system'
      )
    `);

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_global_network_configs_updated_at
        BEFORE UPDATE ON global_network_configs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_global_network_configs_updated_at ON global_network_configs`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_network_configs_config_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_network_configs_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_network_configs_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_global_network_configs_is_default"`);

    // Drop table
    await queryRunner.dropTable('global_network_configs');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "network_config_status_enum"`);
  }
}
