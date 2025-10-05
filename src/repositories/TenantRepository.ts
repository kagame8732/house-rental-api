import { Repository, FindManyOptions } from "typeorm";
import { AppDataSource } from "../database";
import { Tenant, TenantStatus } from "../database/models";
import { BaseRepository } from "./BaseRepository";
import { TenantQueryDto } from "../dto";

export class TenantRepository extends BaseRepository<Tenant> {
  constructor() {
    super(Tenant);
  }

  async findByPropertyIds(
    propertyIds: string[],
    options?: FindManyOptions<Tenant>
  ): Promise<Tenant[]> {
    if (propertyIds.length === 0) return [];

    return this.repository.find({
      where: { propertyId: { $in: propertyIds } } as any,
      relations: ["property"],
      ...options,
    });
  }

  async findByProperty(propertyId: string): Promise<Tenant[]> {
    return this.repository.find({
      where: { propertyId },
      relations: ["property"],
    });
  }

  async findWithPagination(query: TenantQueryDto, propertyIds: string[]) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      status,
      propertyId,
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
      .createQueryBuilder("tenant")
      .leftJoinAndSelect("tenant.property", "property")
      .where("tenant.propertyId IN (:...propertyIds)", { propertyIds });

    if (search) {
      queryBuilder.andWhere(
        "(tenant.name ILIKE :search OR tenant.email ILIKE :search OR tenant.phone ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere("tenant.status = :status", { status });
    }

    if (propertyId) {
      queryBuilder.andWhere("tenant.propertyId = :propertyId", { propertyId });
    }

    queryBuilder
      .orderBy(`tenant.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [tenants, total] = await queryBuilder.getManyAndCount();

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
