import { Router } from "express";
import {
  sendCode,
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { loginLimiter, mailLimiter, codeLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/send-code", mailLimiter, asyncHandler(sendCode));
router.post("/signup", codeLimiter, asyncHandler(signup));
router.post("/login", loginLimiter, asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));

router.post("/forgot-password", mailLimiter, asyncHandler(forgotPassword));
router.post("/reset-password", codeLimiter, asyncHandler(resetPassword));

router.delete("/account", authenticate, asyncHandler(deleteAccount));

export default router;
