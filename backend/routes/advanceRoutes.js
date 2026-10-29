import express from "express";
import {
  requestAdvance,
  getAllAdvances,
  updateAdvanceStatus,
  deleteAdvance,
} from "../controllers/advanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, requestAdvance);
router.get("/", verifyToken, getAllAdvances);
router.put("/status", verifyToken, updateAdvanceStatus);
router.delete("/:id", verifyToken, deleteAdvance);

export default router;
