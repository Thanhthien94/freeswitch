import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFreeswitchPasswordColumn1752931800000 implements MigrationInterface {
  name = 'AddFreeswitchPasswordColumn1752931800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'extensions',
      new TableColumn({
        name: 'freeswitch_password',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Plain password for FreeSWITCH XML configuration',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('extensions', 'freeswitch_password');
  }
}
