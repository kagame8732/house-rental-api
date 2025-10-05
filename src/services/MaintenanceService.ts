import { MaintenanceRepository, PropertyRepository } from "../repositories";
import {
  Maintenance,
  MaintenanceStatus,
  MaintenancePriority,
} from "../database/models";
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  MaintenanceQueryDto,
} from "../dto";
import { ApiResponse } from "../types";

export class MaintenanceService {
  private maintenanceRepository: MaintenanceRepository;
  private propertyRepository: PropertyRepository;

  constructor() {
    this.maintenanceRepository = new MaintenanceRepository();
    this.propertyRepository = new PropertyRepository();
  }

  async createMaintenance(
    data: CreateMaintenanceDto,
    ownerId: string
  ): Promise<ApiResponse<Maintenance>> {
    try {
      // Verify property belongs to owner
      const property = await this.propertyRepository.findOne({
        where: { id: data.propertyId, ownerId },
      });

      if (!property) {
        return {
          success: false,
          message: "Property not found or access denied",
        };
      }

      const maintenance = await this.maintenanceRepository.create({
        ...data,
        status: data.status || MaintenanceStatus.PENDING,
      });

      return {
        success: true,
        message: "Maintenance request created successfully",
        data: maintenance,
      };
    } catch (error) {
      console.error("Create maintenance error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getMaintenance(
    query: MaintenanceQueryDto,
    ownerId: string
  ): Promise<ApiResponse<Maintenance[]>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const result = await this.maintenanceRepository.findWithPagination(
        query,
        propertyIds
      );

      return {
        success: true,
        message: "Maintenance requests retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Get maintenance error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getMaintenanceById(
    id: string,
    ownerId: string
  ): Promise<ApiResponse<Maintenance>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const maintenance = await this.maintenanceRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
        relations: ["property"],
      });

      if (!maintenance) {
        return {
          success: false,
          message: "Maintenance request not found",
        };
      }

      return {
        success: true,
        message: "Maintenance request retrieved successfully",
        data: maintenance,
      };
    } catch (error) {
      console.error("Get maintenance by ID error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async updateMaintenance(
    id: string,
    data: UpdateMaintenanceDto,
    ownerId: string
  ): Promise<ApiResponse<Maintenance>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const existingMaintenance = await this.maintenanceRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!existingMaintenance) {
        return {
          success: false,
          message: "Maintenance request not found",
        };
      }

      // If changing property, verify it belongs to owner
      if (
        data.propertyId &&
        data.propertyId !== existingMaintenance.propertyId
      ) {
        const property = await this.propertyRepository.findOne({
          where: { id: data.propertyId, ownerId },
        });

        if (!property) {
          return {
            success: false,
            message: "Property not found or access denied",
          };
        }
      }

      const updatedMaintenance = await this.maintenanceRepository.update(
        id,
        data
      );

      if (!updatedMaintenance) {
        return {
          success: false,
          message: "Failed to update maintenance request",
        };
      }

      return {
        success: true,
        message: "Maintenance request updated successfully",
        data: updatedMaintenance,
      };
    } catch (error) {
      console.error("Update maintenance error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async deleteMaintenance(
    id: string,
    ownerId: string
  ): Promise<ApiResponse<void>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const maintenance = await this.maintenanceRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!maintenance) {
        return {
          success: false,
          message: "Maintenance request not found",
        };
      }

      const deleted = await this.maintenanceRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Failed to delete maintenance request",
        };
      }

      return {
        success: true,
        message: "Maintenance request deleted successfully",
      };
    } catch (error) {
      console.error("Delete maintenance error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
