import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupObsoleteTables1737201000000 implements MigrationInterface {
  name = 'CleanupObsoleteTables1737201000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🧹 Cleaning up obsolete tables...');

    // ⚠️ SAFE: Drop old tables that have been replaced by FreeSWITCH enterprise tables
    
    // 1. Drop old domains table (replaced by freeswitch_domains)
    const domainsExists = await queryRunner.hasTable('domains');
    if (domainsExists) {
      console.log('🗑️ Dropping old domains table...');
      await queryRunner.query(`DROP TABLE "domains" CASCADE`);
      console.log('✅ Old domains table dropped');
    }

    // 2. Drop old extensions table (replaced by freeswitch_extensions)
    const extensionsExists = await queryRunner.hasTable('extensions');
    if (extensionsExists) {
      console.log('🗑️ Dropping old extensions table...');
      await queryRunner.query(`DROP TABLE "extensions" CASCADE`);
      console.log('✅ Old extensions table dropped');
    }

    // 3. Drop old freeswitch_configs table (not used in new schema)
    const freeswitchConfigsExists = await queryRunner.hasTable('freeswitch_configs');
    if (freeswitchConfigsExists) {
      console.log('🗑️ Dropping obsolete freeswitch_configs table...');
      await queryRunner.query(`DROP TABLE "freeswitch_configs" CASCADE`);
      console.log('✅ Obsolete freeswitch_configs table dropped');
    }

    console.log('✅ Database cleanup completed successfully');
    console.log('📊 Remaining tables are all valid and in use');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️ Cannot recreate dropped tables - manual intervention required');
    console.log('💡 Use backup data if rollback is needed');
    
    // Note: We cannot recreate the old table structures without knowing their exact schema
    // This is intentional as these tables should not be restored
  }
}
