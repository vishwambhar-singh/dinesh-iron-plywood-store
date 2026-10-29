import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/advanceRepo.js";
import * as expenseRepo from "../repositories/expenseRepo.js";
import { processNewNotification, removeRelatedNotifications } from "./notificationServices.js";
import { toCamelCase } from "../utils/formatter.js";

export const requestAdvance = async (data, user) => {
  const id = uuidv4();
  const now = new Date();
  
  const advanceData = {
    id,
    employeeId: user.id,
    amount: Number(data.amount) || 0,
    reason: data.reason,
    month: data.month || (now.getMonth() + 1),
    year: data.year || now.getFullYear(),
    status: "PENDING",
  };

  await repo.createAdvanceDB(advanceData);

  // Notify Admins
  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }, { target_type: "ROLE", target_value: "ADMIN" }];
  
  await processNewNotification(
    {
      type: "NEW_ADVANCE_REQUEST",
      title: "New Salary Advance Request",
      message: `${user.name} has requested an advance of Rs. ${advanceData.amount}.`,
      reference_module: "employees",
      reference_id: advanceData.employeeId,
    },
    targets
  );

  return id;
};

export const getAdvances = async (user) => {
  let data;
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    data = await repo.fetchAllAdvancesDB();
  } else {
    data = await repo.fetchAdvancesByEmployeeDB(user.id);
  }
  return toCamelCase(data);
};

export const updateAdvanceStatus = async (id, status, user) => {
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  const affectedRows = await repo.updateAdvanceStatusDB(id, status);
  
  if (affectedRows > 0) {
    const allAdvances = await repo.fetchAllAdvancesDB();
    const targetAdvance = allAdvances.find(l => l.id === id);

    if (targetAdvance) {
      if (status === "APPROVED") {
        await expenseRepo.deleteExpenseDB(targetAdvance.id);
        await expenseRepo.createExpenseDB({
          id: targetAdvance.id,
          employeeId: targetAdvance.employee_id,
          category: "ADVANCE",
          amount: targetAdvance.amount,
          method: "CASH",
          remarks: `Salary Advance: ${targetAdvance.reason || ""}`,
          date: new Date().toISOString().split("T")[0],
          expenseType: "EMPLOYEE",
          creator: user.id,
          status: "APPROVED"
        });
      } else {
        await expenseRepo.deleteExpenseDB(targetAdvance.id);
      }

      await processNewNotification(
        {
          type: "ADVANCE_STATUS_UPDATED",
          title: "Advance Request " + status,
          message: `Your advance request for Rs. ${targetAdvance.amount} has been ${status.toLowerCase()}.`,
          reference_module: "employees",
          reference_id: targetAdvance.employee_id,
        },
        [{ target_type: "USER", target_value: targetAdvance.employee_id }]
      );
    }
  }

  return affectedRows;
};

export const removeAdvance = async (id, user) => {
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  
  await expenseRepo.deleteExpenseDB(id);
  const affectedRows = await repo.deleteAdvanceDB(id);
  return affectedRows;
};
