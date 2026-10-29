import db from "../config/db.js";

const reportMigration = async () => {
  try {
    console.log("=== CUSTOMER LINK MIGRATION REPORT ===\n");

    // 1. Newly created customers (created today with 0 opening balance)
    const [newCustomers] = await db.query(
      `SELECT c.id, c.name, c.mobile, c.email, c.created_at,
              COUNT(s.id) as total_bills,
              COALESCE(SUM(s.total_amount), 0) as total_sales_amount,
              COALESCE(SUM(s.balance), 0) as pending_balance
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id
       WHERE DATE(c.created_at) = CURDATE()
       AND (c.opening_balance = 0 OR c.opening_balance IS NULL)
       GROUP BY c.id, c.name, c.mobile, c.email, c.created_at
       ORDER BY c.name ASC`
    );

    console.log(`--- NEW CUSTOMERS CREATED (${newCustomers.length}) ---`);
    console.log("S.No | Name | Mobile | Bills | Total Amount | Pending Balance");
    console.log("-".repeat(85));
    newCustomers.forEach((c, i) => {
      console.log(
        `${(i + 1).toString().padStart(4)} | ${(c.name || "N/A").padEnd(25)} | ${(c.mobile || "N/A").padEnd(12)} | ${String(c.total_bills).padStart(5)} | ₹${Number(c.total_sales_amount).toLocaleString().padStart(12)} | ₹${Number(c.pending_balance).toLocaleString().padStart(12)}`
      );
    });

    // 2. Existing customers that got linked
    const [linkedSales] = await db.query(
      `SELECT c.name, c.mobile, s.invoice_number, s.total_amount, s.balance, s.sale_date
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       WHERE DATE(s.updated_at) = CURDATE()
       AND DATE(c.created_at) < CURDATE()
       ORDER BY c.name ASC, s.sale_date DESC`
    );

    console.log(`\n--- SALES LINKED TO EXISTING CUSTOMERS (${linkedSales.length}) ---`);
    console.log("Customer | Mobile | Invoice | Amount | Balance | Sale Date");
    console.log("-".repeat(95));
    linkedSales.forEach((s) => {
      console.log(
        `${(s.name || "N/A").padEnd(25)} | ${(s.mobile || "N/A").padEnd(12)} | ${(s.invoice_number || "N/A").padEnd(15)} | ₹${Number(s.total_amount).toLocaleString().padStart(10)} | ₹${Number(s.balance).toLocaleString().padStart(10)} | ${new Date(s.sale_date).toLocaleDateString("en-IN")}`
      );
    });

    // 3. Summary
    const totalNewSales = newCustomers.reduce((sum, c) => sum + c.total_bills, 0);
    console.log("\n--- SUMMARY ---");
    console.log(`New Customers Created:        ${newCustomers.length}`);
    console.log(`Bills linked to new customers: ${totalNewSales}`);
    console.log(`Bills linked to existing:      ${linkedSales.length}`);
    console.log(`Total Bills Processed:         ${totalNewSales + linkedSales.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Report failed:", error.message);
    process.exit(1);
  }
};

reportMigration();
