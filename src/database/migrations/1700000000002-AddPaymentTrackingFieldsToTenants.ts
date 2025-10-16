import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentTrackingFieldsToTenants1700000000002
  implements MigrationInterface
{
  name = "AddPaymentTrackingFieldsToTenants1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tenants" 
            ADD COLUMN "monthsPaid" integer NOT NULL DEFAULT 0
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            ADD COLUMN "stayStartDate" date
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            ADD COLUMN "stayEndDate" date
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            ADD COLUMN "totalAmount" decimal(10,2)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "tenants" 
            DROP COLUMN "totalAmount"
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            DROP COLUMN "stayEndDate"
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            DROP COLUMN "stayStartDate"
        `);

    await queryRunner.query(`
            ALTER TABLE "tenants" 
            DROP COLUMN "monthsPaid"
        `);
  }
}
