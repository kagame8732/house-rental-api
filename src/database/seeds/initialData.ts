import { AppDataSource } from "../index";
import { User, UserRole } from "../models";
import bcrypt from "bcryptjs";

export const seedInitialData = async (): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed");
      return;
    }

    // Get superuser credentials from environment variables
    const suEmail = process.env.SU_PHONE;
    const suPassword = process.env.SU_PASSWORD;

    if (!suEmail || !suPassword) {
      throw new Error(
        "SU_PHONE and SU_PASSWORD environment variables are required"
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(suPassword, 10);

    const adminUser = userRepository.create({
      name: "System Administrator",
      phone: suEmail, // Using email as phone for login
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await userRepository.save(adminUser);

    console.log("Initial admin user created successfully");
    console.log(`Email/Phone: ${suEmail}`);
    console.log("Password: [from SU_PASSWORD env variable]");
  } catch (error) {
    console.error("Error seeding initial data:", error);
    throw error;
  }
};
