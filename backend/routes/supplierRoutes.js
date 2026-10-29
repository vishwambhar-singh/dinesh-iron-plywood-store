import express from "express";
import {
  addSupplierBill,
  createSupplier,
  createSupplierOrder,
  deleteSupplier,
  deleteSupplierOrderController,
  getAllSuppliers,
  updateSupplier,
  updateSupplierOrderController,
  addBillPayment,
  deleteBillPayment,
} from "../controllers/supplierControllers.js";

const router = express.Router();
router.post("/", createSupplier);
router.get("/", getAllSuppliers);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.post("/orders", createSupplierOrder);
router.put("/orders/:orderId", updateSupplierOrderController);
router.delete("/orders/:orderId", deleteSupplierOrderController);
router.post("/orders/receive-order", addSupplierBill);
router.post("/payments", addBillPayment);
router.delete("/payments/:id", deleteBillPayment);
export default router;
