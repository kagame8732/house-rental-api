import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantPaymentStatus1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."tenants_paymentstatus_enum" AS ENUM (
          'pending',
          'paid',
          'late'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "paymentStatus" "public"."tenants_paymentstatus_enum" NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      UPDATE "tenants"
      SET "paymentStatus" = 'paid'
      WHERE "paymentDate" IS NOT NULL
        AND COALESCE("payment", 0) > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "paymentStatus"
    `);
    await queryRunner.query('DROP TYPE IF EXISTS "public"."tenants_paymentstatus_enum"');
  }
}
