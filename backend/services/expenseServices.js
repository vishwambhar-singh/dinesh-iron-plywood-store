import * as repo from "../repositories/expenseRepo.js";
import { v4 as uuidv4 } from "uuid";
import { toCamelCase } from "../utils/formatter.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "./notificationServices.js";
import { emitGlobalUpdate } from "../socket.js";

export const processNewExpense = async (data, creator, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const isOfficeExpense = data.expenseType === "OFFICE";

  const expenseData = {
    id: uuidv4(),
    employeeId: isOfficeExpense ? null : data.employeeId,
    category: data.category,
    amount: data.amount,
    method: data.method,
    remarks: data.remarks || null,
    date: data.date,
    expenseType: data.expenseType,
    creator: creator,
    status: data.status || "PENDING",
  };

  await repo.createExpenseDB(expenseData);

  emitGlobalUpdate(["Expenses"]);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    if (!isOfficeExpense && data.employeeId) {
      targets.push({ target_type: "USER", target_value: data.employeeId });
    }
  }

  await processNewNotification(
    {
      type: "NEW_EXPENSE",
      title: isOfficeExpense ? "New Office Expense" : "New Employee Expense",
      message: `${expenseData.category} expense of ₹${expenseData.amount} recorded by ${user.name}. Waiting for admin approval.`,
      reference_module: "expenses",
      reference_id: expenseData.id,
    },
    targets,
  );

  return expenseData.id;
};

export const fetchAllExpenses = async () => {
  const expenses = await repo.getAllExpensesDB();
  return toCamelCase(expenses);
};

export const modifyExpense = async (id, data, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const oldExpense = await repo.getExpenseByIdDB(id);

  const updateData = {
    category: data.category || oldExpense.category,
    amount: data.amount || oldExpense.amount,
    method: data.method || oldExpense.method,
    remarks: data.remarks || oldExpense.remarks,
    date: data.date || oldExpense.date,
    status: data.status || oldExpense.status,
  };

  await repo.updateExpenseDB(id, updateData);

  emitGlobalUpdate(["Expenses"]);

  let changeMessage = `${user.name} (${user.role}) updated the expense.`;

  if (data.status && oldExpense.status !== data.status) {
    changeMessage = `${user.name} changed status from ${oldExpense.status} to ${data.status}.`;
  } else {
    if (Number(oldExpense.amount) !== Number(data.amount)) {
      changeMessage += ` Amount changed from ₹${oldExpense.amount} to ₹${data.amount}.`;
    }
    if (oldExpense.category !== data.category) {
      changeMessage += ` Category changed from ${oldExpense.category} to ${data.category}.`;
    }
  }

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });

    const empId = data.employeeId || oldExpense.employeeId;
    if (empId) {
      targets.push({ target_type: "USER", target_value: empId });
    }
  }

  await processNewNotification(
    {
      type: "EXPENSE_UPDATED",
      title: data.status ? "Expense Status Updated" : "Expense Modified",
      message: changeMessage,
      reference_module: "expenses",
      reference_id: id,
    },
    targets,
  );
};

export const removeExpense = async (id, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const expenseDetails = await repo.getExpenseByIdDB(id);

  if (!expenseDetails) {
    throw new Error("Expense not found");
  }

  await repo.deleteExpenseDB(id);
  await removeRelatedNotifications(id, "expenses");

  emitGlobalUpdate(["Expenses"]);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "EXPENSE_DELETED",
      title: "Expense Deleted",
      message: `Expense of ₹${expenseDetails.amount} (${expenseDetails.category}) deleted by ${user.name} (${user.role}).`,
      reference_module: "expenses",
      reference_id: id,
    },
    targets,
  );
};
