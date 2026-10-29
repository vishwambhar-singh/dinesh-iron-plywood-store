import express from "express";
import {
  changePassword,
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  updateEmployee,
  resetAllPasswords,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmployee);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.put("/:id/change-password", changePassword);
router.post("/reset-all-passwords", resetAllPasswords);

export default router;
