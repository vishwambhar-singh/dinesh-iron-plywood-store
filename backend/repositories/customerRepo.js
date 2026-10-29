import db from "../config/db.js";

export const fetchAllCustomers = async () => {
  const [rows] = await db.query(`
    SELECT id, name, email, mobile, address, gstNumber, opening_balance, needs_review, created_at 
    FROM customers 
    ORDER BY created_at DESC
  `);
  return rows;
};

export const getCustomerByIdDB = async (id) => {
  const [rows] = await db.query(`SELECT * FROM customers WHERE id = ?`, [id]);
  return rows[0];
};

export const getCustomerByMobileDB = async (mobile) => {
  const [rows] = await db.query(`SELECT * FROM customers WHERE mobile = ?`, [mobile]);
  return rows[0];
};

export const getCustomersByNameDB = async (name) => {
  const [rows] = await db.query(`SELECT * FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`, [name]);
  return rows;
};

export const searchCustomersByPartialNameDB = async (name) => {
  const [rows] = await db.query(
    `SELECT * FROM customers WHERE LOWER(TRIM(name)) LIKE CONCAT('%', LOWER(TRIM(?)), '%') LIMIT 10`,
    [name]
  );
  return rows;
};


export const insertCustomer = async (data) => {
  await db.query(
    `INSERT INTO customers (
      id, name, email, mobile, address, gstNumber, opening_balance, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [data.id, data.name, data.email, data.mobile, data.address, data.gstNumber, data.opening_balance],
  );
};

export const updateCustomerInDB = async (id, data) => {
  const keys = Object.keys(data);
  const queryParts = keys.map((key) => `${key} = ?`);
  const params = Object.values(data);
  params.push(id);

  const query = `UPDATE customers SET ${queryParts.join(", ")} WHERE id = ?`;
  const [result] = await db.query(query, params);
  return result.affectedRows;
};

export const deleteCustomerFromDB = async (id) => {
  // Check if customer has active sales
  const [sales] = await db.query(`SELECT id FROM sales WHERE customer_id = ? LIMIT 1`, [id]);
  if (sales.length > 0) {
    throw new Error("Cannot delete customer with active sales. Please reassign or delete the sales first.");
  }

  // Check if customer has active returns
  const [returns] = await db.query(`SELECT id FROM returns WHERE customer_id = ? LIMIT 1`, [id]);
  if (returns.length > 0) {
    throw new Error("Cannot delete customer with active returns. Please reassign or delete the returns first.");
  }

  const [result] = await db.query(`DELETE FROM customers WHERE id = ?`, [id]);
  return result.affectedRows;
};

export const mergeCustomersInDB = async (winnerId, loserIds, winnerData) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Update winner's name/mobile if provided
    if (winnerData) {
      await connection.query(
        `UPDATE customers SET name = ?, mobile = ?, needs_review = 0 WHERE id = ?`,
        [winnerData.name, winnerData.mobile, winnerId]
      );
    }

    for (const loserId of loserIds) {
      // Re-route sales
      await connection.query(
        `UPDATE sales SET customer_id = ? WHERE customer_id = ?`,
        [winnerId, loserId]
      );
      // Re-route returns
      await connection.query(
        `UPDATE returns SET customer_id = ? WHERE customer_id = ?`,
        [winnerId, loserId]
      );
      // Re-route internal ledgers
      await connection.query(
        `UPDATE internal_ledgers SET entity_id = ? WHERE entity_id = ? AND entity_type = 'CUSTOMER'`,
        [winnerId, loserId]
      );
      // Delete the loser
      await connection.query(`DELETE FROM customers WHERE id = ?`, [loserId]);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
