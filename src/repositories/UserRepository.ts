import { Repository, FindManyOptions } from "typeorm";
import { AppDataSource } from "../database";
import { User, UserRole } from "../database/models";
import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.repository.find({
      where: { role },
    });
  }

  async findAdminUser(): Promise<User | null> {
    return this.repository.findOne({
      where: { role: UserRole.ADMIN },
    });
  }
}
