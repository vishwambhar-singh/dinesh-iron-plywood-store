import { ExpenseData } from "@/types/expenses";

export const transformExpenseData = (expenses: ExpenseData[]) => {
  return expenses.map((e) => {
    const isOffice = e.expenseType === "OFFICE";

    return {
      "Voucher Type": e.expenseType,
      "Spent On / Paid To": isOffice
        ? `Office (${e.category})`
        : e.employeeName,
      Category: e.category,
      "Transaction Type": "DEBIT (Outflow)",
      Amount: Number(e.amount),
      "Payment Method": e.method,
      Date: e.date,
      Remarks: e.remarks ?? "--",
    };
  });
};
