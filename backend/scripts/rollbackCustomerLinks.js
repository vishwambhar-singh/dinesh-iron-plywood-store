import db from "../config/db.js";

const rollbackCustomerLinks = async () => {
  const connection = await db.getConnection();
  try {
    console.log("Starting rollback of customer link migration...\n");
    await connection.beginTransaction();

    // Step 1: Find customers created by the migration script (created in last 30 minutes, no opening balance, no manual edits)
    const [migratedCustomers] = await connection.query(
      `SELECT c.id, c.name, c.mobile, c.created_at 
       FROM customers c 
       WHERE c.created_at >= NOW() - INTERVAL 30 MINUTE
       AND (c.opening_balance = 0 OR c.opening_balance IS NULL)
       ORDER BY c.created_at DESC`
    );

    console.log(`Found ${migratedCustomers.length} customers likely created by migration script:`);
    migratedCustomers.forEach((c) => {
      console.log(`  - ${c.name} (${c.mobile}) [ID: ${c.id}]`);
    });

    // Step 2: Unlink ALL sales that were updated by the migration (updated_at within last 30 min and had no customer originally)
    const [updatedSales] = await connection.query(
      `UPDATE sales 
       SET customer_id = NULL, updated_at = updated_at 
       WHERE updated_at >= NOW() - INTERVAL 30 MINUTE`
    );

    console.log(`\nUnlinked ${updatedSales.affectedRows} sales (set customer_id back to NULL).`);

    // Step 3: Delete the auto-created customers
    if (migratedCustomers.length > 0) {
      const ids = migratedCustomers.map((c) => c.id);
      // Also clean up any vouchers referencing these customers
      await connection.query(
        `DELETE FROM vouchers WHERE related_entity_type = 'CUSTOMER' AND related_entity_id IN (?)`,
        [ids]
      );
      const [deleted] = await connection.query(
        `DELETE FROM customers WHERE id IN (?)`,
        [ids]
      );
      console.log(`Deleted ${deleted.affectedRows} auto-created customers.`);
    }

    await connection.commit();
    console.log("\n✅ Rollback completed successfully!");
    console.log("The database is back to its state before the migration script ran.");
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error("Rollback failed:", error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

rollbackCustomerLinks();
