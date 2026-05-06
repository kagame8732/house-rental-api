import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Lease, LeaseStatus } from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";

export class LeaseController {
  private leaseRepository = AppDataSource.getRepository(Lease);

  async createLease(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId, tenantId, startDate, endDate, monthlyRent, notes } =
        req.body;
      const ownerId = req.user!.id;

      // Verify property belongs to owner
      const propertyRepository = AppDataSource.getRepository("Property");
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
      const tenantRepository = AppDataSource.getRepository("Tenant");
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

      const queryBuilder = this.leaseRepository
        .createQueryBuilder("lease")
        .leftJoinAndSelect("lease.property", "property")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("property.ownerId = :ownerId", { ownerId });

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
}
