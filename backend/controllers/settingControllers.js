import * as settingService from "../services/settingServices.js";
import * as exportService from "../services/exportService.js";

export const getCompanyDetails = async (req, res) => {
  try {
    const data = await settingService.getCompanyInfo();
    res.status(200).json(data);
  } catch (error) {
    if (error.message === "DETAILS_NOT_FOUND")
      return res.status(404).json({ message: "No company details found." });
    res
      .status(500)
      .json({ message: "Error fetching details", error: error.message });
  }
};

export const updateCompanyDetails = async (req, res) => {
  try {
    const user = req.user;
    await settingService.modifyCompanyInfo(req.body, user);
    res.status(200).json({ message: "Company details updated successfully!" });
  } catch (error) {
    if (error.message === "RECORD_NOT_FOUND")
      return res
        .status(404)
        .json({ message: "Company record not found to update." });
    res
      .status(500)
      .json({ message: "Error updating details", error: error.message });
  }
};

export const getDummyCompanyDetails = async (req, res) => {
  try {
    const user = req.user;
    const data = await settingService.getDummyCompanyInfo(user);
    res.status(200).json(data);
  } catch (error) {
    if (error.message === "DETAILS_NOT_FOUND")
      return res.status(404).json({ message: "No company details found." });
    res
      .status(500)
      .json({ message: "Error fetching details", error: error.message });
  }
};

export const updateDummyCompanyDetails = async (req, res) => {
  try {
    await settingService.modifyDummyCompanyInfo(req.body);
    res.status(200).json({ message: "Company details updated successfully!" });
  } catch (error) {
    if (error.message === "RECORD_NOT_FOUND")
      return res
        .status(404)
        .json({ message: "Company record not found to update." });
    res
      .status(500)
      .json({ message: "Error updating details", error: error.message });
  }
};

export const getAllRolePermissions = async (req, res) => {
  try {
    const data = await settingService.getFormattedRolePermissions();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching role permissions",
      error: error.message,
    });
  }
};

export const getRolePermission = async (req, res) => {
  try {
    const { role } = req.params;
    const data = await settingService.getSingleRolePermission(role);
    res.status(200).json(data);
  } catch (error) {
    if (error.message === "ROLE_NOT_FOUND")
      return res.status(404).json({ message: "Role not found." });
    res.status(500).json({
      message: "Error fetching role permission",
      error: error.message,
    });
  }
};

export const createRolePermission = async (req, res) => {
  try {
    const { role, permissions } = req.body;
    const user = req.user;

    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({ message: "Invalid data format." });
    }

    await settingService.saveRolePermission(role, permissions, user);
    res.status(200).json({ message: "Role permissions saved successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving role permissions", error: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const data = await settingService.getAllSettings();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching settings",
      error: error.message,
    });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { group, settings } = req.body;
    const user = req.user;

    if (!group || !settings || typeof settings !== "object") {
      return res
        .status(400)
        .json({ message: "Invalid request body structure" });
    }

    const keys = Object.keys(settings);

    for (const key of keys) {
      await settingService.modifySetting(group, key, settings[key], user);
    }

    res.status(200).json({ message: "Settings updated successfully!" });
  } catch (error) {
    if (error.message === "SETTING_UPDATE_FAILED")
      return res.status(404).json({ message: "Setting not found to update." });
    res.status(500).json({
      message: "Error updating setting",
      error: error.message,
    });
  }
};

export const exportDatabase = async (req, res) => {
  try {
    const user = req.user;
    if (user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Unauthorized to export database." });
    }
    await exportService.generateAndEmailDatabaseBackup(process.env.EMAIL_USER);
    res.status(200).json({ success: true, message: "Database compiled and emailed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
