import express from "express";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
  deleteLeave,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/", createLeave);
router.get("/", getLeaves);
router.put("/:id/status", updateLeaveStatus);
router.delete("/:id", deleteLeave);

export default router;
