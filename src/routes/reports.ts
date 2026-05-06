import { Router } from "express";
import { ReportController } from "../controllers/reportController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const reportController = new ReportController();

router.use(authenticateToken);

router.get("/overview", reportController.getOverview.bind(reportController));

export default router;
