import { Request, Response } from "express";
import { AppDataSource } from "../database";
import {
  Property,
  PropertyStatus,
  Tenant,
  TenantStatus,
  Maintenance,
  MaintenanceStatus,
  MaintenancePriority,
} from "../database/models";
import { ApiResponse } from "../types";

interface ReportOverview {
  totals: {
    properties: number;
    activeProperties: number;
    tenants: number;
    activeTenants: number;
    maintenance: number;
    pendingMaintenance: number;
  };
  financial: {
    expectedMonthlyRent: number;
    collectedAmount: number;
    outstandingAmount: number;
  };
  breakdowns: {
    tenantStatus: Record<string, number>;
    maintenanceStatus: Record<string, number>;
    maintenancePriority: Record<string, number>;
  };
}

export class ReportController {
  private propertyRepository = AppDataSource.getRepository(Property);
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private maintenanceRepository = AppDataSource.getRepository(Maintenance);

  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;

      const [properties, tenants, maintenance] = await Promise.all([
        this.propertyRepository.find({
          where: { ownerId },
          select: ["id", "status", "monthlyRent"],
        }),
        this.tenantRepository
          .createQueryBuilder("tenant")
          .innerJoin("tenant.property", "property")
          .where("property.ownerId = :ownerId", { ownerId })
          .select([
            "tenant.id",
            "tenant.status",
            "tenant.totalAmount",
            "tenant.payment",
            "tenant.propertyId",
          ])
          .getMany(),
        this.maintenanceRepository
          .createQueryBuilder("maintenance")
          .innerJoin("maintenance.property", "property")
          .where("property.ownerId = :ownerId", { ownerId })
          .select(["maintenance.id", "maintenance.status", "maintenance.priority"])
          .getMany(),
      ]);

      const activeProperties = properties.filter(
        (property) => property.status === PropertyStatus.ACTIVE
      ).length;
      const activeTenants = tenants.filter(
        (tenant) => tenant.status === TenantStatus.ACTIVE
      ).length;
      const pendingMaintenance = maintenance.filter(
        (item) => item.status === MaintenanceStatus.PENDING
      ).length;

      const expectedMonthlyRent = tenants
        .filter((tenant) => tenant.status === TenantStatus.ACTIVE)
        .reduce((total, tenant) => {
          const property = properties.find((item) => item.id === tenant.propertyId);
          return total + Number(property?.monthlyRent || 0);
        }, 0);
      const collectedAmount = tenants.reduce(
        (total, tenant) => total + Number(tenant.totalAmount || 0),
        0
      );
      const outstandingAmount = Math.max(0, expectedMonthlyRent - collectedAmount);

      const report: ReportOverview = {
        totals: {
          properties: properties.length,
          activeProperties,
          tenants: tenants.length,
          activeTenants,
          maintenance: maintenance.length,
          pendingMaintenance,
        },
        financial: {
          expectedMonthlyRent,
          collectedAmount,
          outstandingAmount,
        },
        breakdowns: {
          tenantStatus: {
            [TenantStatus.ACTIVE]: tenants.filter(
              (tenant) => tenant.status === TenantStatus.ACTIVE
            ).length,
            [TenantStatus.INACTIVE]: tenants.filter(
              (tenant) => tenant.status === TenantStatus.INACTIVE
            ).length,
            [TenantStatus.EVICTED]: tenants.filter(
              (tenant) => tenant.status === TenantStatus.EVICTED
            ).length,
          },
          maintenanceStatus: {
            [MaintenanceStatus.PENDING]: maintenance.filter(
              (item) => item.status === MaintenanceStatus.PENDING
            ).length,
            [MaintenanceStatus.IN_PROGRESS]: maintenance.filter(
              (item) => item.status === MaintenanceStatus.IN_PROGRESS
            ).length,
            [MaintenanceStatus.COMPLETED]: maintenance.filter(
              (item) => item.status === MaintenanceStatus.COMPLETED
            ).length,
            [MaintenanceStatus.CANCELLED]: maintenance.filter(
              (item) => item.status === MaintenanceStatus.CANCELLED
            ).length,
          },
          maintenancePriority: {
            [MaintenancePriority.LOW]: maintenance.filter(
              (item) => item.priority === MaintenancePriority.LOW
            ).length,
            [MaintenancePriority.MEDIUM]: maintenance.filter(
              (item) => item.priority === MaintenancePriority.MEDIUM
            ).length,
            [MaintenancePriority.HIGH]: maintenance.filter(
              (item) => item.priority === MaintenancePriority.HIGH
            ).length,
            [MaintenancePriority.URGENT]: maintenance.filter(
              (item) => item.priority === MaintenancePriority.URGENT
            ).length,
          },
        },
      };

      res.json({
        success: true,
        message: "Report overview generated successfully",
        data: report,
      } as ApiResponse<ReportOverview>);
    } catch (error) {
      console.error("Get report overview error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
