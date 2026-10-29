import * as customerService from "../services/customerServices.js";

export const getAllCustomers = async (req, res) => {
  try {
    const data = await customerService.getFormattedCustomers();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer records" });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const user = req.user;
    const customerId = await customerService.registerCustomer(req.body, user);
    res
      .status(201)
      .json({ message: "Customer created successfully", customerId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Customer with this mobile or email already exists" });
    }
    res
      .status(400)
      .json({ message: error.message || "Failed to create customer" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await customerService.modifyCustomer(id, req.body, user);
    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await customerService.removeCustomer(id, user);
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const mergeCustomer = async (req, res) => {
  try {
    const user = req.user;
    const { winnerId, loserIds, winnerData } = req.body;
    await customerService.mergeCustomers(winnerId, loserIds, winnerData, user);
    res.status(200).json({ message: "Customers merged successfully" });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({ message: "Winner customer not found" });
    }
    res.status(400).json({ message: error.message || "Failed to merge customers" });
  }
};
