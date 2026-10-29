import express from "express";
import {
  fetchSalarySummary,
  handlePaySalary,
} from "../controllers/salaryControllers.js";

const router = express.Router();

router.get("/summary/:month/:year", fetchSalarySummary);
router.post("/pay", handlePaySalary);

export default router;
