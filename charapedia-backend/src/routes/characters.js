import { Router } from "express";
import {
  listCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "../controllers/characterController.js";
import { toggleLike } from "../controllers/likeController.js";
import { listReviews, createReview, deleteReview } from "../controllers/reviewController.js";
import { createReport } from "../controllers/reportController.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listCharacters));
router.get("/:id", optionalAuth, asyncHandler(getCharacter));
router.post("/", authenticate, asyncHandler(createCharacter));
router.put("/:id", authenticate, asyncHandler(updateCharacter));
router.delete("/:id", authenticate, asyncHandler(deleteCharacter));

// 좋아요
router.post("/:id/like", authenticate, asyncHandler(toggleLike));

// 리뷰
router.get("/:id/reviews", asyncHandler(listReviews));
router.post("/:id/reviews", authenticate, asyncHandler(createReview));
router.delete("/:id/reviews/:reviewId", authenticate, asyncHandler(deleteReview));

// 신고
router.post("/:id/report", authenticate, asyncHandler(createReport));

export default router;
