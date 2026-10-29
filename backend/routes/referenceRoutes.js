import express from "express";
import {
  createReference,
  deleteReference,
  getAllReferences,
  updateReference,
} from "../controllers/referenceController.js";
const router = express.Router();

router.post("/", createReference);
router.get("/", getAllReferences);
router.put("/:id", updateReference);
router.delete("/:id", deleteReference);

export default router;
