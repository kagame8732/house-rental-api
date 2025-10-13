import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
          },
          {
            name: "phone",
            type: "varchar",
            length: "20",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
          },
          {
            name: "role",
            type: "enum",
            enum: ["admin", "owner"],
            default: "'owner'",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create properties table
    await queryRunner.createTable(
      new Table({
        name: "properties",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "200",
          },
          {
            name: "address",
            type: "text",
          },
          {
            name: "type",
            type: "enum",
            enum: ["house", "apartment"],
          },
          {
            name: "status",
            type: "enum",
            enum: ["active", "inactive"],
            default: "'active'",
          },
          {
            name: "monthlyRent",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "ownerId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create tenants table
    await queryRunner.createTable(
      new Table({
        name: "tenants",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
          },
          {
            name: "phone",
            type: "varchar",
            length: "20",
          },
          {
            name: "email",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "address",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "enum",
            enum: ["active", "inactive", "evicted"],
            default: "'active'",
          },
          {
            name: "payment",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "propertyId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create maintenance table
    await queryRunner.createTable(
      new Table({
        name: "maintenance",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "title",
            type: "varchar",
            length: "200",
          },
          {
            name: "description",
            type: "text",
          },
          {
            name: "status",
            type: "enum",
            enum: ["pending", "in_progress", "completed", "cancelled"],
            default: "'pending'",
          },
          {
            name: "priority",
            type: "enum",
            enum: ["low", "medium", "high", "urgent"],
            default: "'medium'",
          },
          {
            name: "propertyId",
            type: "uuid",
          },
          {
            name: "cost",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "scheduledDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "completedDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD CONSTRAINT "FK_properties_owner" 
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants" 
      ADD CONSTRAINT "FK_tenants_property" 
      FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "maintenance" 
      ADD CONSTRAINT "FK_maintenance_property" 
      FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE
    `);

    // Create indexes for better performance
    await queryRunner.query(
      'CREATE INDEX "IDX_properties_owner" ON "properties" ("ownerId")'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_tenants_property" ON "tenants" ("propertyId")'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_maintenance_property" ON "maintenance" ("propertyId")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("maintenance");
    await queryRunner.dropTable("tenants");
    await queryRunner.dropTable("properties");
    await queryRunner.dropTable("users");
  }
}
