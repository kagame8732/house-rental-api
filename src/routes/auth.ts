import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/login", authController.login.bind(authController));

// Protected routes
router.get(
  "/profile",
  authenticateToken,
  authController.getProfile.bind(authController)
);

export default router;
