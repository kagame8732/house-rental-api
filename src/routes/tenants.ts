import { Router } from "express";
import { TenantController } from "../controllers/tenantController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const tenantController = new TenantController();

// All routes require authentication
router.use(authenticateToken);

// Tenant CRUD routes
router.post("/", tenantController.createTenant.bind(tenantController));
router.get("/", tenantController.getTenants.bind(tenantController));
router.get("/:id", tenantController.getTenantById.bind(tenantController));
router.put("/:id", tenantController.updateTenant.bind(tenantController));
router.delete("/:id", tenantController.deleteTenant.bind(tenantController));

export default router;
