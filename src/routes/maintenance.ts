import { Router } from "express";
import { MaintenanceController } from "../controllers/maintenanceController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const maintenanceController = new MaintenanceController();

// All routes require authentication
router.use(authenticateToken);

// Maintenance CRUD routes
router.post(
  "/",
  maintenanceController.createMaintenance.bind(maintenanceController)
);
router.get(
  "/",
  maintenanceController.getMaintenance.bind(maintenanceController)
);
router.get(
  "/:id",
  maintenanceController.getMaintenanceById.bind(maintenanceController)
);
router.put(
  "/:id",
  maintenanceController.updateMaintenance.bind(maintenanceController)
);
router.delete(
  "/:id",
  maintenanceController.deleteMaintenance.bind(maintenanceController)
);

export default router;
