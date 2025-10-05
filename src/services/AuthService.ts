import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories";
import { User, UserRole } from "../database/models";
import { LoginDto, RegisterDto } from "../dto";
import { ApiResponse } from "../types";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(
    data: LoginDto
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const { phone, password } = data;

      // Find user by phone
      const user = await this.userRepository.findByPhone(phone);
      if (!user) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword as User,
          token,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async register(data: RegisterDto): Promise<ApiResponse<User>> {
    try {
      const { name, email, phone, password } = data;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: "User already exists with this email",
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.userRepository.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.OWNER,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "User registered successfully",
        data: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "Profile retrieved successfully",
        data: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
