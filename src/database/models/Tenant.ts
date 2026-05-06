import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from "typeorm";
import { Property } from "./Property";
import { Lease } from "./Lease";

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EVICTED = "evicted",
}

export enum TenantPaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  LATE = "late",
}

@Entity("tenants")
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 20 })
  // @Unique(["phone"])
  phone: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  idNumber: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({
    type: "enum",
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ type: "uuid" })
  propertyId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  payment: number | null;

  @Column({ type: "date", nullable: true })
  paymentDate: Date | null;

  @Column({
    type: "enum",
    enum: ["cash", "bank", "mobile_money"],
    nullable: true,
  })
  paymentMethod: "cash" | "bank" | "mobile_money" | null;

  @Column({
    type: "enum",
    enum: TenantPaymentStatus,
    default: TenantPaymentStatus.PENDING,
  })
  paymentStatus: TenantPaymentStatus;

  @Column({ type: "integer", default: 0 })
  monthsPaid: number;

  @Column({ type: "date", nullable: true })
  stayStartDate: Date | null;

  @Column({ type: "date", nullable: true })
  stayEndDate: Date | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  totalAmount: number | null;

  @ManyToOne(() => Property, (property) => property.tenants)
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @OneToMany(() => Lease, (lease) => lease.tenant)
  leases: Lease[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
