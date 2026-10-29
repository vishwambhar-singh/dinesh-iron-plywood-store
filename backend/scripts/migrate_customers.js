import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

async function runMigration() {
  console.log("Starting Migration...");
  try {
    // 1. Recreate Customers table
    await db.query(`DROP TABLE IF EXISTS customers`);
    await db.query(`
      CREATE TABLE customers (
        id varchar(50) NOT NULL PRIMARY KEY,
        name varchar(100) NOT NULL,
        email varchar(100) DEFAULT NULL,
        mobile varchar(30) DEFAULT NULL,
        address text,
        gstNumber varchar(20) DEFAULT NULL,
        opening_balance decimal(15,2) DEFAULT 0.00,
        needs_review tinyint(1) DEFAULT 0,
        created_by varchar(50) DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY mobile (mobile)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log("Recreated customers table.");

    // 2. Add customer_id columns safely
    try {
      await db.query(`ALTER TABLE sales ADD COLUMN customer_id VARCHAR(50) DEFAULT NULL;`);
      console.log("Added customer_id to sales");
    } catch(e) { if(e.errno !== 1060) throw e; } // ignore Duplicate Column 1060
    
    try {
      await db.query(`ALTER TABLE returns ADD COLUMN customer_id VARCHAR(50) DEFAULT NULL;`);
      console.log("Added customer_id to returns");
    } catch(e) { if(e.errno !== 1060) throw e; } 

    // 3. Fetch historic sales
    const [sales] = await db.query(`SELECT id, customer_name, customer_mobile, customer_email, customer_address, gst_number FROM sales`);
    
    let dummyCounter = 1;

    for (const sale of sales) {
      // 4. Identify properties safely
      let name = sale.customer_name?.trim() || "Unknown Customer";
      let mobile = sale.customer_mobile?.trim();
      let email = sale.customer_email?.trim() || "";
      let address = sale.customer_address?.trim() || "";
      let gst = sale.gst_number || "";
      
      let needsReview = 0;
      if (!mobile || mobile === "") {
        mobile = `DUMMY_${dummyCounter.toString().padStart(6, '0')}`;
        needsReview = 1;
        dummyCounter++;
      }
      
      // 5. Does this exact mobile exist?
      const [existing] = await db.query(`SELECT id FROM customers WHERE mobile = ?`, [mobile]);
      let customerId;

      if (existing.length === 0) {
        customerId = uuidv4();
        await db.query(
          `INSERT INTO customers (id, name, email, mobile, address, gstNumber, needs_review) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [customerId, name, email, mobile, address, gst, needsReview]
        );
      } else {
        customerId = existing[0].id;
      }

      // 6. Link sale
      await db.query(`UPDATE sales SET customer_id = ? WHERE id = ?`, [customerId, sale.id]);
    }
    
    // 7. Update return tables similarly based on original_sale_id
    await db.query(`
      UPDATE returns r
      JOIN sales s ON r.original_sale_id = s.id
      SET r.customer_id = s.customer_id
    `);
    console.log("Updated returns with customer IDs");

    // 8. Update internal_ledgers (which act as customer ledgers) by joining with sales on bill_id
    await db.query(`
      UPDATE internal_ledgers il
      JOIN sales s ON il.bill_id = s.id
      SET il.entity_id = s.customer_id
      WHERE il.entity_type = 'CUSTOMER'
    `);
    console.log("Updated internal_ledgers with customer IDs");

    console.log("Data migration finished safely!");
    process.exit(0);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
