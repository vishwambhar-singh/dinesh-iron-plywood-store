import db from "../config/db.js";

export const fetchAllEmployees = async () => {
  const [rows] = await db.query(`
    SELECT id, name, email, mobile, salary, role, permissions, created_at 
    FROM employees 
    where role != "SUPER_ADMIN"
    ORDER BY created_at DESC
  `);
  return rows;
};

export const getEmployeeByIdDB = async (id) => {
  const [rows] = await db.query(`SELECT * FROM employees WHERE id = ?`, [id]);
  return rows[0];
};

export const getEmployeesByRoleDB = async (role) => {
  const [rows] = await db.query(`SELECT * FROM employees WHERE role = ?`, [
    role,
  ]);
  return rows;
};

export const insertEmployee = async (data) => {
  await db.query(
    `INSERT INTO employees (
      id, name, email, mobile, password, salary, role, permissions, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      data.id,
      data.name,
      data.email,
      data.mobile,
      data.password,
      data.salary,
      data.role,
      data.permissions,
    ],
  );
};

export const updateEmployeeInDB = async (id, data) => {
  const keys = Object.keys(data);
  const queryParts = keys.map((key) => `${key} = ?`);
  const params = Object.values(data);
  params.push(id);

  const query = `UPDATE employees SET ${queryParts.join(", ")} WHERE id = ?`;
  const [result] = await db.query(query, params);
  return result.affectedRows;
};

export const deleteEmployeeFromDB = async (id) => {
  const [result] = await db.query(`DELETE FROM employees WHERE id = ?`, [id]);
  return result.affectedRows;
};

export const getEmployeePasswordById = async (id) => {
  const [rows] = await db.query("SELECT password FROM employees WHERE id = ?", [
    id,
  ]);
  return rows[0]?.password;
};

export const updateEmployeePasswordDB = async (id, hashedPassword) => {
  const [result] = await db.query(
    "UPDATE employees SET password = ? WHERE id = ?",
    [hashedPassword, id],
  );
  return result.affectedRows;
};

export const resetAllPasswordsDB = async (hashedPassword) => {
  const [result] = await db.query(
    "UPDATE employees SET password = ? WHERE role != 'SUPER_ADMIN'",
    [hashedPassword]
  );
  return result.affectedRows;
};
