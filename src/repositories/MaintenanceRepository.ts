import { Repository, FindManyOptions } from "typeorm";
import { AppDataSource } from "../database";
import {
  Maintenance,
  MaintenanceStatus,
  MaintenancePriority,
} from "../database/models";
import { BaseRepository } from "./BaseRepository";
import { MaintenanceQueryDto } from "../dto";

export class MaintenanceRepository extends BaseRepository<Maintenance> {
  constructor() {
    super(Maintenance);
  }

  async findByPropertyIds(
    propertyIds: string[],
    options?: FindManyOptions<Maintenance>
  ): Promise<Maintenance[]> {
    if (propertyIds.length === 0) return [];

    return this.repository.find({
      where: { propertyId: { $in: propertyIds } } as any,
      relations: ["property"],
      ...options,
    });
  }

  async findByProperty(propertyId: string): Promise<Maintenance[]> {
    return this.repository.find({
      where: { propertyId },
      relations: ["property"],
    });
  }

  async findPendingByPropertyIds(
    propertyIds: string[]
  ): Promise<Maintenance[]> {
    if (propertyIds.length === 0) return [];

    return this.repository.find({
      where: {
        propertyId: { $in: propertyIds } as any,
        status: MaintenanceStatus.PENDING,
      },
      relations: ["property"],
    });
  }

  async findWithPagination(query: MaintenanceQueryDto, propertyIds: string[]) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      status,
      priority,
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

    queryBuilder
      .orderBy(`maintenance.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [maintenance, total] = await queryBuilder.getManyAndCount();

    return {
      data: maintenance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
