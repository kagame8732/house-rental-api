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

export enum MaintenanceStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum MaintenancePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

@Entity("maintenance")
export class Maintenance {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
  })
  status: MaintenanceStatus;

  @Column({
    type: "enum",
    enum: MaintenancePriority,
    default: MaintenancePriority.MEDIUM,
  })
  priority: MaintenancePriority;

  @Column({ type: "uuid" })
  propertyId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: "date", nullable: true })
  scheduledDate: Date;

  @Column({ type: "date", nullable: true })
  completedDate: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Property, (property) => property.id)
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
