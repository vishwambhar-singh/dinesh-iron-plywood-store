import db from "../config/db.js";
import fs from "fs";
import path from "path";

async function analyzeLedgerFixes() {
  try {
    console.log("Generating CSV Analysis Report for Client Review...");

    // 1. Fetch all broken sales (NULL ID or ID that doesn't exist in customers table)
    const [brokenSales] = await db.query(`
      SELECT 
        s.id as sale_id, 
        s.invoice_number, 
        s.customer_name, 
        s.customer_mobile, 
        s.sale_date, 
        s.total_amount, 
        s.balance,
        s.customer_id
      FROM sales s
      WHERE s.customer_id IS NULL 
         OR s.customer_id = ''
         OR s.customer_id NOT IN (SELECT id FROM customers)
    `);

    console.log(`Found ${brokenSales.length} total disconnected sales.`);

    // CSV Header
    let csvContent = "Invoice Number,Sale Date,Sale Customer Name,Sale Mobile,Total Amount,Anomaly Type,Match Confidence,Recommended Action,Matched Profile ID,Matched Profile Name\n";

    const escapeCsv = (str) => {
      if (!str) return "";
      const stringified = String(str);
      if (stringified.includes(",") || stringified.includes('"') || stringified.includes("\n")) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    for (const sale of brokenSales) {
      let anomalyType = (!sale.customer_id) ? "NULL_CUSTOMER_ID" : "ORPHANED_SALE";
      let matchConfidence = "NO_MATCH";
      let recommendedAction = `Create new profile for '${sale.customer_name}'`;
      let matchedId = "";
      let matchedName = "";

      const safeMobile = sale.customer_mobile ? sale.customer_mobile.trim() : "";
      const safeName = sale.customer_name ? sale.customer_name.trim() : "";

      if (safeMobile) {
        // Try exact mobile match
        const [mobileMatches] = await db.query(`SELECT id, name FROM customers WHERE mobile = ? LIMIT 1`, [safeMobile]);
        
        if (mobileMatches.length > 0) {
          matchConfidence = "EXACT_MOBILE";
          matchedId = mobileMatches[0].id;
          matchedName = mobileMatches[0].name;
          recommendedAction = `Link to existing profile matching mobile ${safeMobile}`;
        }
      }

      if (matchConfidence === "NO_MATCH" && safeName) {
        // Try name match (case insensitive)
        const [nameMatches] = await db.query(`SELECT id, name FROM customers WHERE LOWER(TRIM(name)) = LOWER(?)`, [safeName]);
        
        if (nameMatches.length === 1) {
          matchConfidence = "EXACT_NAME";
          matchedId = nameMatches[0].id;
          matchedName = nameMatches[0].name;
          recommendedAction = `Link to sole existing profile matching name '${safeName}'`;
        } else if (nameMatches.length > 1) {
          matchConfidence = "MULTIPLE_NAME_MATCHES";
          recommendedAction = `Review needed: Found ${nameMatches.length} existing profiles named '${safeName}'. Must pick one to link.`;
        }
      }

      const row = [
        sale.invoice_number,
        new Date(sale.sale_date).toLocaleDateString(),
        sale.customer_name,
        sale.customer_mobile,
        sale.total_amount,
        anomalyType,
        matchConfidence,
        recommendedAction,
        matchedId,
        matchedName
      ].map(escapeCsv).join(",");

      csvContent += row + "\n";
    }

    const outputFilePath = path.join(process.cwd(), "anomalies_client_report.csv");
    fs.writeFileSync(outputFilePath, csvContent);

    console.log(`\n--- ANALYSIS COMPLETE ---`);
    console.log(`Report successfully saved to: ${outputFilePath}`);
    console.log(`You can now open anomalies_client_report.csv in Microsoft Excel.`);

  } catch (error) {
    console.error("Error generating CSV report:", error);
  } finally {
    process.exit(0);
  }
}

analyzeLedgerFixes();
