import { Request, Response } from "express";
import { AppDataSource } from "../database";
import {
  Maintenance,
  MaintenanceStatus,
  MaintenancePriority,
  Property,
} from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";

export class MaintenanceController {
  private maintenanceRepository = AppDataSource.getRepository(Maintenance);

  async createMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        priority,
        propertyId,
        cost,
        scheduledDate,
        notes,
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

      const maintenance = this.maintenanceRepository.create({
        title,
        description,
        priority: priority || MaintenancePriority.MEDIUM,
        propertyId,
        cost,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        status: MaintenanceStatus.PENDING,
      });

      const savedMaintenance = await this.maintenanceRepository.save(
        maintenance
      );

      res.status(201).json({
        success: true,
        message: "Maintenance request created successfully",
        data: savedMaintenance,
      } as ApiResponse);
    } catch (error) {
      console.error("Create maintenance error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
        search,
        status,
        priority,
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
          message: "Maintenance requests retrieved successfully",
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

      const queryBuilder = this.maintenanceRepository
        .createQueryBuilder("maintenance")
        .leftJoinAndSelect("maintenance.property", "property")
        .where("maintenance.propertyId IN (:...propertyIds)", { propertyIds });

      if (search) {
        queryBuilder.andWhere(
          "(maintenance.title ILIKE :search OR maintenance.description ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere("maintenance.status = :status", { status });
      }

      if (priority) {
        queryBuilder.andWhere("maintenance.priority = :priority", { priority });
      }

      if (propertyId) {
        queryBuilder.andWhere("maintenance.propertyId = :propertyId", {
          propertyId,
        });
      }

      const total = await queryBuilder.getCount();
      const maintenance = await queryBuilder
        .orderBy(`maintenance.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        success: true,
        message: "Maintenance requests retrieved successfully",
        data: maintenance,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get maintenance error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getMaintenanceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const maintenance = await this.maintenanceRepository.findOne({
        where: { id },
        relations: ["property"],
        join: {
          alias: "maintenance",
          leftJoinAndSelect: {
            property: "maintenance.property",
          },
        },
      });

      if (!maintenance || maintenance.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Maintenance request not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Maintenance request retrieved successfully",
        data: maintenance,
      } as ApiResponse);
    } catch (error) {
      console.error("Get maintenance error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async updateMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;
      const updateData = req.body;

      const maintenance = await this.maintenanceRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!maintenance || maintenance.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Maintenance request not found",
        } as ApiResponse);
        return;
      }

      // Convert date strings to Date objects if provided
      if (updateData.scheduledDate) {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.completedDate) {
        updateData.completedDate = new Date(updateData.completedDate);
      }

      Object.assign(maintenance, updateData);
      const updatedMaintenance = await this.maintenanceRepository.save(
        maintenance
      );

      res.json({
        success: true,
        message: "Maintenance request updated successfully",
        data: updatedMaintenance,
      } as ApiResponse);
    } catch (error) {
      console.error("Update maintenance error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async deleteMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const maintenance = await this.maintenanceRepository.findOne({
        where: { id },
        relations: ["property"],
      });

      if (!maintenance || maintenance.property.ownerId !== ownerId) {
        res.status(404).json({
          success: false,
          message: "Maintenance request not found",
        } as ApiResponse);
        return;
      }

      await this.maintenanceRepository.remove(maintenance);

      res.json({
        success: true,
        message: "Maintenance request deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete maintenance error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
