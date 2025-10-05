import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Lease, LeaseStatus, Property, Tenant } from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";
import { LeaseExpirationService } from "../services/leaseExpirationService";

export class LeaseController {
  private leaseRepository = AppDataSource.getRepository(Lease);

  async createLease(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId, tenantId, startDate, endDate, monthlyRent, notes } =
        req.body;
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

      // Verify tenant belongs to the property
      const tenantRepository = AppDataSource.getRepository(Tenant);
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId, propertyId },
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          message: "Tenant not found or not associated with this property",
        } as ApiResponse);
        return;
      }

      // Check if property already has an active lease
      const existingActiveLease = await this.leaseRepository.findOne({
        where: {
          propertyId,
          status: LeaseStatus.ACTIVE,
        },
      });

      if (existingActiveLease) {
        res.status(400).json({
          success: false,
          message:
            "Property is already rented. Please terminate the existing lease first.",
        } as ApiResponse);
        return;
      }

      const lease = this.leaseRepository.create({
        propertyId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent,
        notes,
        status: LeaseStatus.ACTIVE,
      });

      const savedLease = await this.leaseRepository.save(lease);

      res.status(201).json({
        success: true,
        message: "Lease created successfully",
        data: savedLease,
      } as ApiResponse);
    } catch (error) {
      console.error("Create lease error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getLeases(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
        search,
        status,
        propertyId,
        tenantId,
      } = req.query as PaginationQuery & FilterQuery;
      const ownerId = req.user!.id;

      // First get all property IDs owned by this user
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { ownerId },
        select: ["id"],
      });

      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length === 0) {
        // No properties owned by this user, return empty result
        res.json({
          success: true,
          message: "Leases retrieved successfully",
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0,
          },
        } as ApiResponse);
        return;
      }

      const queryBuilder = this.leaseRepository
        .createQueryBuilder("lease")
        .leftJoinAndSelect("lease.property", "property")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("lease.propertyId IN (:...propertyIds)", { propertyIds });

      if (search) {
        queryBuilder.andWhere(
          "(tenant.name ILIKE :search OR property.name ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere("lease.status = :status", { status });
      }

      if (propertyId) {
        queryBuilder.andWhere("lease.propertyId = :propertyId", { propertyId });
      }

      if (tenantId) {
        queryBuilder.andWhere("lease.tenantId = :tenantId", { tenantId });
      }

      const total = await queryBuilder.getCount();
      const leases = await queryBuilder
        .orderBy(`lease.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        success: true,
        message: "Leases retrieved successfully",
        data: leases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get leases error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getLeaseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const lease = await this.leaseRepository.findOne({
        where: { id },
        relations: ["property", "tenant"],
        join: {
          alias: "lease",
          leftJoinAndSelect: {
            property: "lease.property",
            tenant: "lease.tenant",
          },
        },
      });

      if (!lease || lease.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Lease not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Lease retrieved successfully",
        data: lease,
      } as ApiResponse);
    } catch (error) {
      console.error("Get lease error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async updateLease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;
      const updateData = req.body;

      const lease = await this.leaseRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!lease || lease.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Lease not found",
        } as ApiResponse);
        return;
      }

      // Convert date strings to Date objects if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      // If updating to active status, check if property already has another active lease
      if (
        updateData.status === LeaseStatus.ACTIVE &&
        lease.status !== LeaseStatus.ACTIVE
      ) {
        const existingActiveLease = await this.leaseRepository
          .createQueryBuilder("lease")
          .where("lease.propertyId = :propertyId", {
            propertyId: lease.propertyId,
          })
          .andWhere("lease.status = :status", { status: LeaseStatus.ACTIVE })
          .andWhere("lease.id != :currentId", { currentId: id })
          .getOne();

        if (existingActiveLease) {
          res.status(400).json({
            success: false,
            message:
              "Property is already rented to another tenant. Please terminate the existing lease first.",
          } as ApiResponse);
          return;
        }
      }

      Object.assign(lease, updateData);
      const updatedLease = await this.leaseRepository.save(lease);

      res.json({
        success: true,
        message: "Lease updated successfully",
        data: updatedLease,
      } as ApiResponse);
    } catch (error) {
      console.error("Update lease error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async deleteLease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const lease = await this.leaseRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!lease || lease.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Lease not found",
        } as ApiResponse);
        return;
      }

      await this.leaseRepository.remove(lease);

      res.json({
        success: true,
        message: "Lease deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete lease error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async checkExpiredLeases(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const expirationService = new LeaseExpirationService();

      // Check and update expired leases
      const updatedCount =
        await expirationService.checkAndUpdateExpiredLeases();

      // Get all leases for this owner to return updated data
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { ownerId },
        select: ["id"],
      });

      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length === 0) {
        res.json({
          success: true,
          message: "No leases found for this owner",
          data: {
            updatedCount: 0,
            expiredLeases: [],
          },
        } as ApiResponse);
        return;
      }

      const expiredLeases = await this.leaseRepository
        .createQueryBuilder("lease")
        .leftJoinAndSelect("lease.property", "property")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("lease.propertyId IN (:...propertyIds)", { propertyIds })
        .andWhere("lease.status = :status", { status: LeaseStatus.EXPIRED })
        .orderBy("lease.endDate", "DESC")
        .getMany();

      res.json({
        success: true,
        message: `Checked expired leases. Updated ${updatedCount} leases.`,
        data: {
          updatedCount,
          expiredLeases,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Check expired leases error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getLeasesExpiringSoon(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { days = 30 } = req.query;
      const expirationService = new LeaseExpirationService();

      // Get leases expiring soon
      const expiringLeases = await expirationService.getLeasesExpiringSoon(
        Number(days)
      );

      // Filter by owner's properties
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { ownerId },
        select: ["id"],
      });

      const propertyIds = properties.map((p) => p.id);
      const ownerExpiringLeases = expiringLeases.filter((lease) =>
        propertyIds.includes(lease.propertyId)
      );

      res.json({
        success: true,
        message: "Leases expiring soon retrieved successfully",
        data: ownerExpiringLeases,
      } as ApiResponse);
    } catch (error) {
      console.error("Get leases expiring soon error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getMonthlyRevenue(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { year, month } = req.query;

      // Default to current month if not specified
      const currentDate = new Date();
      const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
      const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;

      // Get all properties owned by the user
      const propertyRepository = AppDataSource.getRepository(Property);
      const properties = await propertyRepository.find({
        where: { ownerId },
        select: ["id"],
      });
      
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length === 0) {
        res.json({
          success: true,
          message: "Monthly revenue calculated successfully",
          data: {
            year: targetYear,
            month: targetMonth,
            totalRevenue: 0,
            activeLeases: 0,
            revenueBreakdown: [],
          },
        } as ApiResponse);
        return;
      }

      // Get all active leases for the owner's properties
      const activeLeases = await this.leaseRepository
        .createQueryBuilder("lease")
        .leftJoinAndSelect("lease.property", "property")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("lease.propertyId IN (:...propertyIds)", { propertyIds })
        .andWhere("lease.status = :status", { status: LeaseStatus.ACTIVE })
        .getMany();

      // Calculate total monthly revenue
      const totalRevenue = activeLeases.reduce((sum, lease) => {
        return sum + parseFloat(lease.monthlyRent.toString());
      }, 0);

      // Create revenue breakdown
      const revenueBreakdown = activeLeases.map((lease) => ({
        leaseId: lease.id,
        propertyName: lease.property?.name || "Unknown Property",
        tenantName: lease.tenant?.name || "Unknown Tenant",
        monthlyRent: parseFloat(lease.monthlyRent.toString()),
        startDate: lease.startDate,
        endDate: lease.endDate,
      }));

      res.json({
        success: true,
        message: "Monthly revenue calculated successfully",
        data: {
          year: targetYear,
          month: targetMonth,
          totalRevenue,
          activeLeases: activeLeases.length,
          revenueBreakdown,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get monthly revenue error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
