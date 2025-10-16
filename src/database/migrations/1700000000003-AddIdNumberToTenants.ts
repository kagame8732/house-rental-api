import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdNumberToTenants1700000000003 implements MigrationInterface {
  name = "AddIdNumberToTenants1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants" 
      ADD COLUMN "idNumber" varchar(50) NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants" 
      DROP COLUMN "idNumber"
    `);
  }
}
