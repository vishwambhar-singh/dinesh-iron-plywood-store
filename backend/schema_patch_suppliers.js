import db from "./config/db.js";

async function runPatch() {
  const connection = await db.getConnection();
  try {
    console.log("Altering suppliers table to add opening_balance...");
    await connection.query(`
      ALTER TABLE suppliers ADD COLUMN opening_balance DECIMAL(15, 2) DEFAULT 0.00 AFTER address;
    `);
    console.log("suppliers table altered successfully.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("opening_balance column already exists.");
    } else {
      console.error("Error altering suppliers table:", err);
    }
  } finally {
    connection.release();
    process.exit(0);
  }
}

runPatch();
