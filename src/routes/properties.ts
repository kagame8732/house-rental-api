import { Router } from "express";
import { PropertyController } from "../controllers/propertyController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const propertyController = new PropertyController();

// All routes require authentication
router.use(authenticateToken);

// Property CRUD routes
router.post("/", propertyController.createProperty.bind(propertyController));
router.get("/", propertyController.getProperties.bind(propertyController));
router.get(
  "/available",
  propertyController.getAvailableProperties.bind(propertyController)
);
router.get("/:id", propertyController.getPropertyById.bind(propertyController));
router.get(
  "/:id/availability",
  propertyController.checkPropertyAvailability.bind(propertyController)
);
router.put("/:id", propertyController.updateProperty.bind(propertyController));
router.delete(
  "/:id",
  propertyController.deleteProperty.bind(propertyController)
);

export default router;
