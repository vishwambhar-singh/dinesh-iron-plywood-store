import db from "../config/db.js";

export const createLeaveDB = async (leaveData) => {
  const {
    id,
    employeeId,
    startDate,
    endDate,
    days,
    reason,
    month,
    year,
    status,
  } = leaveData;

  const [result] = await db.query(
    `INSERT INTO leaves (id, employee_id, start_date, end_date, days, reason, month, year, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [id, employeeId, startDate, endDate, days, reason, month, year, status]
  );
  return result.affectedRows;
};

export const fetchAllLeavesDB = async () => {
  const [rows] = await db.query(
    `SELECT l.*, emp.name as employeeName, emp.role as employeeRole 
     FROM leaves l
     JOIN employees emp ON l.employee_id = emp.id
     ORDER BY l.created_at DESC`
  );
  return rows;
};

export const fetchLeavesByEmployeeDB = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC`,
    [employeeId]
  );
  return rows;
};

export const updateLeaveStatusDB = async (id, status) => {
  const [result] = await db.query(
    `UPDATE leaves SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, id]
  );
  return result.affectedRows;
};

export const deleteLeaveDB = async (id) => {
  const [result] = await db.query(`DELETE FROM leaves WHERE id = ?`, [id]);
  return result.affectedRows;
};
