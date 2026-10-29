import db from "../config/db.js";

export const createExpenseDB = async (expenseData) => {
  const {
    id,
    employeeId,
    category,
    amount,
    method,
    remarks,
    date,
    expenseType,
    creator,
    status,
  } = expenseData;
  const [result] = await db.query(
    `INSERT INTO expenses (id, employee_id, category, amount, method, remarks, date, expense_type, created_by, created_at, updated_at, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
    [
      id,
      employeeId,
      category,
      amount,
      method,
      remarks,
      date,
      expenseType,
      creator,
      status,
    ],
  );
  return result.affectedRows;
};

export const getAllExpensesDB = async () => {
  const [rows] = await db.query(
    `SELECT e.*, emp.name as employeeName, emp.role as employeeRole 
     FROM expenses e
     LEFT JOIN employees emp ON e.employee_id = emp.id
     ORDER BY e.date DESC, e.created_at DESC`,
  );
  return rows;
};

export const updateExpenseDB = async (id, updateData) => {
  const { category, amount, method, remarks, date, status } = updateData;
  const [result] = await db.query(
    `UPDATE expenses 
     SET category = ?, amount = ?, method = ?, remarks = ?, date = ?, status = ?, updated_at = NOW() 
     WHERE id = ?`,
    [category, amount, method, remarks, date, status, id],
  );
  return result.affectedRows;
};

export const deleteExpenseDB = async (id) => {
  const [result] = await db.query(`DELETE FROM expenses WHERE id = ?`, [id]);
  return result.affectedRows;
};

export const getExpenseByIdDB = async (id) => {
  const [rows] = await db.query(
    `SELECT *
     FROM expenses 
     WHERE id = ?`,
    [id],
  );
  return rows[0];
};
