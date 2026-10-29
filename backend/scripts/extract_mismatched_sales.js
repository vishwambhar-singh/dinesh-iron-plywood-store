import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractMismatchedSales() {
  try {
    console.log("Fetching sales bills not showing up in their customer's ledger...");

    // Find sales where the sale's customer_id does NOT match the customer table's id,
    // BUT the sale's customer_mobile matches the customer table's mobile.
    // This happens if a customer was deleted and recreated (generating a new ID),
    // or if the customer_id in sales is completely orphaned or NULL.
    const [unlinkedSales] = await db.query(`
      SELECT 
        s.id as sale_id,
        s.invoice_number,
        s.customer_name as sale_customer_name,
        s.customer_mobile as sale_customer_mobile,
        s.sale_date,
        s.total_amount,
        s.balance as pending_balance,
        s.customer_id as sale_customer_id,
        c.id as matched_customer_id,
        c.name as matched_customer_name
      FROM sales s
      JOIN customers c ON (
        s.customer_mobile IS NOT NULL 
        AND s.customer_mobile != '' 
        AND s.customer_mobile = c.mobile
      )
      WHERE s.customer_id IS NULL 
         OR s.customer_id != c.id
         OR s.customer_id NOT IN (SELECT id FROM customers)
    `);

    console.log(`Found ${unlinkedSales.length} sales bills that are not linked to their respective customer profiles.`);

    const outputFilePath = path.join(process.cwd(), "unlinked_sales_report.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(unlinkedSales, null, 2));

    console.log(`Report successfully saved to: ${outputFilePath}`);

    // If there are unlinked sales, show the first few
    if (unlinkedSales.length > 0) {
      console.log("\nSample of unlinked sales:");
      console.table(unlinkedSales.slice(0, 5));
    }

  } catch (error) {
    console.error("Error extracting unlinked sales:", error);
  } finally {
    process.exit(0);
  }
}

extractMismatchedSales();
