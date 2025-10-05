import {
  LeaseRepository,
  PropertyRepository,
  TenantRepository,
} from "../repositories";
import { Lease, LeaseStatus, Property, Tenant } from "../database/models";
import { CreateLeaseDto, UpdateLeaseDto, LeaseQueryDto } from "../dto";
import { ApiResponse } from "../types";
import { LeaseExpirationService } from "./leaseExpirationService";

export class LeaseService {
  private leaseRepository: LeaseRepository;
  private propertyRepository: PropertyRepository;
  private tenantRepository: TenantRepository;
  private expirationService: LeaseExpirationService;

  constructor() {
    this.leaseRepository = new LeaseRepository();
    this.propertyRepository = new PropertyRepository();
    this.tenantRepository = new TenantRepository();
    this.expirationService = new LeaseExpirationService();
  }

  async createLease(
    data: CreateLeaseDto,
    ownerId: string
  ): Promise<ApiResponse<Lease>> {
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

      // Verify tenant belongs to the property
      const tenant = await this.tenantRepository.findOne({
        where: { id: data.tenantId, propertyId: data.propertyId },
      });

      if (!tenant) {
        return {
          success: false,
          message: "Tenant not found or not associated with this property",
        };
      }

      // Check if property already has an active lease
      const existingActiveLease =
        await this.leaseRepository.findActiveByProperty(data.propertyId);
      if (existingActiveLease) {
        return {
          success: false,
          message: "Property already has an active lease",
        };
      }

      const lease = await this.leaseRepository.create({
        ...data,
        status: LeaseStatus.ACTIVE,
      });

      return {
        success: true,
        message: "Lease created successfully",
        data: lease,
      };
    } catch (error) {
      console.error("Create lease error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getLeases(
    query: LeaseQueryDto,
    ownerId: string
  ): Promise<ApiResponse<Lease[]>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const result = await this.leaseRepository.findWithPagination(
        query,
        propertyIds
      );

      return {
        success: true,
        message: "Leases retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Get leases error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getLeaseById(id: string, ownerId: string): Promise<ApiResponse<Lease>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const lease = await this.leaseRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
        relations: ["property", "tenant"],
      });

      if (!lease) {
        return {
          success: false,
          message: "Lease not found",
        };
      }

      return {
        success: true,
        message: "Lease retrieved successfully",
        data: lease,
      };
    } catch (error) {
      console.error("Get lease by ID error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async updateLease(
    id: string,
    data: UpdateLeaseDto,
    ownerId: string
  ): Promise<ApiResponse<Lease>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const existingLease = await this.leaseRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!existingLease) {
        return {
          success: false,
          message: "Lease not found",
        };
      }

      // If updating to active status, check for conflicts
      if (data.status === LeaseStatus.ACTIVE && data.propertyId) {
        const activeLease = await this.leaseRepository.findActiveByProperty(
          data.propertyId
        );
        if (activeLease && activeLease.id !== id) {
          return {
            success: false,
            message: "Property already has an active lease",
          };
        }
      }

      const updatedLease = await this.leaseRepository.update(id, data);

      if (!updatedLease) {
        return {
          success: false,
          message: "Failed to update lease",
        };
      }

      return {
        success: true,
        message: "Lease updated successfully",
        data: updatedLease,
      };
    } catch (error) {
      console.error("Update lease error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async deleteLease(id: string, ownerId: string): Promise<ApiResponse<void>> {
    try {
      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const lease = await this.leaseRepository.findOne({
        where: { id, propertyId: { $in: propertyIds } } as any,
      });

      if (!lease) {
        return {
          success: false,
          message: "Lease not found",
        };
      }

      const deleted = await this.leaseRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Failed to delete lease",
        };
      }

      return {
        success: true,
        message: "Lease deleted successfully",
      };
    } catch (error) {
      console.error("Delete lease error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async checkExpiredLeases(
    ownerId: string
  ): Promise<ApiResponse<{ updatedCount: number; expiredLeases: Lease[] }>> {
    try {
      const updatedCount =
        await this.expirationService.checkAndUpdateExpiredLeases();

      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length === 0) {
        return {
          success: true,
          message: "No leases found for this owner",
          data: {
            updatedCount: 0,
            expiredLeases: [],
          },
        };
      }

      const expiredLeases = await this.leaseRepository.findByPropertyIds(
        propertyIds
      );
      const filteredExpiredLeases = expiredLeases.filter(
        (lease) => lease.status === LeaseStatus.EXPIRED
      );

      return {
        success: true,
        message: `Checked expired leases. Updated ${updatedCount} leases.`,
        data: {
          updatedCount,
          expiredLeases: filteredExpiredLeases,
        },
      };
    } catch (error) {
      console.error("Check expired leases error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getLeasesExpiringSoon(
    ownerId: string,
    days: number = 30
  ): Promise<ApiResponse<Lease[]>> {
    try {
      const expiringLeases = await this.expirationService.getLeasesExpiringSoon(
        days
      );

      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      const ownerExpiringLeases = expiringLeases.filter((lease) =>
        propertyIds.includes(lease.propertyId)
      );

      return {
        success: true,
        message: "Leases expiring soon retrieved successfully",
        data: ownerExpiringLeases,
      };
    } catch (error) {
      console.error("Get leases expiring soon error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getMonthlyRevenue(
    ownerId: string,
    year?: number,
    month?: number
  ): Promise<
    ApiResponse<{
      year: number;
      month: number;
      totalRevenue: number;
      activeLeases: number;
      revenueBreakdown: Array<{
        leaseId: string;
        propertyName: string;
        tenantName: string;
        monthlyRent: number;
        startDate: string;
        endDate: string;
      }>;
    }>
  > {
    try {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      // Get property IDs owned by the user
      const properties = await this.propertyRepository.findByOwner(ownerId);
      const propertyIds = properties.map((p) => p.id);

      if (propertyIds.length === 0) {
        return {
          success: true,
          message: "Monthly revenue calculated successfully",
          data: {
            year: targetYear,
            month: targetMonth,
            totalRevenue: 0,
            activeLeases: 0,
            revenueBreakdown: [],
          },
        };
      }

      const activeLeases =
        await this.leaseRepository.findActiveLeasesByPropertyIds(propertyIds);

      const totalRevenue = activeLeases.reduce((sum, lease) => {
        return sum + parseFloat(lease.monthlyRent.toString());
      }, 0);

      const revenueBreakdown = activeLeases.map((lease) => ({
        leaseId: lease.id,
        propertyName: lease.property?.name || "Unknown Property",
        tenantName: lease.tenant?.name || "Unknown Tenant",
        monthlyRent: parseFloat(lease.monthlyRent.toString()),
        startDate: lease.startDate,
        endDate: lease.endDate,
      }));

      return {
        success: true,
        message: "Monthly revenue calculated successfully",
        data: {
          year: targetYear,
          month: targetMonth,
          totalRevenue,
          activeLeases: activeLeases.length,
          revenueBreakdown,
        },
      };
    } catch (error) {
      console.error("Get monthly revenue error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
