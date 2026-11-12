import { Router } from "express";
import { getRanking } from "../controllers/rankingController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getRanking));

export default router;
