import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/accountingRepo.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "../services/notificationServices.js";
import { toCamelCase } from "../utils/formatter.js";
import { emitGlobalUpdate } from "../socket.js";

export const getVouchers = async () => {
  const vouchers = await repo.fetchAllVouchers();
  return toCamelCase(vouchers);
};

export const createVoucher = async (data, user) => {
  const id = uuidv4();

  const voucherData = {
    id,
    bankName: data.bankName,
    date: data.date,
    voucherType: data.voucherType,
    transactionSide: data.transactionSide,
    amount: data.amount,
    paymentMode: data.paymentMode,
    referenceNo: data.referenceNo,
    particulars: data.particulars,
    narration: data.narration,
    userId: user.id,
    relatedEntityType: data.relatedEntityType || 'NONE',
    relatedEntityId: data.relatedEntityId || null,
    status: user.role === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING'
  };

  await repo.insertVoucher(voucherData);

  emitGlobalUpdate(["Accounting"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (user.role !== "SUPER_ADMIN") {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_VOUCHER",
      title: "New Voucher Posted",
      message: `${data.voucherType} of ₹${data.amount} recorded for ${data.particulars} by ${user.name}.`,
      reference_module: "accounting",
      reference_id: id,
    },
    targets,
  );

  return id;
};

export const approveVoucher = async (id, status, user) => {
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('UNAUTHORIZED_ACTION');
  }

  const voucher = await repo.getVoucherByIdDB(id);
  if (!voucher) throw new Error("VOUCHER_NOT_FOUND");

  await repo.approveVoucherInDB(id, status, user.id);
  emitGlobalUpdate(["Accounting"]);

  await processNewNotification(
    {
      type: "VOUCHER_APPROVAL",
      title: `Voucher ${status}`,
      message: `Voucher for ${voucher.particulars} was ${status} by ${user.name}.`,
      reference_module: "accounting",
      reference_id: id,
    },
    [{ target_type: "ROLE", target_value: "ADMIN" }]
  );
};

export const updateVoucher = async (id, data, user) => {
  const oldVoucher = await repo.getVoucherByIdDB(id);
  if (!oldVoucher) throw new Error("VOUCHER_NOT_FOUND");

  const updateData = {
    voucher_date: data.date,
    bank_name: data.bankName,
    voucher_type: data.voucherType,
    transaction_side: data.transactionSide,
    amount: data.amount,
    payment_mode: data.paymentMode,
    reference_no: data.referenceNo,
    particulars: data.particulars,
    narration: data.narration,
  };

  if (data.relatedEntityType) updateData.related_entity_type = data.relatedEntityType;
  if (data.relatedEntityId) updateData.related_entity_id = data.relatedEntityId;

  await repo.updateVoucherInDB(id, updateData);

  emitGlobalUpdate(["Accounting"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (user.role !== "SUPER_ADMIN") {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }
  await processNewNotification(
    {
      type: "VOUCHER_UPDATED",
      title: "Voucher Modified",
      message: `Voucher for ${oldVoucher.particulars} was updated by ${user.name}.`,
      reference_module: "accounting",
      reference_id: id,
    },
    targets,
  );
};

export const removeVoucher = async (id, user) => {
  const voucherDetails = await repo.getVoucherByIdDB(id);
  if (!voucherDetails) throw new Error("VOUCHER_NOT_FOUND");

  const affectedRows = await repo.deleteVoucherFromDB(id);
  await removeRelatedNotifications(id, "accounting");

  emitGlobalUpdate(["Accounting"]);

  if (affectedRows > 0) {
    const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (user.role !== "SUPER_ADMIN") {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }
    await processNewNotification(
      {
        type: "VOUCHER_DELETED",
        title: "Voucher Deleted",
        message: `Voucher (ID: ${id}) for ₹${voucherDetails.amount} was deleted by ${user.name}.`,
        reference_module: "accounting",
        reference_id: id,
      },
      targets,
    );
  }
  return affectedRows;
};
