import { TenantRepository, PropertyRepository } from "../repositories";
import { Tenant, TenantStatus, Property } from "../database/models";
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from "../dto";
import { ApiResponse } from "../types";

export class TenantService {
  private tenantRepository: TenantRepository;
  private propertyRepository: PropertyRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
    this.propertyRepository = new PropertyRepository();
  }

  async createTenant(
    data: CreateTenantDto,
    ownerId: string
  ): Promise<ApiResponse<Tenant>> {
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

      // Check if property is available (no active tenant)
      const isAvailable = await this.propertyRepository.checkAvailability(
        data.propertyId
      );
      if (!isAvailable) {
        return {
          success: false,
          message: "Property is not available for new tenants",
        };
      }

      const tenant = await this.tenantRepository.create({
        ...data,
        status: data.status || TenantStatus.ACTIVE,
      });

      return {
        success: true,
        message: "Tenant created successfully",
        data: tenant,
      };
    } catch (error) {
      console.error("Create tenant error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getTenants(
    query: TenantQueryDto,
    ownerId: string
  ): Promise<ApiResponse<Tenant[]>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const result = await this.tenantRepository.findWithPagination(
        query,
        propertyIds
      );

      return {
        success: true,
        message: "Tenants retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Get tenants error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getTenantById(
    id: string,
    ownerId: string
  ): Promise<ApiResponse<Tenant>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const tenant = await this.tenantRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
        relations: ["property"],
      });

      if (!tenant) {
        return {
          success: false,
          message: "Tenant not found",
        };
      }

      return {
        success: true,
        message: "Tenant retrieved successfully",
        data: tenant,
      };
    } catch (error) {
      console.error("Get tenant by ID error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async updateTenant(
    id: string,
    data: UpdateTenantDto,
    ownerId: string
  ): Promise<ApiResponse<Tenant>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const existingTenant = await this.tenantRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!existingTenant) {
        return {
          success: false,
          message: "Tenant not found",
        };
      }

      // If changing property, check if new property is available
      if (data.propertyId && data.propertyId !== existingTenant.propertyId) {
        const property = await this.propertyRepository.findOne({
          where: { id: data.propertyId, ownerId },
        });

        if (!property) {
          return {
            success: false,
            message: "Property not found or access denied",
          };
        }

        const isAvailable = await this.propertyRepository.checkAvailability(
          data.propertyId
        );
        if (!isAvailable) {
          return {
            success: false,
            message: "Property is not available for new tenants",
          };
        }
      }

      const updatedTenant = await this.tenantRepository.update(id, data);

      if (!updatedTenant) {
        return {
          success: false,
          message: "Failed to update tenant",
        };
      }

      return {
        success: true,
        message: "Tenant updated successfully",
        data: updatedTenant,
      };
    } catch (error) {
      console.error("Update tenant error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async deleteTenant(id: string, ownerId: string): Promise<ApiResponse<void>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const tenant = await this.tenantRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!tenant) {
        return {
          success: false,
          message: "Tenant not found",
        };
      }

      const deleted = await this.tenantRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Failed to delete tenant",
        };
      }

      return {
        success: true,
        message: "Tenant deleted successfully",
      };
    } catch (error) {
      console.error("Delete tenant error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
