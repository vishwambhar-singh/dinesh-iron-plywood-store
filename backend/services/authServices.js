import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "../repositories/authRepo.js";

export const authenticateEmployee = async (email, password) => {
  const employee = await repo.getEmployeeByEmail(email);

  if (!employee) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password.trim(), employee.password);

  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const permissions =
    typeof employee.permissions === "string"
      ? JSON.parse(employee.permissions)
      : employee.permissions;

  const token = jwt.sign(
    {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      permissions: permissions,
      salary: employee.salary || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  return {
    token,
    user: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      permissions: permissions,
      salary: employee.salary || 0,
    },
  };
};
