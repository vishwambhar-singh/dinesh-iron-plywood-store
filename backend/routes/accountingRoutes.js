import express from "express";
import {
  createVoucher,
  deleteVoucher,
  getAllVouchers,
  updateVoucher,
  approveVoucher,
} from "../controllers/accountingController.js";

const router = express.Router();

router.post("/", createVoucher);
router.get("/", getAllVouchers);
router.put("/:id", updateVoucher);
router.put("/:id/approve", approveVoucher);
router.delete("/:id", deleteVoucher);

export default router;
