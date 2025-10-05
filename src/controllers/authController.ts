import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../database";
import { User } from "../database/models";
import { ApiResponse } from "../types";

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        res.status(400).json({
          success: false,
          message: "Phone and password are required",
        } as ApiResponse);
        return;
      }

      const user = await this.userRepository.findOne({ where: { phone } });
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        } as ApiResponse);
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        } as ApiResponse);
        return;
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN } as SignOptions
      );

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
          token,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  }
}
