import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGlobalNetworkConfig1753616800000 implements MigrationInterface {
  name = 'CreateGlobalNetworkConfig1753616800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for network config status
    await queryRunner.query(`
      CREATE TYPE "public"."network_config_status_enum" AS ENUM('active', 'inactive', 'pending', 'error')
    `);

    // Create global_network_configs table
    await queryRunner.query(`
      CREATE TABLE "global_network_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "config_name" character varying(100) NOT NULL DEFAULT 'default',
        "domain" character varying(255) NOT NULL DEFAULT 'localhost',
        "bind_server_ip" character varying(45) NOT NULL DEFAULT 'auto',
        "external_ip" character varying(45),
        "external_rtp_ip" character varying(45),
        "sip_port_internal" integer NOT NULL DEFAULT 5060,
        "sip_port_external" integer NOT NULL DEFAULT 5080,
        "tls_port_internal" integer NOT NULL DEFAULT 5061,
        "tls_port_external" integer NOT NULL DEFAULT 5081,
        "rtp_start_port" integer NOT NULL DEFAULT 16384,
        "rtp_end_port" integer NOT NULL DEFAULT 32768,
        "stun_enabled" boolean NOT NULL DEFAULT false,
        "stun_server" character varying(255),
        "nat_detection" boolean NOT NULL DEFAULT true,
        "auto_nat" boolean NOT NULL DEFAULT true,
        "global_codec_prefs" character varying(500) DEFAULT 'OPUS,G722,PCMU,PCMA,G729',
        "outbound_codec_prefs" character varying(500) DEFAULT 'OPUS,G722,PCMU,PCMA,G729',
        "enable_udp" boolean NOT NULL DEFAULT true,
        "enable_tcp" boolean NOT NULL DEFAULT true,
        "enable_tls" boolean NOT NULL DEFAULT false,
        "auto_apply" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "status" "public"."network_config_status_enum" NOT NULL DEFAULT 'active',
        "metadata" json,
        "tags" text array,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "updated_by" integer,
        CONSTRAINT "PK_global_network_configs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_global_network_configs_config_name" ON "global_network_configs" ("config_name")
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

    // Create unique constraint for config_name
    await queryRunner.query(`
      ALTER TABLE "global_network_configs" ADD CONSTRAINT "UQ_global_network_configs_config_name" UNIQUE ("config_name")
    `);

    // Insert default configuration
    await queryRunner.query(`
      INSERT INTO "global_network_configs" (
        "config_name", "domain", "bind_server_ip", "external_ip", "external_rtp_ip",
        "sip_port_internal", "sip_port_external", "tls_port_internal", "tls_port_external",
        "rtp_start_port", "rtp_end_port", "stun_enabled", "stun_server",
        "nat_detection", "auto_nat", "global_codec_prefs", "outbound_codec_prefs",
        "enable_udp", "enable_tcp", "enable_tls", "auto_apply", "is_active", "is_default", "status"
      ) VALUES (
        'default', 'localhost', 'auto', NULL, NULL,
        5060, 5080, 5061, 5081,
        16384, 32768, false, 'stun.freeswitch.org',
        true, true, 'OPUS,G722,PCMU,PCMA,G729', 'OPUS,G722,PCMU,PCMA,G729',
        true, true, false, false, true, true, 'active'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE "global_network_configs"`);
    
    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."network_config_status_enum"`);
  }
}
