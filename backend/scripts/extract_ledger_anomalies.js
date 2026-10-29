import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function extractLedgerAnomalies() {
  try {
    console.log("Analyzing live database for customer ledger anomalies...");

    const report = {
      summary: {
        totalAnomalies: 0,
      },
      diagnostics: []
    };

    // 1. Sales where customer_id is NULL or empty string
    const [nullCustomerSales] = await db.query(`
      SELECT id as sale_id, invoice_number, customer_name, customer_mobile, sale_date, total_amount, balance
      FROM sales 
      WHERE customer_id IS NULL OR customer_id = ''
    `);
    
    for (const sale of nullCustomerSales) {
      // Check if we can find a matching customer by mobile
      const [matches] = await db.query(`SELECT id, name FROM customers WHERE mobile = ? AND mobile != '' LIMIT 1`, [sale.customer_mobile]);
      
      const recommendation = matches.length > 0 
        ? `A customer profile exists for mobile ${sale.customer_mobile} (ID: ${matches[0].id}). Action: Update this sale's customer_id to ${matches[0].id}.`
        : `No matching customer profile found. Action: Create a new customer profile for '${sale.customer_name}' (${sale.customer_mobile}) and link this sale to it.`;

      report.diagnostics.push({
        type: "NULL_CUSTOMER_ID",
        description: `Sale ${sale.invoice_number} has no linked customer profile.`,
        data: sale,
        recommendedAction: recommendation
      });
    }

    // 2. Orphaned Sales (Customer ID doesn't exist in customers table)
    const [orphanedSales] = await db.query(`
      SELECT id as sale_id, invoice_number, customer_name, customer_mobile, sale_date, total_amount, balance, customer_id
      FROM sales 
      WHERE customer_id IS NOT NULL 
        AND customer_id != '' 
        AND customer_id NOT IN (SELECT id FROM customers)
    `);

    for (const sale of orphanedSales) {
      const [matches] = await db.query(`SELECT id, name FROM customers WHERE mobile = ? AND mobile != '' LIMIT 1`, [sale.customer_mobile]);
      
      const recommendation = matches.length > 0 
        ? `The original profile (${sale.customer_id}) was likely deleted. A profile exists for mobile ${sale.customer_mobile} (ID: ${matches[0].id}). Action: Update this sale's customer_id to ${matches[0].id}.`
        : `The original profile (${sale.customer_id}) was deleted. Action: Create a new customer profile for '${sale.customer_name}' (${sale.customer_mobile}) and link this sale to it.`;

      report.diagnostics.push({
        type: "ORPHANED_SALE",
        description: `Sale ${sale.invoice_number} is linked to a deleted customer ID (${sale.customer_id}).`,
        data: sale,
        recommendedAction: recommendation
      });
    }

    // 3. Duplicate Customers (Same mobile number, different profiles)
    const [duplicateCustomers] = await db.query(`
      SELECT 
        c1.id as cust1_id, c1.name as cust1_name, c1.mobile as cust1_mobile,
        c2.id as cust2_id, c2.name as cust2_name, c2.mobile as cust2_mobile
      FROM customers c1
      JOIN customers c2 ON c1.id < c2.id AND c1.mobile = c2.mobile AND c1.mobile != ''
    `);
    
    for (const pair of duplicateCustomers) {
      const [sales1] = await db.query(`SELECT invoice_number, balance FROM sales WHERE customer_id = ?`, [pair.cust1_id]);
      const [sales2] = await db.query(`SELECT invoice_number, balance FROM sales WHERE customer_id = ?`, [pair.cust2_id]);
      
      if (sales1.length > 0 || sales2.length > 0) {
        report.diagnostics.push({
          type: "DUPLICATE_CUSTOMER_PROFILES",
          description: `Multiple profiles exist for mobile ${pair.cust1_mobile}. Sales might be split between them.`,
          data: {
            mobile: pair.cust1_mobile,
            profile1: { id: pair.cust1_id, name: pair.cust1_name, salesCount: sales1.length },
            profile2: { id: pair.cust2_id, name: pair.cust2_name, salesCount: sales2.length }
          },
          recommendedAction: `Action: Use the 'Merge Customers' feature in the UI to merge ${pair.cust1_name} and ${pair.cust2_name}. This will consolidate all their sales into one single ledger.`
        });
      }
    }

    report.summary.totalAnomalies = report.diagnostics.length;

    const outputFilePath = path.join(process.cwd(), "ledger_anomalies_report.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(report, null, 2));

    console.log(`\n--- ANALYSIS COMPLETE ---`);
    console.log(`Total Anomalies Detected: ${report.summary.totalAnomalies}`);
    console.log(`\nReport successfully saved to: ${outputFilePath}`);
    console.log(`Open the JSON file to view specific recommendations for each issue.`);

  } catch (error) {
    console.error("Error analyzing ledger anomalies:", error);
  } finally {
    process.exit(0);
  }
}

extractLedgerAnomalies();
