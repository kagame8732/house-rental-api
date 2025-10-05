import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./database";
import { runSeeds } from "./database/seeds";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { LeaseExpirationService } from "./services/leaseExpirationService";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Automatic lease expiration checking
const checkExpiredLeases = async (): Promise<void> => {
  try {
    const expirationService = new LeaseExpirationService();
    const updatedCount = await expirationService.checkAndUpdateExpiredLeases();

    if (updatedCount > 0) {
      console.log(`✅ Automatically updated ${updatedCount} expired leases`);
    }
  } catch (error) {
    console.error("❌ Error checking expired leases:", error);
  }
};

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();

    // Run seeds in development
    if (process.env.NODE_ENV === "development") {
      await runSeeds();
    }

    // Check for expired leases on startup
    await checkExpiredLeases();

    // Set up automatic expiration checking every hour
    setInterval(checkExpiredLeases, 60 * 60 * 1000); // 1 hour

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log(
        `🔄 Automatic lease expiration checking enabled (every hour)`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
