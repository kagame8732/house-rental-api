import { Router } from "express";
import authRoutes from "./auth";
import propertyRoutes from "./properties";
import tenantRoutes from "./tenants";
import leaseRoutes from "./leases";
import maintenanceRoutes from "./maintenance";

const router = Router();

// API routes
router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/tenants", tenantRoutes);
router.use("/leases", leaseRoutes);
router.use("/maintenance", maintenanceRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "House Rental Management API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
