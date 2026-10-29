import db from "../config/db.js";

export const createAdvanceDB = async (advanceData) => {
  const { id, employeeId, amount, reason, month, year, status } = advanceData;

  const [result] = await db.query(
    `INSERT INTO salary_advances (id, employee_id, amount, reason, month, year, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [id, employeeId, amount, reason, month, year, status]
  );
  return result.affectedRows;
};

export const fetchAllAdvancesDB = async () => {
  const [rows] = await db.query(
    `SELECT a.*, emp.name as employeeName, emp.role as employeeRole 
     FROM salary_advances a
     JOIN employees emp ON a.employee_id = emp.id
     ORDER BY a.created_at DESC`
  );
  return rows;
};

export const fetchAdvancesByEmployeeDB = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT * FROM salary_advances WHERE employee_id = ? ORDER BY created_at DESC`,
    [employeeId]
  );
  return rows;
};

export const updateAdvanceStatusDB = async (id, status) => {
  const [result] = await db.query(
    `UPDATE salary_advances SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows;
};

export const deleteAdvanceDB = async (id) => {
  const [result] = await db.query(`DELETE FROM salary_advances WHERE id = ?`, [id]);
  return result.affectedRows;
};
