import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const migrateCustomerLinks = async () => {
  try {
    console.log("Starting customer link migration...");

    // Find all sales with a mobile number but no customer_id
    const [sales] = await db.query(
      `SELECT id, customer_name, customer_mobile, customer_email, customer_address, gst_number 
       FROM sales 
       WHERE customer_id IS NULL 
       AND customer_mobile IS NOT NULL 
       AND customer_mobile != ''`
    );

    console.log(`Found ${sales.length} sales to migrate.`);

    let linkedCount = 0;
    let createdCount = 0;

    for (const sale of sales) {
      // Look up customer by mobile
      const [existingCustomers] = await db.query(
        `SELECT id FROM customers WHERE mobile = ?`,
        [sale.customer_mobile]
      );

      let customerId;

      if (existingCustomers.length > 0) {
        // Link to existing customer
        customerId = existingCustomers[0].id;
        linkedCount++;
      } else {
        // Create new customer
        customerId = uuidv4();
        await db.query(
          `INSERT INTO customers (
            id, name, email, mobile, address, gstNumber, opening_balance, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
          [
            customerId,
            sale.customer_name || "Unknown Customer",
            sale.customer_email || null,
            sale.customer_mobile,
            sale.customer_address || null,
            sale.gst_number || null,
          ]
        );
        createdCount++;
      }

      // Update the sale record
      await db.query(
        `UPDATE sales SET customer_id = ?, updated_at = NOW() WHERE id = ?`,
        [customerId, sale.id]
      );
    }

    console.log("Migration completed successfully!");
    console.log(`Total Sales Processed: ${sales.length}`);
    console.log(`Existing Customers Linked: ${linkedCount}`);
    console.log(`New Customers Created: ${createdCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateCustomerLinks();
