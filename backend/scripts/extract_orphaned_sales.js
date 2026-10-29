import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractOrphanedSales() {
  try {
    console.log("Fetching orphaned sales...");

    const [orphanedSales] = await db.query(`
      SELECT 
        id, invoice_number, customer_name, customer_mobile, sale_date, total_amount, balance, customer_id
      FROM sales 
      WHERE customer_id NOT IN (SELECT id FROM customers)
    `);

    console.log(`Found ${orphanedSales.length} orphaned sales bills.`);

    const outputFilePath = path.join(process.cwd(), "orphaned_sales.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(orphanedSales, null, 2));

    console.log(`Report successfully saved to: ${outputFilePath}`);

    if (orphanedSales.length > 0) {
      console.log("\nSample:");
      console.table(orphanedSales.slice(0, 5));
    }
  } catch (error) {
    console.error("Error extracting:", error);
  } finally {
    process.exit(0);
  }
}

extractOrphanedSales();
