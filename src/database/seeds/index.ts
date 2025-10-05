import { AppDataSource } from "../index";
import { seedInitialData } from "./initialData";

export const runSeeds = async (): Promise<void> => {
  try {
    // Check if connection is already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connected for seeding");
    } else {
      console.log("Using existing database connection for seeding");
    }

    await seedInitialData();

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
};

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log("Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
