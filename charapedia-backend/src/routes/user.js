import { Router } from "express";
import {
  getProfile,
  updateProfile,
  setAvatar,
  deleteAvatar,
  listMyLikes,
  listMyCharacters,
  listMyReviews,
} from "../controllers/userController.js";
import { uploadAvatar } from "../middleware/upload.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// 모든 마이페이지 API는 로그인 필수
router.use(authenticate);

router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));
router.post("/avatar", uploadAvatar, asyncHandler(setAvatar));
router.delete("/avatar", asyncHandler(deleteAvatar));

router.get("/likes", asyncHandler(listMyLikes));
router.get("/characters", asyncHandler(listMyCharacters));
router.get("/reviews", asyncHandler(listMyReviews));

export default router;
