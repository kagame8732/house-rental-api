import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Property, PropertyType, PropertyStatus } from "../database/models";
import { ApiResponse, PaginationQuery, FilterQuery } from "../types";

export class PropertyController {
  private propertyRepository = AppDataSource.getRepository(Property);

  async createProperty(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, type, status, monthlyRent } = req.body;
      const ownerId = req.user!.id;

      const property = this.propertyRepository.create({
        name,
        address,
        type,
        status: status || PropertyStatus.ACTIVE,
        monthlyRent,
        ownerId,
      });

      const savedProperty = await this.propertyRepository.save(property);

      res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: savedProperty,
      } as ApiResponse);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getProperties(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
        search,
        status,
        type,
      } = req.query as PaginationQuery & FilterQuery;
      const ownerId = req.user!.id;

      const queryBuilder = this.propertyRepository
        .createQueryBuilder("property")
        .where("property.ownerId = :ownerId", { ownerId });

      if (search) {
        queryBuilder.andWhere(
          "(property.name ILIKE :search OR property.address ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (status) {
        queryBuilder.andWhere("property.status = :status", { status });
      }

      if (type) {
        queryBuilder.andWhere("property.type = :type", { type });
      }

      const total = await queryBuilder.getCount();
      const properties = await queryBuilder
        .orderBy(`property.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      res.json({
        success: true,
        message: "Properties retrieved successfully",
        data: properties,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getPropertyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
        relations: ["tenants", "owner"],
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Property retrieved successfully",
        data: property,
      } as ApiResponse);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async updateProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;
      const updateData = req.body;

      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found",
        } as ApiResponse);
        return;
      }

      Object.assign(property, updateData);
      const updatedProperty = await this.propertyRepository.save(property);

      res.json({
        success: true,
        message: "Property updated successfully",
        data: updatedProperty,
      } as ApiResponse);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async deleteProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found",
        } as ApiResponse);
        return;
      }

      await this.propertyRepository.remove(property);

      res.json({
        success: true,
        message: "Property deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async checkPropertyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ownerId = req.user!.id;

      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
        relations: ["tenants"],
      });

      if (!property) {
        res.status(404).json({
          success: false,
          message: "Property not found",
        } as ApiResponse);
        return;
      }

      // Check if property has any active tenants
      const activeTenant = property.tenants?.find(
        (tenant) => tenant.status === "active"
      );
      const isAvailable = !activeTenant;

      res.json({
        success: true,
        message: "Property availability checked",
        data: {
          propertyId: id,
          isAvailable,
          currentTenant: activeTenant || null,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Check property availability error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getAvailableProperties(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.id;

      // Get all properties owned by the user with their tenants
      const properties = await this.propertyRepository.find({
        where: { ownerId, status: PropertyStatus.ACTIVE },
        relations: ["tenants"],
        order: { name: "ASC" },
      });

      // Filter out properties that have active tenants
      const availableProperties = properties.filter(
        (property) =>
          !property.tenants?.some((tenant) => tenant.status === "active")
      );

      res.json({
        success: true,
        message: "Available properties retrieved successfully",
        data: availableProperties,
      } as ApiResponse);
    } catch (error) {
      console.error("Get available properties error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
