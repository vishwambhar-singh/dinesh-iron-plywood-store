import express from "express";
import {
  deletePayment,
  getInternalLedgers,
  recordPayment,
} from "../controllers/internalLedgerControllers.js";

const router = express.Router();

router.get("/", getInternalLedgers);
router.post("/payment", recordPayment);
router.delete("/payment/:paymentId", deletePayment);
export default router;
