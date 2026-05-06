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

type PaymentMonthStatus = "paid" | "pending" | "late_unpaid" | "not_yet_due";

interface PaymentReportMonth {
  month: number;
  amount: number;
  status: PaymentMonthStatus;
}

interface PaymentReportTenant {
  id: string;
  name: string;
  monthlyRent: number;
  totalPaid: number;
  months: PaymentReportMonth[];
}

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
  annualPayment: {
    year: number;
    activeTenants: number;
    tenants: PaymentReportTenant[];
    monthlyTotals: number[];
    collectedYtd: number;
    paidOnTime: number;
    dueMonths: number;
    latePayments: number;
    unpaidMonths: number;
  };
}

export class ReportController {
  private propertyRepository = AppDataSource.getRepository(Property);
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private maintenanceRepository = AppDataSource.getRepository(Maintenance);

  private getDueMonthLimit(year: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (year < currentYear) {
      return 11;
    }

    if (year > currentYear) {
      return -1;
    }

    return now.getMonth();
  }

  private buildTenantPaymentMonths(
    tenant: Tenant,
    monthlyRent: number,
    year: number,
    dueMonthLimit: number
  ): PaymentReportMonth[] {
    const monthsPaid = Number(tenant.monthsPaid || 0);
    const stayStartDate = tenant.stayStartDate
      ? new Date(tenant.stayStartDate)
      : null;

    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthDate = new Date(year, monthIndex, 1);
      const isDue = monthIndex <= dueMonthLimit;
      let paidMonth = false;

      if (stayStartDate && monthsPaid > 0) {
        const monthsSinceStart =
          (monthDate.getFullYear() - stayStartDate.getFullYear()) * 12 +
          (monthDate.getMonth() - stayStartDate.getMonth());

        paidMonth = monthsSinceStart >= 0 && monthsSinceStart < monthsPaid;
      }

      if (paidMonth) {
        return {
          month: monthIndex + 1,
          amount: monthlyRent,
          status: "paid",
        };
      }

      if (isDue) {
        return {
          month: monthIndex + 1,
          amount: 0,
          status: "late_unpaid",
        };
      }

      return {
        month: monthIndex + 1,
        amount: 0,
        status: "not_yet_due",
      };
    });
  }

  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const requestedYear = Number(req.query.year);
      const year = Number.isInteger(requestedYear)
        ? requestedYear
        : new Date().getFullYear();
      const dueMonthLimit = this.getDueMonthLimit(year);

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
            "tenant.name",
            "tenant.status",
            "tenant.totalAmount",
            "tenant.payment",
            "tenant.propertyId",
            "tenant.monthsPaid",
            "tenant.stayStartDate",
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
      const paymentTenants: PaymentReportTenant[] = tenants
        .filter((tenant) => tenant.status === TenantStatus.ACTIVE)
        .map((tenant) => {
          const property = properties.find((item) => item.id === tenant.propertyId);
          const monthlyRent = Number(property?.monthlyRent || 0);
          const months = this.buildTenantPaymentMonths(
            tenant,
            monthlyRent,
            year,
            dueMonthLimit
          );

          return {
            id: tenant.id,
            name: tenant.name,
            monthlyRent,
            totalPaid: months.reduce((total, month) => total + month.amount, 0),
            months,
          };
        });
      const monthlyTotals = Array.from({ length: 12 }, (_, monthIndex) =>
        paymentTenants.reduce(
          (total, tenant) => total + tenant.months[monthIndex].amount,
          0
        )
      );
      const collectedYtd = monthlyTotals.reduce((total, amount) => total + amount, 0);
      const paidOnTime = paymentTenants.reduce(
        (total, tenant) =>
          total + tenant.months.filter((month) => month.status === "paid").length,
        0
      );
      const unpaidMonths = paymentTenants.reduce(
        (total, tenant) =>
          total +
          tenant.months.filter((month) => month.status === "late_unpaid").length,
        0
      );

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
        annualPayment: {
          year,
          activeTenants: paymentTenants.length,
          tenants: paymentTenants,
          monthlyTotals,
          collectedYtd,
          paidOnTime,
          dueMonths: paidOnTime + unpaidMonths,
          latePayments: 0,
          unpaidMonths,
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
