import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Property } from "./Property";
import { Tenant } from "./Tenant";

export enum LeaseStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  TERMINATED = "terminated",
}

@Entity("leases")
export class Lease {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  propertyId: string;

  @Column({ type: "uuid" })
  tenantId: string;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date" })
  endDate: Date;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  monthlyRent: number;

  @Column({
    type: "enum",
    enum: LeaseStatus,
    default: LeaseStatus.ACTIVE,
  })
  status: LeaseStatus;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Property, (property) => property.leases)
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @ManyToOne(() => Tenant, (tenant) => tenant.leases)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
