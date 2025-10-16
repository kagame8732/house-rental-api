import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Tenant, TenantStatus, Property } from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";

export class TenantController {
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, address, propertyId, status, payment, paymentDate, paymentMethod } = req.body;
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

      // Check if property is available (not already rented)
      const existingTenant = await this.tenantRepository.findOne({
        where: {
          propertyId,
          status: "active",
        },
      });

      if (existingTenant) {
        res.status(400).json({
          success: false,
          message:
            "Property is already rented. Only available properties can be assigned to tenants.",
        } as ApiResponse);
        return;
      }

      const tenant = this.tenantRepository.create({
        name,
        phone,
        email,
        address,
        propertyId,
        status: status || TenantStatus.ACTIVE,
        payment: payment ? parseFloat(payment) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod: paymentMethod || null,
      });

      const savedTenant = await this.tenantRepository.save(tenant);

      res.status(201).json({
        success: true,
        message: "Tenant created successfully",
        data: savedTenant,
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
          message: "Tenants retrieved successfully",
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

      const queryBuilder = this.tenantRepository
        .createQueryBuilder("tenant")
        .leftJoinAndSelect("tenant.property", "property")
        .where("tenant.propertyId IN (:...propertyIds)", { propertyIds });

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
        data: tenants,
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
        relations: ["property"],
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
        data: tenant,
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

      // If updating property, check if new property is available
      if (
        updateData.propertyId &&
        updateData.propertyId !== tenant.propertyId
      ) {
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

        // Check if new property is available (not already rented)
        const existingTenant = await this.tenantRepository.findOne({
          where: {
            propertyId: updateData.propertyId,
            status: "active",
          },
        });

        if (existingTenant) {
          res.status(400).json({
            success: false,
            message:
              "Property is already rented. Only available properties can be assigned to tenants.",
          } as ApiResponse);
          return;
        }
      }

      // Handle payment fields properly
      if (updateData.payment !== undefined) {
        tenant.payment = updateData.payment ? parseFloat(updateData.payment) : null;
      }
      if (updateData.paymentDate !== undefined) {
        tenant.paymentDate = updateData.paymentDate ? new Date(updateData.paymentDate) : null;
      }
      if (updateData.paymentMethod !== undefined) {
        tenant.paymentMethod = updateData.paymentMethod || null;
      }

      // Handle other fields
      const { payment, paymentDate, paymentMethod, ...otherFields } = updateData;
      Object.assign(tenant, otherFields);
      
      const updatedTenant = await this.tenantRepository.save(tenant);

      res.json({
        success: true,
        message: "Tenant updated successfully",
        data: updatedTenant,
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
}
