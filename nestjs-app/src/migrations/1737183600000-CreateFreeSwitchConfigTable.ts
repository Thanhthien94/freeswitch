import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateFreeSwitchConfigTable1737183600000 implements MigrationInterface {
  name = 'CreateFreeSwitchConfigTable1737183600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create freeswitch_configs table
    await queryRunner.createTable(
      new Table({
        name: 'freeswitch_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'string'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'validation_rules',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'requires_restart',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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

    // Create unique index on category + name
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_freeswitch_configs_category_name"
      ON "freeswitch_configs" ("category", "name")
    `);

    // Create index on category for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_freeswitch_configs_category"
      ON "freeswitch_configs" ("category")
    `);

    // Insert default configuration values
    await queryRunner.query(`
      INSERT INTO freeswitch_configs (category, name, value, type, description, sort_order) VALUES
      -- Network Configuration
      ('network', 'external_ip_mode', 'stun', 'enum', 'External IP detection mode (auto, stun, manual)', 1),
      ('network', 'external_ip', '', 'string', 'Manual external IP address (used when mode is manual)', 2),
      ('network', 'bind_server_ip', 'auto', 'string', 'Server bind IP address', 3),
      ('network', 'rtp_start_port', '16384', 'number', 'RTP port range start', 4),
      ('network', 'rtp_end_port', '32768', 'number', 'RTP port range end', 5),
      
      -- SIP Configuration
      ('sip', 'sip_port', '5060', 'number', 'SIP port for UDP/TCP', 1),
      ('sip', 'sip_port_tls', '5061', 'number', 'SIP port for TLS', 2),
      ('sip', 'sip_domain', 'localhost', 'string', 'SIP domain name', 3),
      ('sip', 'context', 'default', 'string', 'Default dialplan context', 4),
      ('sip', 'auth_calls', 'true', 'boolean', 'Require authentication for calls', 5),
      ('sip', 'accept_blind_reg', 'false', 'boolean', 'Accept blind registrations', 6),
      ('sip', 'accept_blind_auth', 'false', 'boolean', 'Accept blind authentication', 7),
      
      -- RTP Configuration
      ('rtp', 'rtp_timer_name', 'soft', 'string', 'RTP timer name', 1),
      ('rtp', 'rtp_timeout_sec', '300', 'number', 'RTP timeout in seconds', 2),
      ('rtp', 'rtp_hold_timeout_sec', '1800', 'number', 'RTP hold timeout in seconds', 3),
      ('rtp', 'disable_rtp_auto_adjust', 'false', 'boolean', 'Disable RTP auto adjustment', 4),
      
      -- Security Configuration
      ('security', 'apply_inbound_acl', 'domains', 'string', 'Apply inbound ACL', 1),
      ('security', 'apply_register_acl', 'domains', 'string', 'Apply register ACL', 2),
      ('security', 'auth_all_packets', 'false', 'boolean', 'Authenticate all packets', 3),
      
      -- Codec Configuration
      ('codec', 'inbound_codec_prefs', 'PCMU,PCMA,G729', 'array', 'Inbound codec preferences', 1),
      ('codec', 'outbound_codec_prefs', 'PCMU,PCMA,G729', 'array', 'Outbound codec preferences', 2),
      ('codec', 'inbound_codec_negotiation', 'generous', 'string', 'Inbound codec negotiation', 3),
      ('codec', 'outbound_codec_negotiation', 'generous', 'string', 'Outbound codec negotiation', 4)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_freeswitch_configs_category"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_freeswitch_configs_category_name"');

    // Drop table
    await queryRunner.dropTable('freeswitch_configs');
  }
}
