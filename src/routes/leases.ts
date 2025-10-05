import { Router } from "express";
import { LeaseController } from "../controllers/leaseController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const leaseController = new LeaseController();

// All routes require authentication
router.use(authenticateToken);

// Lease CRUD routes
router.post("/", leaseController.createLease.bind(leaseController));
router.get("/", leaseController.getLeases.bind(leaseController));
router.get(
  "/expired/check",
  leaseController.checkExpiredLeases.bind(leaseController)
);
router.get(
  "/expiring-soon",
  leaseController.getLeasesExpiringSoon.bind(leaseController)
);
router.get(
  "/monthly-revenue",
  leaseController.getMonthlyRevenue.bind(leaseController)
);
router.get("/:id", leaseController.getLeaseById.bind(leaseController));
router.put("/:id", leaseController.updateLease.bind(leaseController));
router.delete("/:id", leaseController.deleteLease.bind(leaseController));

export default router;
