import * as supplierService from "../services/supplierServices.js";

export const getAllSuppliers = async (req, res) => {
  const user = req.user;
  try {
    const data = await supplierService.fetchAllSuppliersFormatted(user);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching suppliers" });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    if (!name || !mobile)
      return res.status(400).json({ message: "Name and Mobile are required" });
    const user = req.user;
    const creator = user?.id || "";
    const id = await supplierService.createNewSupplier(req.body, creator, user);

    res.status(201).json({ message: "Supplier added successfully", id });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Supplier already exists" });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;
    const user = req.user;

    if (!id)
      return res.status(400).json({ message: "Supplier ID is required" });
    if (!name || !mobile)
      return res.status(400).json({ message: "Name and Mobile are required" });

    await supplierService.editSupplier(id, req.body, user);
    res.status(200).json({ message: "Supplier updated successfully" });
  } catch (error) {
    if (error.message === "SUPPLIER_NOT_FOUND")
      return res.status(404).json({ message: "Supplier not found" });
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Mobile number already exists" });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!id)
      return res.status(400).json({ message: "Supplier ID is required" });

    await supplierService.removeSupplier(id, user);
    res
      .status(200)
      .json({ message: "Supplier and all linked records deleted" });
  } catch (error) {
    if (error.message === "SUPPLIER_NOT_FOUND")
      return res.status(404).json({ message: "Supplier not found" });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createSupplierOrder = async (req, res) => {
  try {
    const user = req.user;
    const creator = user?.id || "";
    await supplierService.processSupplierOrder(req.body, creator, user);
    res.status(201).json({ message: "Order created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const updateSupplierOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Update data is required",
      });
    }

    const updatedOrderId = await supplierService.updateSupplierOrder(
      orderId,
      updateData,
      user,
    );

    return res.status(200).json({
      success: true,
      message: "Supplier order updated successfully",
      data: {
        orderId: updatedOrderId,
      },
    });
  } catch (error) {
    console.error("Error updating supplier order:", error);

    const statusCode = error.message === "Order not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error while updating order",
    });
  }
};

export const deleteSupplierOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    await supplierService.removeSupplierOrder(orderId, user);

    res.status(200).json({
      success: true,
      message: "Purchase Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addSupplierBill = async (req, res) => {
  try {
    const user = req.user;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Payload missing" });
    }
    const result = await supplierService.processSupplierBill(req.body, user);
    res.status(201).json({
      success: true,
      message: "Purchase bill created and inventory updated",
      billId: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const addBillPayment = async (req, res) => {
  try {
    const user = req.user;
    const creator = user?.id || "";
    await supplierService.processBillPayment(req.body, creator, user);
    res.status(201).json({ message: "Payment added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add payment" });
  }
};

export const deleteBillPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await supplierService.removeBillPayment(id, user);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    if (error.message === "PAYMENT_NOT_FOUND")
      return res.status(404).json({ message: "Payment entry not found" });
    console.log(error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
