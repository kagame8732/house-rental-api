import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFields1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."tenants_paymentmethod_enum" AS ENUM (
          'cash',
          'bank',
          'mobile_money'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "monthlyRent" decimal(10,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "idNumber" varchar(50),
      ADD COLUMN IF NOT EXISTS "payment" decimal(10,2),
      ADD COLUMN IF NOT EXISTS "paymentDate" date,
      ADD COLUMN IF NOT EXISTS "paymentMethod" "public"."tenants_paymentmethod_enum",
      ADD COLUMN IF NOT EXISTS "monthsPaid" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stayStartDate" date,
      ADD COLUMN IF NOT EXISTS "stayEndDate" date,
      ADD COLUMN IF NOT EXISTS "totalAmount" decimal(10,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "totalAmount",
      DROP COLUMN IF EXISTS "stayEndDate",
      DROP COLUMN IF EXISTS "stayStartDate",
      DROP COLUMN IF EXISTS "monthsPaid",
      DROP COLUMN IF EXISTS "paymentMethod",
      DROP COLUMN IF EXISTS "paymentDate",
      DROP COLUMN IF EXISTS "payment",
      DROP COLUMN IF EXISTS "idNumber"
    `);
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "monthlyRent"
    `);
    await queryRunner.query('DROP TYPE IF EXISTS "public"."tenants_paymentmethod_enum"');
  }
}
