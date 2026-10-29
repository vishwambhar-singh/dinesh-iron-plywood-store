import db from "../config/db.js";

export const fetchAllVouchers = async () => {
  const [rows] = await db.query(`
    SELECT * FROM accounting_vouchers 
    ORDER BY voucher_date DESC, created_at DESC
  `);
  return rows;
};

export const getVoucherByIdDB = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM accounting_vouchers WHERE id = ?`,
    [id],
  );
  return rows[0];
};

export const insertVoucher = async (data) => {
  await db.query(
    `INSERT INTO accounting_vouchers (
      id, bank_name, voucher_date, voucher_type, transaction_side, amount, payment_mode, reference_no, particulars, narration, created_by, related_entity_type, related_entity_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.bankName,
      data.date,
      data.voucherType,
      data.transactionSide,
      data.amount,
      data.paymentMode,
      data.referenceNo || null,
      data.particulars,
      data.narration || null,
      data.userId,
      data.relatedEntityType || 'NONE',
      data.relatedEntityId || null,
      data.status || 'PENDING'
    ],
  );
};

export const updateVoucherInDB = async (id, data) => {
  const keys = Object.keys(data);
  const queryParts = keys.map((key) => `${key} = ?`);
  const params = Object.values(data);
  params.push(id);

  const query = `UPDATE accounting_vouchers SET ${queryParts.join(", ")} WHERE id = ?`;
  const [result] = await db.query(query, params);
  return result.affectedRows;
};

export const deleteVoucherFromDB = async (id) => {
  const [result] = await db.query(
    `DELETE FROM accounting_vouchers WHERE id = ?`,
    [id],
  );
  return result.affectedRows;
};

export const approveVoucherInDB = async (id, status, userId) => {
  const [result] = await db.query(
    `UPDATE accounting_vouchers SET status = ?, approved_by = ? WHERE id = ?`,
    [status, userId, id]
  );
  return result.affectedRows;
};
