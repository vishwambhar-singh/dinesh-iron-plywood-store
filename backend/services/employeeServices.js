import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import * as repo from "../repositories/employeeRepo.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "../services/notificationServices.js";
import { emitUserAction, emitGlobalUpdate } from "../socket.js";

const saltRounds = 10;

export const getFormattedEmployees = async () => {
  const employees = await repo.fetchAllEmployees();

  return employees.map((emp) => ({
    ...emp,
    permissions:
      typeof emp.permissions === "string"
        ? JSON.parse(emp.permissions)
        : emp.permissions,
  }));
};

export const registerEmployee = async (data, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  const jsonPermissions = JSON.stringify(data.permissions || []);

  const employeeData = {
    id,
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    password: hashedPassword,
    salary: data.salary,
    role: data.role,
    permissions: jsonPermissions,
  };

  await repo.insertEmployee(employeeData);

  emitGlobalUpdate(["Employees", "Notifications"]);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_EMPLOYEE",
      title: "New Employee Onboarded",
      message: `${employeeData.name} has been registered as ${employeeData.role} by ${user.name} (${user.role}).`,
      reference_module: "employees",
      reference_id: id,
    },
    targets,
  );

  return id;
};

export const modifyEmployee = async (id, data, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const oldEmployee = await repo.getEmployeeByIdDB(id);
  if (!oldEmployee) throw new Error("EMPLOYEE_NOT_FOUND");

  const updateData = {
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    salary: data.salary,
    role: data.role,
    permissions: JSON.stringify(data.permissions || []),
  };

  if (data.password && data.password.trim() !== "") {
    updateData.password = await bcrypt.hash(data.password, saltRounds);
  }

  await repo.updateEmployeeInDB(id, updateData);

  emitGlobalUpdate(["Employees", "Notifications"]);

  let changes = [];
  if (oldEmployee.role !== updateData.role) {
    emitUserAction(id, "ROLE_UPDATED", { newRole: updateData.role });
    changes.push(`Role: ${oldEmployee.role} -> ${updateData.role}`);
  }
  if (Number(oldEmployee.salary) !== Number(updateData.salary)) {
    changes.push(`Salary: ₹${oldEmployee.salary} -> ₹${updateData.salary}`);
  }
  const oldPerms =
    typeof oldEmployee.permissions === "string"
      ? oldEmployee.permissions
      : JSON.stringify(oldEmployee.permissions);
  if (oldPerms !== updateData.permissions) {
    emitUserAction(id, "PERMISSIONS_UPDATED", {
      permissions: updateData.permissions,
    });
    changes.push(`Permissions were modified`);
  }
  if (changes.length > 0) {
    let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "EMPLOYEE_UPDATED",
        title: "Employee Profile Modified",
        message: `${user.name} (${user.role}) updated ${oldEmployee.name}'s profile. Changes: ${changes.join(", ")}`,
        reference_module: "employees",
        reference_id: id,
      },
      targets,
    );
  }
};

export const removeEmployee = async (id, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const employeeDetails = await repo.getEmployeeByIdDB(id);
  if (!employeeDetails) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const affectedRows = await repo.deleteEmployeeFromDB(id);
  if (affectedRows > 0) {
    emitUserAction(id, "FORCE_LOGOUT", {
      message: "Admin has removed your access. You are being logged out.",
    });

    await removeRelatedNotifications(id, "employees");

    emitGlobalUpdate(["Employees", "Notifications"]);

    let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }
    await processNewNotification(
      {
        type: "EMPLOYEE_DELETED",
        title: "Employee Removed",
        message: `Employee account for ${employeeDetails.name} (${employeeDetails.role}) was deleted by ${user.name} (${user.role}).`,
        reference_module: "employees",
        reference_id: id,
      },
      targets,
    );
  }
  return affectedRows;
};

export const changeEmployeePassword = async (
  id,
  currentPassword,
  newPassword,
) => {
  const dbPassword = await repo.getEmployeePasswordById(id);
  if (!dbPassword) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const isMatch = await bcrypt.compare(currentPassword, dbPassword);
  if (!isMatch) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  const affectedRows = await repo.updateEmployeePasswordDB(
    id,
    hashedNewPassword,
  );

  emitGlobalUpdate(["Employees", "Notifications"]);

  if (affectedRows === 0) {
    throw new Error("PASSWORD_UPDATE_FAILED");
  }
};

export const resetAllPasswords = async (newPassword, user) => {
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  const affectedRows = await repo.resetAllPasswordsDB(hashedNewPassword);

  emitGlobalUpdate(["Employees", "Notifications"]);

  await processNewNotification(
    {
      type: "BULK_PASSWORD_RESET",
      title: "All Employee Passwords Reset",
      message: `The super admin has reset passwords for all standard employees.`,
      reference_module: "employees",
      reference_id: "all",
    },
    [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }, { target_type: "ROLE", target_value: "ADMIN" }]
  );

  return affectedRows;
};
