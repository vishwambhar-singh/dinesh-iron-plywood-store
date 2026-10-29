import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractUnlinkedSales() {
  try {
    console.log("Fetching unlinked sales...");

    const [unlinkedSales] = await db.query(`
      SELECT 
        s.id as sale_id,
        s.invoice_number,
        s.customer_name as sale_customer_name,
        s.customer_mobile as sale_customer_mobile,
        s.sale_date,
        s.total_amount,
        s.balance as pending_balance,
        c.id as matched_customer_id,
        c.name as matched_customer_name,
        c.mobile as matched_customer_mobile
      FROM sales s
      JOIN customers c ON (
        (s.customer_mobile IS NOT NULL AND s.customer_mobile != '' AND s.customer_mobile = c.mobile)
        OR 
        ((s.customer_mobile IS NULL OR s.customer_mobile = '') AND LOWER(TRIM(s.customer_name)) = LOWER(TRIM(c.name)))
      )
      WHERE s.customer_id IS NULL OR s.customer_id = ''
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

extractUnlinkedSales();
