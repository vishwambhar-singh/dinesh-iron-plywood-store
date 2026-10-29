import * as ledgerRepository from "../repositories/internalLedgerRepo.js";
import { toCamelCase } from "../utils/formatter.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "./notificationServices.js";
import { emitGlobalUpdate } from "../socket.js";

export const fetchLedgers = async (type) => {
  const allowedTypes = ["SUPPLIER", "CUSTOMER"];

  const filterType =
    type && allowedTypes.includes(type.toUpperCase())
      ? type.toUpperCase()
      : null;

  const data = await ledgerRepository.getLedgersWithPayments(filterType);

  return toCamelCase(data);
};

export const processPayment = async (paymentData, user) => {
  const ledger = await ledgerRepository.getLedgerByIdDB(paymentData.ledgerId);

  if (!ledger || paymentData.amount <= 0) {
    throw new Error("Invalid payment data provided");
  }

  const result = await ledgerRepository.addPaymentRecord(paymentData);
  const paymentId = result.id;

  emitGlobalUpdate(["InternalLedger"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  await processNewNotification(
    {
      type: "LEDGER_PAYMENT",
      title: "Internal Ledger Payment",
      message: `A payment of ₹${Number(paymentData.amount).toLocaleString("en-IN")} was recorded for ${ledger.name || ledger.entity_type} by ${user.name}.`,
      reference_module: "internal_ledger_payment",
      reference_id: paymentId,
    },
    targets,
  );

  return result;
};

export const removePayment = async (paymentId, ledgerId, user) => {
  if (!paymentId || !ledgerId) {
    throw new Error("Payment ID and Ledger ID are required");
  }

  const result = await ledgerRepository.deletePaymentRecord(
    paymentId,
    ledgerId,
  );

  await removeRelatedNotifications(paymentId, "internal_ledger_payment");

  emitGlobalUpdate(["InternalLedger"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  await processNewNotification(
    {
      type: "PAYMENT_DELETED",
      title: "Internal Ledger Payment Removed",
      message: `A payment entry was deleted by ${user.name}. Ledger balance has been restored.`,
      reference_module: "internal_ledger_payment",
      reference_id: paymentId,
    },
    targets,
  );

  return result;
};
