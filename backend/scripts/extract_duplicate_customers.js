import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractDuplicateCustomersAndSales() {
  try {
    console.log("Analyzing customer database for duplicate profiles and their pending sales...");

    // Find customers with the same name or mobile
    const [duplicates] = await db.query(`
      SELECT 
        c1.id as cust1_id, c1.name as cust1_name, c1.mobile as cust1_mobile,
        c2.id as cust2_id, c2.name as cust2_name, c2.mobile as cust2_mobile
      FROM customers c1
      JOIN customers c2 ON c1.id != c2.id 
        AND (
          LOWER(TRIM(c1.name)) = LOWER(TRIM(c2.name)) 
          OR (c1.mobile != '' AND c1.mobile = c2.mobile)
        )
      WHERE c1.id < c2.id
    `);

    console.log(`Found ${duplicates.length} potential duplicate customer pairs.`);

    const report = [];

    for (const pair of duplicates) {
      const [sales1] = await db.query(`SELECT invoice_number, total_amount, balance, sale_date FROM sales WHERE customer_id = ? AND balance > 0`, [pair.cust1_id]);
      const [sales2] = await db.query(`SELECT invoice_number, total_amount, balance, sale_date FROM sales WHERE customer_id = ? AND balance > 0`, [pair.cust2_id]);

      if (sales1.length > 0 || sales2.length > 0) {
        report.push({
          match_reason: pair.cust1_mobile === pair.cust2_mobile ? "Mobile Match" : "Name Match",
          profile_1: {
            id: pair.cust1_id,
            name: pair.cust1_name,
            mobile: pair.cust1_mobile,
            pending_sales_count: sales1.length,
            pending_sales: sales1
          },
          profile_2: {
            id: pair.cust2_id,
            name: pair.cust2_name,
            mobile: pair.cust2_mobile,
            pending_sales_count: sales2.length,
            pending_sales: sales2
          }
        });
      }
    }

    const outputFilePath = path.join(process.cwd(), "duplicate_customers_pending_sales.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(report, null, 2));

    console.log(`Extracted duplicate profiles with pending sales.`);
    console.log(`Report successfully saved to: ${outputFilePath}`);

  } catch (error) {
    console.error("Error extracting duplicates:", error);
  } finally {
    process.exit(0);
  }
}

extractDuplicateCustomersAndSales();
