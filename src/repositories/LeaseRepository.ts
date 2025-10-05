import { Repository, FindManyOptions } from "typeorm";
import { AppDataSource } from "../database";
import { Lease, LeaseStatus } from "../database/models";
import { BaseRepository } from "./BaseRepository";
import { LeaseQueryDto } from "../dto";

export class LeaseRepository extends BaseRepository<Lease> {
  constructor() {
    super(Lease);
  }

  async findByPropertyIds(
    propertyIds: string[],
    options?: FindManyOptions<Lease>
  ): Promise<Lease[]> {
    if (propertyIds.length === 0) return [];

    return this.repository.find({
      where: { propertyId: { $in: propertyIds } } as any,
      relations: ["property", "tenant"],
      ...options,
    });
  }

  async findActiveByProperty(propertyId: string): Promise<Lease | null> {
    return this.repository.findOne({
      where: {
        propertyId,
        status: LeaseStatus.ACTIVE,
      },
      relations: ["property", "tenant"],
    });
  }

  async findExpiredLeases(): Promise<Lease[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.repository.find({
      where: {
        endDate: { $lte: today } as any,
        status: LeaseStatus.ACTIVE,
      },
      relations: ["property", "tenant"],
    });
  }

  async findExpiringSoon(days: number = 30): Promise<Lease[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        endDate: { $gte: today, $lte: futureDate } as any,
        status: LeaseStatus.ACTIVE,
      },
      relations: ["property", "tenant"],
      order: {
        endDate: "ASC",
      },
    });
  }

  async findActiveLeasesByPropertyIds(propertyIds: string[]): Promise<Lease[]> {
    if (propertyIds.length === 0) return [];

    return this.repository.find({
      where: {
        propertyId: { $in: propertyIds } as any,
        status: LeaseStatus.ACTIVE,
      },
      relations: ["property", "tenant"],
    });
  }

  async findWithPagination(query: LeaseQueryDto, propertyIds: string[]) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      status,
      propertyId,
      tenantId,
    } = query;

    if (propertyIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const queryBuilder = this.repository
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

    queryBuilder
      .orderBy(`lease.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [leases, total] = await queryBuilder.getManyAndCount();

    return {
      data: leases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
