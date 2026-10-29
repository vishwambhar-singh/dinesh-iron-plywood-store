import express from "express";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  updateCustomer,
  mergeCustomer,
} from "../controllers/customerControllers.js";

const router = express.Router();

router.get("/", getAllCustomers);
router.post("/", createCustomer);
router.post("/merge", mergeCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
