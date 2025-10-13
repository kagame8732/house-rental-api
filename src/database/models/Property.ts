import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Tenant } from "./Tenant";

export enum PropertyType {
  HOUSE = "house",
  APARTMENT = "apartment",
}

export enum PropertyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity("properties")
export class Property {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text" })
  address: string;

  @Column({
    type: "enum",
    enum: PropertyType,
  })
  type: PropertyType;

  @Column({
    type: "enum",
    enum: PropertyStatus,
    default: PropertyStatus.ACTIVE,
  })
  status: PropertyStatus;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  monthlyRent: number;

  @Column({ type: "uuid" })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.properties)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @OneToMany(() => Tenant, (tenant) => tenant.property)
  tenants: Tenant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
