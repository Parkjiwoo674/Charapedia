import { Router } from "express";
import {
  listReports,
  deleteReportedCharacter,
  dismissReports,
  listUsers,
  getStats,
} from "../controllers/adminController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// 모든 관리자 라우트: 로그인 + admin 권한 필수
router.use(authenticate, requireAdmin);

router.get("/reports", asyncHandler(listReports));
router.delete("/characters/:id", asyncHandler(deleteReportedCharacter));
router.post("/reports/dismiss", asyncHandler(dismissReports));
router.get("/users", asyncHandler(listUsers));
router.get("/stats", asyncHandler(getStats));

export default router;
