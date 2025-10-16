import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaymentFieldsToTenants1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add paymentDate column
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "paymentDate",
        type: "date",
        isNullable: true,
      })
    );

    // Add paymentMethod column
    await queryRunner.addColumn(
      "tenants",
      new TableColumn({
        name: "paymentMethod",
        type: "enum",
        enum: ["cash", "bank", "mobile_money"],
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove paymentMethod column
    await queryRunner.dropColumn("tenants", "paymentMethod");

    // Remove paymentDate column
    await queryRunner.dropColumn("tenants", "paymentDate");
  }
}

