import { User } from "./database/models";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface FilterQuery {
  search?: string;
  status?: string;
  type?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
