import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractNullCustomerSales() {
  try {
    console.log("Fetching sales where customer_id is NULL or empty...");

    const [nullSales] = await db.query(`
      SELECT 
        id, invoice_number, customer_name, customer_mobile, sale_date, total_amount, balance
      FROM sales 
      WHERE customer_id IS NULL OR customer_id = ''
    `);

    console.log(`Found ${nullSales.length} sales bills without a linked customer_id.`);

    const outputFilePath = path.join(process.cwd(), "null_customer_sales.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(nullSales, null, 2));

    console.log(`Report successfully saved to: ${outputFilePath}`);

    if (nullSales.length > 0) {
      console.log("\nSample:");
      console.table(nullSales.slice(0, 5));
    }
  } catch (error) {
    console.error("Error extracting:", error);
  } finally {
    process.exit(0);
  }
}

extractNullCustomerSales();
