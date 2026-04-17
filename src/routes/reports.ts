import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { ReportController } from "../controllers/reportController";

const router = Router();
const reportController = new ReportController();

router.use(authenticateToken);
router.get("/overview", reportController.getOverview.bind(reportController));

export default router;
