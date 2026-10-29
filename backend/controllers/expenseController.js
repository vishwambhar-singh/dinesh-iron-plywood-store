import * as service from "../services/expenseServices.js";

export const createExpense = async (req, res) => {
  try {
    const user = req.user;
    const creator = user?.id || "";
    const expenseId = await service.processNewExpense(req.body, creator, user);
    res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      id: expenseId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await service.fetchAllExpenses();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await service.modifyExpense(id, req.body, user);
    res
      .status(200)
      .json({ success: true, message: "Expense updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await service.removeExpense(id, user);
    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
