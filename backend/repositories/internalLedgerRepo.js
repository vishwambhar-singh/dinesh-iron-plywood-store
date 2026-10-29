import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const getLedgersWithPayments = async (type) => {
  let query = `
    SELECT 
      il.id, il.entity_type, il.entity_id, il.bill_id, 
      il.amount, il.amount_paid, il.created_at as date,
      COALESCE(s.name, c.customer_name) as name
    FROM internal_ledgers il
    LEFT JOIN suppliers s ON il.entity_type = 'SUPPLIER' AND il.entity_id = s.id
    LEFT JOIN sales c ON il.entity_type = 'CUSTOMER' AND il.bill_id = c.id
  `;

  const params = [];

  if (type) {
    query += ` WHERE il.entity_type = ?`;
    params.push(type);
  }

  query += ` ORDER BY il.created_at DESC`;

  const [ledgers] = await db.query(query, params);

  if (ledgers.length === 0) return [];

  const ledgerIds = ledgers.map((ledger) => ledger.id);

  const [payments] = await db.query(
    `SELECT id, ledger_id, payment_date, payment_mode, amount, reference_number 
     FROM internal_payments 
     WHERE ledger_id IN (?) 
     ORDER BY payment_date DESC`,
    [ledgerIds],
  );

  const paymentsMap = payments.reduce((acc, payment) => {
    if (!acc[payment.ledger_id]) {
      acc[payment.ledger_id] = [];
    }
    acc[payment.ledger_id].push(payment);
    return acc;
  }, {});

  return ledgers.map((ledger) => ({
    ...ledger,
    payments: paymentsMap[ledger.id] || [],
  }));
};

export const getLedgerByIdDB = async (id) => {
  const [ledgers] = await db.query(
    `SELECT * FROM internal_ledgers WHERE id = ?`,
    [id],
  );
  return ledgers[0];
};

export const addPaymentRecord = async (data) => {
  const { ledgerId, amount, paymentDate, paymentMode, referenceNumber } = data;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO internal_payments 
      (id, ledger_id, amount, payment_date, payment_mode, reference_number) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), ledgerId, amount, paymentDate, paymentMode, referenceNumber],
    );

    await connection.query(
      `UPDATE internal_ledgers 
       SET amount_paid = amount_paid + ? 
       WHERE id = ?`,
      [amount, ledgerId],
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deletePaymentRecord = async (paymentId, ledgerId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [payment] = await connection.query(
      "SELECT amount FROM internal_payments WHERE id = ?",
      [paymentId],
    );

    if (payment.length === 0) throw new Error("Payment record not found");
    const amountToDeduct = payment[0].amount;

    await connection.query("DELETE FROM internal_payments WHERE id = ?", [
      paymentId,
    ]);

    await connection.query(
      "UPDATE internal_ledgers SET amount_paid = amount_paid - ? WHERE id = ?",
      [amountToDeduct, ledgerId],
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
