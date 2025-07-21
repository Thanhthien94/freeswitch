import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFreeSwitchConfigTables1737200000000 implements MigrationInterface {
  name = 'CreateFreeSwitchConfigTables1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "freeswitch_profile_type_enum" AS ENUM('internal', 'external', 'custom')
    `);

    await queryRunner.query(`
      CREATE TYPE "freeswitch_config_type_enum" AS ENUM('sip_profile', 'gateway', 'dialplan', 'extension', 'conference', 'ivr')
    `);

    // Create Domains Table
    await queryRunner.query(`
      CREATE TABLE "domains" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_name" character varying(200),
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "max_users" integer NOT NULL DEFAULT 100,
        "max_extensions" integer NOT NULL DEFAULT 1000,
        "max_concurrent_calls" integer NOT NULL DEFAULT 50,
        "settings" jsonb NOT NULL DEFAULT '{}',
        "billing_settings" jsonb NOT NULL DEFAULT '{}',
        "admin_email" character varying(255) NOT NULL,
        "admin_phone" character varying(50),
        "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
        "language" character varying(10) NOT NULL DEFAULT 'en',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_domains" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_domains_name" UNIQUE ("name")
      )
    `);

    // FreeSWITCH SIP Profiles Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_sip_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_name" character varying(200),
        "description" text,
        "type" "freeswitch_profile_type_enum" NOT NULL DEFAULT 'custom',
        "domain_id" uuid,
        "bind_ip" inet,
        "bind_port" integer NOT NULL DEFAULT 5060,
        "tls_port" integer,
        "rtp_ip" inet,
        "ext_rtp_ip" inet,
        "ext_sip_ip" inet,
        "sip_port" integer,
        "settings" jsonb NOT NULL DEFAULT '{}',
        "advanced_settings" jsonb DEFAULT '{}',
        "security_settings" jsonb DEFAULT '{}',
        "codec_settings" jsonb DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_freeswitch_sip_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freeswitch_sip_profiles_name" UNIQUE ("name"),
        CONSTRAINT "UQ_freeswitch_sip_profiles_bind_port" UNIQUE ("bind_ip", "bind_port")
      )
    `);

    // FreeSWITCH Gateways Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_gateways" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_name" character varying(200),
        "description" text,
        "profile_id" uuid NOT NULL,
        "domain_id" uuid,
        "gateway_host" character varying(255) NOT NULL,
        "gateway_port" integer DEFAULT 5060,
        "username" character varying(100),
        "password" character varying(255),
        "realm" character varying(255),
        "from_user" character varying(100),
        "from_domain" character varying(255),
        "proxy" character varying(255),
        "register" boolean DEFAULT true,
        "register_transport" character varying(20) DEFAULT 'udp',
        "expire_seconds" integer DEFAULT 3600,
        "retry_seconds" integer DEFAULT 30,
        "caller_id_in_from" boolean DEFAULT false,
        "extension" character varying(50),
        "gateway_config" jsonb NOT NULL DEFAULT '{}',
        "auth_settings" jsonb DEFAULT '{}',
        "routing_settings" jsonb DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_freeswitch_gateways" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freeswitch_gateways_name" UNIQUE ("name")
      )
    `);

    // FreeSWITCH Dialplans Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_dialplans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_name" character varying(200),
        "description" text,
        "context" character varying(100) NOT NULL DEFAULT 'default',
        "domain_id" uuid,
        "extension_pattern" character varying(255),
        "condition_field" character varying(100) DEFAULT 'destination_number',
        "condition_expression" text,
        "actions" jsonb NOT NULL DEFAULT '[]',
        "anti_actions" jsonb DEFAULT '[]',
        "variables" jsonb DEFAULT '{}',
        "dialplan_xml" text,
        "priority" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_template" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_freeswitch_dialplans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freeswitch_dialplans_name_context" UNIQUE ("name", "context")
      )
    `);

    // FreeSWITCH Extensions Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_extensions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "extension_number" character varying(50) NOT NULL,
        "display_name" character varying(200),
        "description" text,
        "domain_id" uuid,
        "user_id" uuid,
        "profile_id" uuid,
        "password" character varying(255),
        "effective_caller_id_name" character varying(100),
        "effective_caller_id_number" character varying(50),
        "outbound_caller_id_name" character varying(100),
        "outbound_caller_id_number" character varying(50),
        "directory_settings" jsonb DEFAULT '{}',
        "dial_settings" jsonb DEFAULT '{}',
        "voicemail_settings" jsonb DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_freeswitch_extensions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freeswitch_extensions_number_domain" UNIQUE ("extension_number", "domain_id")
      )
    `);

    // FreeSWITCH Configuration Versions Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_config_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "config_type" "freeswitch_config_type_enum" NOT NULL,
        "config_id" uuid NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "config_data" jsonb NOT NULL,
        "xml_content" text,
        "change_summary" text,
        "is_active" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        CONSTRAINT "PK_freeswitch_config_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freeswitch_config_versions" UNIQUE ("config_type", "config_id", "version")
      )
    `);

    // FreeSWITCH Configuration Deployments Table
    await queryRunner.query(`
      CREATE TABLE "freeswitch_config_deployments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deployment_name" character varying(200) NOT NULL,
        "description" text,
        "domain_id" uuid,
        "config_versions" jsonb NOT NULL DEFAULT '[]',
        "deployment_status" character varying(50) NOT NULL DEFAULT 'pending',
        "deployed_at" TIMESTAMP,
        "rollback_data" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "deployed_by" uuid,
        CONSTRAINT "PK_freeswitch_config_deployments" PRIMARY KEY ("id")
      )
    `);

    // Add Foreign Key Constraints
    await queryRunner.query(`
      ALTER TABLE "freeswitch_sip_profiles" 
      ADD CONSTRAINT "FK_freeswitch_sip_profiles_domain" 
      FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_sip_profiles" 
      ADD CONSTRAINT "FK_freeswitch_sip_profiles_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_gateways" 
      ADD CONSTRAINT "FK_freeswitch_gateways_profile" 
      FOREIGN KEY ("profile_id") REFERENCES "freeswitch_sip_profiles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_gateways" 
      ADD CONSTRAINT "FK_freeswitch_gateways_domain" 
      FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_dialplans" 
      ADD CONSTRAINT "FK_freeswitch_dialplans_domain" 
      FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_extensions" 
      ADD CONSTRAINT "FK_freeswitch_extensions_domain" 
      FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_extensions" 
      ADD CONSTRAINT "FK_freeswitch_extensions_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "freeswitch_extensions" 
      ADD CONSTRAINT "FK_freeswitch_extensions_profile" 
      FOREIGN KEY ("profile_id") REFERENCES "freeswitch_sip_profiles"("id") ON DELETE SET NULL
    `);

    // Create Indexes for Performance
    await queryRunner.query(`CREATE INDEX "IDX_domains_name" ON "domains" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_domains_active" ON "domains" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_domains_created_by" ON "domains" ("created_by")`);

    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_sip_profiles_domain" ON "freeswitch_sip_profiles" ("domain_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_sip_profiles_type" ON "freeswitch_sip_profiles" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_sip_profiles_active" ON "freeswitch_sip_profiles" ("is_active")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_gateways_profile" ON "freeswitch_gateways" ("profile_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_gateways_domain" ON "freeswitch_gateways" ("domain_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_gateways_active" ON "freeswitch_gateways" ("is_active")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_dialplans_context" ON "freeswitch_dialplans" ("context")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_dialplans_domain" ON "freeswitch_dialplans" ("domain_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_dialplans_active" ON "freeswitch_dialplans" ("is_active")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_extensions_number" ON "freeswitch_extensions" ("extension_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_extensions_domain" ON "freeswitch_extensions" ("domain_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_extensions_user" ON "freeswitch_extensions" ("user_id")`);
    
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_config_versions_config" ON "freeswitch_config_versions" ("config_type", "config_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_freeswitch_config_versions_active" ON "freeswitch_config_versions" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "freeswitch_config_deployments"`);
    await queryRunner.query(`DROP TABLE "freeswitch_config_versions"`);
    await queryRunner.query(`DROP TABLE "freeswitch_extensions"`);
    await queryRunner.query(`DROP TABLE "freeswitch_dialplans"`);
    await queryRunner.query(`DROP TABLE "freeswitch_gateways"`);
    await queryRunner.query(`DROP TABLE "freeswitch_sip_profiles"`);
    await queryRunner.query(`DROP TABLE "domains"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "freeswitch_config_type_enum"`);
    await queryRunner.query(`DROP TYPE "freeswitch_profile_type_enum"`);
  }
}
