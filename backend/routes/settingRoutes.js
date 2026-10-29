import express from "express";
import {
  getCompanyDetails,
  updateCompanyDetails,
  getDummyCompanyDetails,
  updateDummyCompanyDetails,
  getRolePermission,
  createRolePermission,
  getAllRolePermissions,
  getSettings,
  updateSetting,
  exportDatabase,
} from "../controllers/settingControllers.js";

const router = express.Router();

router.get("/company", getCompanyDetails);
router.put("/company", updateCompanyDetails);
router.get("/dummy-company", getDummyCompanyDetails);
router.put("/dummy-company", updateDummyCompanyDetails);
router.get("/role-permissions", getAllRolePermissions);
router.get("/role-permissions/:role", getRolePermission);
router.post("/role-permissions", createRolePermission);
router.get("/", getSettings);
router.patch("/update", updateSetting);
router.post("/export-database", exportDatabase);

export default router;
