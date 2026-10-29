import db from "../config/db.js";

export const getEmployeeByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM employees WHERE email = ?", [
    email,
  ]);
  return rows.length > 0 ? rows[0] : null;
};
