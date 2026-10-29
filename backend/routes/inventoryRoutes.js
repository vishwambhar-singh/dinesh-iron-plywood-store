import express from "express";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  importInventoryController,
  updateProduct,
} from "../controllers/inventoryController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", addProduct);
router.get("/", getAllProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post(
  "/upload-inventory",
  upload.single("file"),
  importInventoryController,
);

export default router;
