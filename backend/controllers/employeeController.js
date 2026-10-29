import * as employeeService from "../services/employeeServices.js";

export const getAllEmployees = async (req, res) => {
  try {
    const data = await employeeService.getFormattedEmployees();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee records" });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const user = req.user;
    const employeeId = await employeeService.registerEmployee(req.body, user);
    res
      .status(201)
      .json({ message: "Employee created successfully", employeeId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res
      .status(400)
      .json({ message: error.message || "Failed to create employee" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await employeeService.modifyEmployee(id, req.body, user);
    res.status(200).json({ message: "Employee updated successfully" });
  } catch (error) {
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await employeeService.removeEmployee(id, user);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employeeId = req.user.id;

    await employeeService.changeEmployeePassword(
      employeeId,
      currentPassword,
      newPassword,
    );

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.message === "INVALID_CURRENT_PASSWORD") {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(500).json({ message: "Error updating password" });
  }
};

export const resetAllPasswords = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const affectedRows = await employeeService.resetAllPasswords(password, user);
    res.status(200).json({ message: `Successfully reset passwords for ${affectedRows} employees` });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ message: "Action requires Super Admin privileges" });
    }
    res.status(400).json({ message: error.message || "Error resetting passwords" });
  }
};
