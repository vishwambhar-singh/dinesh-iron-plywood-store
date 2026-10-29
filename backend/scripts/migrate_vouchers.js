import db from '../config/db.js';

async function migrate() {
  console.log("Starting vouchers migration...");

  try {
    // 1. Add related_entity_type
    console.log("Adding related_entity_type column...");
    await db.query(`
      ALTER TABLE accounting_vouchers
      ADD COLUMN related_entity_type ENUM('CUSTOMER', 'SUPPLIER', 'BILL', 'PO', 'NONE') DEFAULT 'NONE';
    `);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column related_entity_type already exists.");
    } else {
      throw error;
    }
  }

  try {
    // 2. Add related_entity_id
    console.log("Adding related_entity_id column...");
    await db.query(`
      ALTER TABLE accounting_vouchers
      ADD COLUMN related_entity_id VARCHAR(50) DEFAULT NULL;
    `);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column related_entity_id already exists.");
    } else {
      throw error;
    }
  }

  try {
    // 3. Add status
    console.log("Adding status column...");
    await db.query(`
      ALTER TABLE accounting_vouchers
      ADD COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING';
    `);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column status already exists.");
    } else {
      throw error;
    }
  }

  try {
    // 4. Add approved_by
    console.log("Adding approved_by column...");
    await db.query(`
      ALTER TABLE accounting_vouchers
      ADD COLUMN approved_by VARCHAR(50) DEFAULT NULL;
    `);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column approved_by already exists.");
    } else {
      throw error;
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
