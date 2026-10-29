import * as ledgerService from "../services/internalLedgerServices.js";

export const getInternalLedgers = async (req, res) => {
  try {
    const { type } = req.query;

    const data = await ledgerService.fetchLedgers(type);

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch internal ledgers",
      error: error.message,
    });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const user = req.user;
    const result = await ledgerService.processPayment(req.body, user);
    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { ledgerId } = req.query;

    await ledgerService.removePayment(paymentId, ledgerId, req.user);

    res.status(200).json({
      success: true,
      message: "Payment deleted and ledger updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
