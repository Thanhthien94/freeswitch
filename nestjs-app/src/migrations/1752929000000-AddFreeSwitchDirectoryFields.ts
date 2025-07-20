import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFreeSwitchDirectoryFields1752929000000 implements MigrationInterface {
    name = 'AddFreeSwitchDirectoryFields1752929000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to extensions table for FreeSWITCH directory generation
        await queryRunner.query(`
            ALTER TABLE "extensions" 
            ADD COLUMN "toll_allow" varchar,
            ADD COLUMN "account_code" varchar,
            ADD COLUMN "context" varchar NOT NULL DEFAULT 'default',
            ADD COLUMN "hangup_after_bridge" boolean NOT NULL DEFAULT false,
            ADD COLUMN "continue_on_fail" boolean NOT NULL DEFAULT false,
            ADD COLUMN "forward_all" varchar,
            ADD COLUMN "forward_busy" varchar,
            ADD COLUMN "forward_no_answer" varchar,
            ADD COLUMN "record_calls" boolean NOT NULL DEFAULT false,
            ADD COLUMN "vm_password" varchar,
            ADD COLUMN "a1_hash" varchar,
            ADD COLUMN "params" jsonb NOT NULL DEFAULT '{}'
        `);

        // Update existing extensions with default values
        await queryRunner.query(`
            UPDATE "extensions" 
            SET 
                "context" = 'default',
                "hangup_after_bridge" = false,
                "continue_on_fail" = false,
                "record_calls" = false,
                "params" = '{}'
            WHERE "context" IS NULL OR "params" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added columns
        await queryRunner.query(`
            ALTER TABLE "extensions" 
            DROP COLUMN "toll_allow",
            DROP COLUMN "account_code",
            DROP COLUMN "context",
            DROP COLUMN "hangup_after_bridge",
            DROP COLUMN "continue_on_fail",
            DROP COLUMN "forward_all",
            DROP COLUMN "forward_busy",
            DROP COLUMN "forward_no_answer",
            DROP COLUMN "record_calls",
            DROP COLUMN "vm_password",
            DROP COLUMN "a1_hash",
            DROP COLUMN "params"
        `);
    }
}
