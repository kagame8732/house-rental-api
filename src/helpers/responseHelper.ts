import { Response } from "express";
import { ApiResponse, PaginationQuery } from "../types";

export class ResponseHelper {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };

    res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      message,
    };

    res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    }
  ): void {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    };

    res.json(response);
  }

  static validationError(
    res: Response,
    message: string,
    errors: string[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      data: { errors },
    };

    res.status(400).json(response);
  }
}
