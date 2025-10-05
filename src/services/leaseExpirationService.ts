import { AppDataSource } from "../database";
import { Lease, LeaseStatus } from "../database/models";

export class LeaseExpirationService {
  private leaseRepository = AppDataSource.getRepository(Lease);

  /**
   * Check and update leases that have reached their end date
   * @returns Promise<number> - Number of leases updated to expired
   */
  async checkAndUpdateExpiredLeases(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      // Find all active leases where end date has passed
      const expiredLeases = await this.leaseRepository.find({
        where: {
          status: LeaseStatus.ACTIVE,
        },
      });

      const leasesToExpire = expiredLeases.filter((lease) => {
        const endDate = new Date(lease.endDate);
        endDate.setHours(0, 0, 0, 0); // Start of day for comparison
        return endDate < today;
      });

      if (leasesToExpire.length === 0) {
        return 0;
      }

      // Update all expired leases
      const updatePromises = leasesToExpire.map((lease) =>
        this.leaseRepository.update(lease.id, {
          status: LeaseStatus.EXPIRED,
        })
      );

      await Promise.all(updatePromises);

      console.log(`Updated ${leasesToExpire.length} leases to expired status`);
      return leasesToExpire.length;
    } catch (error) {
      console.error("Error checking expired leases:", error);
      throw error;
    }
  }

  /**
   * Get leases that are about to expire (within specified days)
   * @param days - Number of days to check ahead (default: 30)
   * @returns Promise<Lease[]> - Leases expiring soon
   */
  async getLeasesExpiringSoon(days: number = 30): Promise<Lease[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const leases = await this.leaseRepository.find({
        where: {
          status: LeaseStatus.ACTIVE,
        },
        relations: ["property", "tenant"],
      });

      return leases.filter((lease) => {
        const endDate = new Date(lease.endDate);
        return endDate >= today && endDate <= futureDate;
      });
    } catch (error) {
      console.error("Error getting leases expiring soon:", error);
      throw error;
    }
  }

  /**
   * Get all expired leases
   * @returns Promise<Lease[]> - All expired leases
   */
  async getExpiredLeases(): Promise<Lease[]> {
    try {
      return await this.leaseRepository.find({
        where: {
          status: LeaseStatus.EXPIRED,
        },
        relations: ["property", "tenant"],
        order: {
          endDate: "DESC",
        },
      });
    } catch (error) {
      console.error("Error getting expired leases:", error);
      throw error;
    }
  }
}
