import { getSalarySummaryDB, getSalaryRecordDB, insertSalaryRecordDB, updateSalaryRecordDB } from "../repositories/salaryRepo.js";
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import { emitGlobalUpdate } from "../socket.js";

export const getSalarySummary = async (month, year) => {
  return await getSalarySummaryDB(month, year);
};

export const paySalary = async (data, creatorId) => {
  const { employeeId, month, year, paymentAmount, paymentMethod, paymentRemarks } = data;

  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Re-fetch the summary to get exact current state
    const summaries = await getSalarySummaryDB(month, year);
    const summary = summaries.find(s => s.employeeId === employeeId);

    if (!summary) throw new Error("Employee not found for this summary");

    let recordId = summary.recordId;
    let newPaidAmount = summary.amountPaid + Number(paymentAmount);

    if (newPaidAmount > summary.netPayable) {
      throw new Error(`Cannot pay more than the net payable amount (Max allowed: ${summary.netPayable - summary.amountPaid})`);
    }

    let status = 'PARTIALLY_PAID';
    if (newPaidAmount >= summary.netPayable) {
      status = 'PAID';
    }

    if (!recordId) {
      // Create new record
      recordId = uuidv4();
      await insertSalaryRecordDB({
        id: recordId,
        employeeId,
        month,
        year,
        baseSalary: summary.baseSalary,
        totalLeaves: summary.totalLeaves,
        leaveDeduction: summary.leaveDeduction,
        advanceTaken: summary.advanceTaken,
        netPayable: summary.netPayable,
        amountPaid: newPaidAmount,
        status
      }, connection);
    } else {
      // Update existing record
      await updateSalaryRecordDB({
        id: recordId,
        amountPaid: newPaidAmount,
        status
      }, connection);
    }

    // Insert expense voucher
    const expenseId = uuidv4();
    await connection.query(
      `INSERT INTO expenses (id, employee_id, category, amount, method, remarks, date, expense_type, created_by, created_at, updated_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        expenseId,
        employeeId,
        'SALARY',
        paymentAmount,
        paymentMethod || 'CASH',
        paymentRemarks || `Salary payment for ${month}/${year}`,
        new Date().toISOString().split('T')[0], // today's date
        'EMPLOYEE',
        creatorId,
        'APPROVED'
      ]
    );

    await connection.commit();

    emitGlobalUpdate(["Employees", "Expenses"]);

    return { success: true, recordId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
