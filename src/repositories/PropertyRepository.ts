import { Repository, FindManyOptions } from "typeorm";
import { AppDataSource } from "../database";
import { Property, PropertyType, PropertyStatus } from "../database/models";
import { BaseRepository } from "./BaseRepository";
import { PropertyQueryDto } from "../dto";

export class PropertyRepository extends BaseRepository<Property> {
  constructor() {
    super(Property);
  }

  async findByOwner(
    ownerId: string,
    options?: FindManyOptions<Property>
  ): Promise<Property[]> {
    return this.repository.find({
      where: { ownerId },
      ...options,
    });
  }

  async findAvailableProperties(ownerId: string): Promise<Property[]> {
    return this.repository
      .createQueryBuilder("property")
      .leftJoin("property.tenants", "tenant", "tenant.status = :status", {
        status: "active",
      })
      .where("property.ownerId = :ownerId", { ownerId })
      .andWhere("tenant.id IS NULL")
      .getMany();
  }

  async checkAvailability(propertyId: string): Promise<boolean> {
    const activeTenant = await this.repository
      .createQueryBuilder("property")
      .leftJoin("property.tenants", "tenant", "tenant.status = :status", {
        status: "active",
      })
      .where("property.id = :propertyId", { propertyId })
      .andWhere("tenant.id IS NULL")
      .getOne();

    return !!activeTenant;
  }

  async findWithPagination(query: PropertyQueryDto, ownerId: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      search,
      type,
      status,
    } = query;

    const queryBuilder = this.repository
      .createQueryBuilder("property")
      .where("property.ownerId = :ownerId", { ownerId });

    if (search) {
      queryBuilder.andWhere(
        "(property.name ILIKE :search OR property.address ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere("property.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("property.status = :status", { status });
    }

    queryBuilder
      .orderBy(`property.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [properties, total] = await queryBuilder.getManyAndCount();

    return {
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
