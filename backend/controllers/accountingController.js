import * as voucherService from "../services/accountingServices.js";

export const getAllVouchers = async (req, res) => {
  try {
    const data = await voucherService.getVouchers();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching voucher records" });
  }
};

export const createVoucher = async (req, res) => {
  try {
    const user = req.user;
    const voucherId = await voucherService.createVoucher(req.body, user);
    res.status(201).json({ message: "Voucher posted successfully", voucherId });
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message || "Failed to create voucher" });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await voucherService.updateVoucher(id, req.body, user);
    res.status(200).json({ message: "Voucher updated successfully" });
  } catch (error) {
    if (error.message === "VOUCHER_NOT_FOUND") {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    await voucherService.removeVoucher(id, user);
    res.status(200).json({ message: "Voucher deleted successfully" });
  } catch (error) {
    if (error.message === "VOUCHER_NOT_FOUND") {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const approveVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // should be 'APPROVED' or 'REJECTED'
    const user = req.user;
    await voucherService.approveVoucher(id, status, user);
    res.status(200).json({ message: `Voucher ${status.toLowerCase()} successfully` });
  } catch (error) {
    if (error.message === "UNAUTHORIZED_ACTION") {
      return res.status(403).json({ message: "Only Super Admin can approve vouchers" });
    }
    if (error.message === "VOUCHER_NOT_FOUND") {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
