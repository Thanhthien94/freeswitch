import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOldDomainTable1737199000000 implements MigrationInterface {
  name = 'DropOldDomainTable1737199000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old domains table if exists
    await queryRunner.query(`DROP TABLE IF EXISTS "domains" CASCADE`);
    console.log('✅ Old domains table dropped successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot recreate old table structure without knowing it
    console.log('⚠️ Cannot recreate old domains table - manual intervention required');
  }
}
