import { PropertyRepository, LeaseRepository } from "../repositories";
import { Property, PropertyStatus } from "../database/models";
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from "../dto";
import { ApiResponse } from "../types";

export class PropertyService {
  private propertyRepository: PropertyRepository;
  private leaseRepository: LeaseRepository;

  constructor() {
    this.propertyRepository = new PropertyRepository();
    this.leaseRepository = new LeaseRepository();
  }

  async createProperty(
    data: CreatePropertyDto,
    ownerId: string
  ): Promise<ApiResponse<Property>> {
    try {
      const property = await this.propertyRepository.create({
        ...data,
        status: data.status || PropertyStatus.ACTIVE,
        ownerId,
      });

      return {
        success: true,
        message: "Property created successfully",
        data: property,
      };
    } catch (error) {
      console.error("Create property error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getProperties(
    query: PropertyQueryDto,
    ownerId: string
  ): Promise<ApiResponse<Property[]>> {
    try {
      const result = await this.propertyRepository.findWithPagination(
        query,
        ownerId
      );

      return {
        success: true,
        message: "Properties retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Get properties error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getPropertyById(
    id: string,
    ownerId: string
  ): Promise<ApiResponse<Property>> {
    try {
      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
      });

      if (!property) {
        return {
          success: false,
          message: "Property not found",
        };
      }

      return {
        success: true,
        message: "Property retrieved successfully",
        data: property,
      };
    } catch (error) {
      console.error("Get property by ID error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async updateProperty(
    id: string,
    data: UpdatePropertyDto,
    ownerId: string
  ): Promise<ApiResponse<Property>> {
    try {
      const existingProperty = await this.propertyRepository.findOne({
        where: { id, ownerId },
      });

      if (!existingProperty) {
        return {
          success: false,
          message: "Property not found",
        };
      }

      const updatedProperty = await this.propertyRepository.update(id, data);

      if (!updatedProperty) {
        return {
          success: false,
          message: "Failed to update property",
        };
      }

      return {
        success: true,
        message: "Property updated successfully",
        data: updatedProperty,
      };
    } catch (error) {
      console.error("Update property error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async deleteProperty(
    id: string,
    ownerId: string
  ): Promise<ApiResponse<void>> {
    try {
      const property = await this.propertyRepository.findOne({
        where: { id, ownerId },
      });

      if (!property) {
        return {
          success: false,
          message: "Property not found",
        };
      }

      // Check if property has active leases
      const activeLeases = await this.leaseRepository.find({
        where: { propertyId: id, status: "active" },
      });

      if (activeLeases.length > 0) {
        return {
          success: false,
          message: "Cannot delete property with active leases",
        };
      }

      const deleted = await this.propertyRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Failed to delete property",
        };
      }

      return {
        success: true,
        message: "Property deleted successfully",
      };
    } catch (error) {
      console.error("Delete property error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async checkPropertyAvailability(
    propertyId: string,
    ownerId: string
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    try {
      const property = await this.propertyRepository.findOne({
        where: { id: propertyId, ownerId },
      });

      if (!property) {
        return {
          success: false,
          message: "Property not found",
        };
      }

      const isAvailable = await this.propertyRepository.checkAvailability(
        propertyId
      );

      return {
        success: true,
        message: "Property availability checked successfully",
        data: { isAvailable },
      };
    } catch (error) {
      console.error("Check property availability error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getAvailableProperties(
    ownerId: string
  ): Promise<ApiResponse<Property[]>> {
    try {
      const properties = await this.propertyRepository.findAvailableProperties(
        ownerId
      );

      return {
        success: true,
        message: "Available properties retrieved successfully",
        data: properties,
      };
    } catch (error) {
      console.error("Get available properties error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
