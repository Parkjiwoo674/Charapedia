import { Router } from "express";
import { listWorks, createWork } from "../controllers/workController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listWorks));
router.post("/", authenticate, asyncHandler(createWork));

export default router;