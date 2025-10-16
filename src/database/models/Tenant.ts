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

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EVICTED = "evicted",
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

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  payment: number;

  @Column({ type: "date", nullable: true })
  paymentDate: Date;

  @Column({ 
    type: "enum", 
    enum: ["cash", "bank", "mobile_money"], 
    nullable: true 
  })
  paymentMethod: "cash" | "bank" | "mobile_money";

  @Column({ type: "uuid" })
  propertyId: string;

  @ManyToOne(() => Property, (property) => property.tenants)
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
