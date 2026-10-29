import db from "../config/db.js";

export const getSalarySummaryDB = async (month, year) => {
  const query = `
    SELECT 
      e.id as employee_id, 
      e.name as employee_name, 
      e.salary as current_base_salary,
      IFNULL(l.total_leave_days, 0) as current_total_leaves,
      IFNULL(a.total_advance, 0) as current_advance_taken,
      sr.id as record_id, 
      sr.base_salary as locked_base_salary,
      sr.total_leaves as locked_total_leaves,
      sr.leave_deduction_amount as locked_leave_deduction, 
      sr.advance_taken as locked_advance_taken,
      sr.net_payable as locked_net_payable, 
      sr.amount_paid, 
      sr.status
    FROM employees e
    LEFT JOIN (
      SELECT employee_id, SUM(days) as total_leave_days 
      FROM leaves 
      WHERE month = ? AND year = ? AND status = 'APPROVED'
      GROUP BY employee_id
    ) l ON e.id = l.employee_id
    LEFT JOIN (
      SELECT employee_id, SUM(amount) as total_advance 
      FROM salary_advances 
      WHERE month = ? AND year = ? AND status = 'APPROVED'
      GROUP BY employee_id
    ) a ON e.id = a.employee_id
    LEFT JOIN salary_records sr ON e.id = sr.employee_id AND sr.month = ? AND sr.year = ?
    WHERE e.role != 'SUPER_ADMIN' OR e.salary > 0
  `;

  const [rows] = await db.query(query, [month, year, month, year, month, year]);
  
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed here, so 0 gets last day of previous month... Wait. new Date(year, month, 0) gets last day of 'month'. E.g. new Date(2026, 3, 0) -> March 31. Correct.

  return rows.map(row => {
    // If a record exists, use the locked-in values.
    if (row.record_id) {
      return {
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        baseSalary: Number(row.locked_base_salary),
        totalLeaves: Number(row.locked_total_leaves),
        leaveDeduction: Number(row.locked_leave_deduction),
        advanceTaken: Number(row.locked_advance_taken),
        netPayable: Number(row.locked_net_payable),
        amountPaid: Number(row.amount_paid),
        status: row.status,
        recordId: row.record_id
      };
    }

    // Otherwise, dynamically calculate based on current snapshot
    const baseSalary = Number(row.current_base_salary || 0);
    const totalLeaves = Number(row.current_total_leaves);
    const advanceTaken = Number(row.current_advance_taken);
    
    // Daily wage calculation
    const dailyWage = baseSalary / daysInMonth;
    const leaveDeduction = dailyWage * totalLeaves;
    
    const netPayable = Math.max(0, baseSalary - leaveDeduction - advanceTaken);

    return {
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      baseSalary: baseSalary,
      totalLeaves: totalLeaves,
      leaveDeduction: Number(leaveDeduction.toFixed(2)),
      advanceTaken: advanceTaken,
      netPayable: Number(netPayable.toFixed(2)),
      amountPaid: 0,
      status: 'PENDING',
      recordId: null
    };
  });
};

export const getSalaryRecordDB = async (employeeId, month, year) => {
  const [rows] = await db.query(
    `SELECT * FROM salary_records WHERE employee_id = ? AND month = ? AND year = ?`,
    [employeeId, month, year]
  );
  return rows[0] || null;
};

export const insertSalaryRecordDB = async (data, connection) => {
  const query = `
    INSERT INTO salary_records 
    (id, employee_id, month, year, base_salary, total_leaves, leave_deduction_amount, advance_taken, net_payable, amount_paid, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await connection.query(query, [
    data.id, data.employeeId, data.month, data.year, data.baseSalary, data.totalLeaves, data.leaveDeduction, data.advanceTaken, data.netPayable, data.amountPaid, data.status
  ]);
};

export const updateSalaryRecordDB = async (data, connection) => {
  const query = `
    UPDATE salary_records 
    SET amount_paid = ?, status = ?
    WHERE id = ?
  `;
  await connection.query(query, [data.amountPaid, data.status, data.id]);
};
