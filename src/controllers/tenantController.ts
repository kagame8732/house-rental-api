import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Property, Tenant, TenantPaymentStatus, TenantStatus } from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";

type PaymentMethod = "cash" | "bank" | "mobile_money";
type PaymentType = "full" | "partial";

interface RecordPaymentBody {
  amount?: number | string;
  monthsPaid?: number | string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: TenantPaymentStatus;
  paymentType?: PaymentType;
  stayStartDate?: string;
}

export class TenantController {
  private tenantRepository = AppDataSource.getRepository(Tenant);

  private addMonths(date: Date, months: number): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);
    return nextDate;
  }

  private getPaymentProgress(tenant: Tenant): {
    currentMonthPaid: number;
    currentMonthBalance: number;
  } {
    const monthlyRent = Number(tenant.property?.monthlyRent || 0);
    const totalAmount = Number(tenant.totalAmount || 0);
    const monthsPaid = Number(tenant.monthsPaid || 0);

    if (monthlyRent <= 0) {
      return {
        currentMonthPaid: 0,
        currentMonthBalance: 0,
      };
    }

    const coveredAmount = monthsPaid * monthlyRent;
    const currentMonthPaid = Math.min(
      Math.max(totalAmount - coveredAmount, 0),
      monthlyRent
    );
    const currentMonthBalance = Math.max(monthlyRent - currentMonthPaid, 0);

    return {
      currentMonthPaid,
      currentMonthBalance,
    };
  }

  private withPaymentProgress<T extends Tenant>(tenant: T): T & {
    currentMonthPaid: number;
    currentMonthBalance: number;
  } {
    return Object.assign(tenant, this.getPaymentProgress(tenant));
  }

  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        phone,
        idNumber,
        email,
        address,
        propertyId,
        status,
        payment,
        paymentDate,
        paymentMethod,
        monthsPaid,
        stayStartDate,
        stayEndDate,
      } = req.body;
      const ownerId = req.user!.id;

      // Verify property belongs to owner
      const propertyRepository = AppDataSource.getRepository(Property);
      const property = await propertyRepository.findOne({
        where: { id: propertyId, ownerId },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found or access denied",
        } as ApiResponse);
        return;
      }

      const activeTenant = await this.tenantRepository.findOne({
        where: { propertyId, status: TenantStatus.ACTIVE },
      });

      if (activeTenant) {
        res.status(400).json({
          success: false,
          message:
            "Property is already rented. Only available properties can be assigned to tenants.",
        } as ApiResponse);
        return;
      }

      const paidMonths = Number(monthsPaid || 0);
      const monthlyRent = Number(property.monthlyRent || 0);
      const totalAmount = paidMonths > 0 ? monthlyRent * paidMonths : 0;
      const startDate = stayStartDate ? new Date(stayStartDate) : null;
      const calculatedStayEndDate =
        startDate && paidMonths > 0 ? this.addMonths(startDate, paidMonths) : null;

      const tenant = this.tenantRepository.create({
        name,
        phone,
        idNumber: idNumber || null,
        email,
        address,
        propertyId,
        status: status || TenantStatus.ACTIVE,
        payment:
          payment !== undefined && payment !== "" ? Number(payment) : monthlyRent || null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod: paymentMethod || null,
        paymentStatus: TenantPaymentStatus.PENDING,
        monthsPaid: paidMonths,
        stayStartDate: startDate,
        stayEndDate: stayEndDate ? new Date(stayEndDate) : calculatedStayEndDate,
        totalAmount,
      });

      const savedTenant = await this.tenantRepository.save(tenant);

      res.status(201).json({
        success: true,
        message: "Tenant created successfully",
        data: this.withPaymentProgress(Object.assign(savedTenant, { property })),
      } as ApiResponse);
    } catch (error) {
      console.error("Create tenant error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getTenants(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
        search,
        status,
        propertyId,
      } = req.query as PaginationQuery & FilterQuery;
      const ownerId = req.user!.id;

      const queryBuilder = this.tenantRepository
        .createQueryBuilder("tenant")
        .leftJoinAndSelect("tenant.property", "property")
        .where("property.ownerId = :ownerId", { ownerId });

      if (search) {
        queryBuilder.andWhere(
          "(tenant.name ILIKE :search OR tenant.phone ILIKE :search OR tenant.email ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere("tenant.status = :status", { status });
      }

      if (propertyId) {
        queryBuilder.andWhere("tenant.propertyId = :propertyId", {
          propertyId,
        });
      }

      const total = await queryBuilder.getCount();
      const tenants = await queryBuilder
        .orderBy(`tenant.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        success: true,
        message: "Tenants retrieved successfully",
        data: tenants.map((tenant) => this.withPaymentProgress(tenant)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get tenants error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getTenantById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const tenant = await this.tenantRepository.findOne({
        where: { id },
        relations: ["property", "leases"],
        join: {
          alias: "tenant",
          leftJoinAndSelect: {
            property: "tenant.property",
          },
        },
      });

      if (!tenant || tenant.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Tenant not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Tenant retrieved successfully",
        data: this.withPaymentProgress(tenant),
      } as ApiResponse);
    } catch (error) {
      console.error("Get tenant error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;
      const updateData = req.body;

      const tenant = await this.tenantRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!tenant || tenant.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Tenant not found",
        } as ApiResponse);
        return;
      }

      if (updateData.propertyId && updateData.propertyId !== tenant.propertyId) {
        const propertyRepository = AppDataSource.getRepository(Property);
        const property = await propertyRepository.findOne({
          where: { id: updateData.propertyId, ownerId },
        });

        if (!property) {
          res.status(404).json({
            success: false,
            message: "Property not found or access denied",
          } as ApiResponse);
          return;
        }

        const activeTenant = await this.tenantRepository.findOne({
          where: { propertyId: updateData.propertyId, status: TenantStatus.ACTIVE },
        });

        if (activeTenant && activeTenant.id !== tenant.id) {
          res.status(400).json({
            success: false,
            message:
              "Property is already rented. Only available properties can be assigned to tenants.",
          } as ApiResponse);
          return;
        }
      }

      Object.assign(tenant, {
        ...updateData,
        payment:
          updateData.payment !== undefined
            ? updateData.payment
              ? Number(updateData.payment)
              : null
            : tenant.payment,
        paymentDate:
          updateData.paymentDate !== undefined
            ? updateData.paymentDate
              ? new Date(updateData.paymentDate)
              : null
            : tenant.paymentDate,
        paymentMethod:
          updateData.paymentMethod !== undefined
            ? updateData.paymentMethod || null
            : tenant.paymentMethod,
        monthsPaid:
          updateData.monthsPaid !== undefined
            ? Number(updateData.monthsPaid || 0)
            : tenant.monthsPaid,
        stayStartDate:
          updateData.stayStartDate !== undefined
            ? updateData.stayStartDate
              ? new Date(updateData.stayStartDate)
              : null
            : tenant.stayStartDate,
        stayEndDate:
          updateData.stayEndDate !== undefined
            ? updateData.stayEndDate
              ? new Date(updateData.stayEndDate)
              : null
            : tenant.stayEndDate,
        totalAmount:
          updateData.totalAmount !== undefined
            ? Number(updateData.totalAmount || 0)
            : tenant.totalAmount,
      });
      const updatedTenant = await this.tenantRepository.save(tenant);

      res.json({
        success: true,
        message: "Tenant updated successfully",
        data: this.withPaymentProgress(updatedTenant),
      } as ApiResponse);
    } catch (error) {
      console.error("Update tenant error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async deleteTenant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const tenant = await this.tenantRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!tenant || tenant.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Tenant not found",
        } as ApiResponse);
        return;
      }

      await this.tenantRepository.remove(tenant);

      res.json({
        success: true,
        message: "Tenant deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete tenant error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;
      const {
        amount,
        monthsPaid,
        paymentDate,
        paymentMethod,
        paymentStatus,
        paymentType = "full",
        stayStartDate,
      } = req.body as RecordPaymentBody;

      const isPartialPayment = paymentType === "partial";
      const months = Number(monthsPaid ?? (isPartialPayment ? 0 : 1));

      if (!Number.isFinite(months) || (!isPartialPayment && months <= 0)) {
        res.status(400).json({
          success: false,
          message: "Months paid must be greater than zero",
        } as ApiResponse);
        return;
      }

      if (!paymentMethod) {
        res.status(400).json({
          success: false,
          message: "Payment method is required",
        } as ApiResponse);
        return;
      }

      const tenant = await this.tenantRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!tenant || tenant.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Tenant not found",
        } as ApiResponse);
        return;
      }

      const monthlyRent = Number(tenant.property.monthlyRent || 0);
      const paymentAmount =
        amount !== undefined && amount !== "" ? Number(amount) : monthlyRent * months;

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        res.status(400).json({
          success: false,
          message: "Payment amount must be greater than zero",
        } as ApiResponse);
        return;
      }

      const paidAt = paymentDate ? new Date(paymentDate) : new Date();
      const effectiveStayStartDate = tenant.stayStartDate
        ? new Date(tenant.stayStartDate)
          : stayStartDate
        ? new Date(stayStartDate)
        : paidAt;
      const existingMonthsPaid = Number(tenant.monthsPaid || 0);
      const existingTotalAmount = Number(tenant.totalAmount || 0);
      const nextTotalAmount = existingTotalAmount + paymentAmount;
      const coveredAmount = existingMonthsPaid * monthlyRent;
      const partialAmountPaid =
        monthlyRent > 0 ? Math.max(existingTotalAmount - coveredAmount, 0) : 0;
      const nextPartialAmountPaid = partialAmountPaid + paymentAmount;
      const monthsCoveredByPartial =
        isPartialPayment && monthlyRent > 0
          ? Math.floor(nextPartialAmountPaid / monthlyRent)
          : 0;
      const totalMonthsPaid =
        existingMonthsPaid + (isPartialPayment ? monthsCoveredByPartial : months);
      const currentMonthPaid =
        monthlyRent > 0 ? Math.max(nextTotalAmount - totalMonthsPaid * monthlyRent, 0) : 0;

      tenant.payment = paymentAmount;
      tenant.paymentDate = paidAt;
      tenant.paymentMethod = paymentMethod;
      tenant.paymentStatus =
        paymentStatus ||
        (isPartialPayment && currentMonthPaid > 0
          ? TenantPaymentStatus.PENDING
          : TenantPaymentStatus.PAID);
      tenant.monthsPaid = totalMonthsPaid;
      tenant.stayStartDate = tenant.stayStartDate || effectiveStayStartDate;
      tenant.stayEndDate = isPartialPayment && monthsCoveredByPartial === 0
        ? tenant.stayEndDate
        : this.addMonths(effectiveStayStartDate, totalMonthsPaid);
      tenant.totalAmount = nextTotalAmount;

      const updatedTenant = await this.tenantRepository.save(tenant);

      res.json({
        success: true,
        message: "Payment recorded successfully",
        data: this.withPaymentProgress(updatedTenant),
      } as ApiResponse<Tenant>);
    } catch (error) {
      console.error("Record payment error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
