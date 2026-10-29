import fs from 'fs';
import db from '../config/db.js';

async function extractAffectedCustomers() {
  try {
    console.log("Analyzing database for customers affected by the double-deduction bug...");

    // 1. Get the actual pending balances from sales that have balance > 0
    const [activeSales] = await db.query(`
      SELECT customer_id, customer_name, SUM(balance) as pending_balance
      FROM sales
      WHERE balance > 0
      GROUP BY customer_id, customer_name
    `);

    // 2. Get all returns to see how much was wrongly subtracted in the dashboard
    const [allReturns] = await db.query(`
      SELECT r.total_amount, s.customer_id, s.customer_name 
      FROM returns r
      JOIN sales s ON r.original_sale_id = s.id
    `);

    // 3. Process the data to mimic the buggy frontend logic
    const affectedCustomers = [];

    activeSales.forEach(sale => {
      const customerId = sale.customer_id;
      const customerName = sale.customer_name || 'Unknown Customer';
      
      // Find all returns for this customer
      const customerReturns = allReturns.filter(r => 
        (customerId && r.customer_id === customerId) || 
        (!customerId && r.customer_name === customerName)
      );

      const totalReturnAmount = customerReturns.reduce((sum, r) => sum + Number(r.total_amount), 0);

      // If they had returns, their balance was double-deducted in the UI
      if (totalReturnAmount > 0) {
        affectedCustomers.push({
          customerId: customerId || "UNLINKED",
          customerName: customerName,
          actualPendingBalance: Number(sale.pending_balance),
          totalReturnsSubtracted: totalReturnAmount,
          wrongDashboardBalance: Number(sale.pending_balance) - totalReturnAmount
        });
      }
    });

    // 4. Output results
    if (affectedCustomers.length === 0) {
      console.log("No customers were affected by the double-deduction bug.");
    } else {
      console.log(`Found ${affectedCustomers.length} affected customer(s)!`);
      
      const fileName = 'affected_double_deducted_customers.json';
      fs.writeFileSync(fileName, JSON.stringify(affectedCustomers, null, 2));
      console.log(`\nExported detailed JSON to backend/scripts/${fileName}`);
      
      console.log("\n--- Summary of Affected Customers ---");
      console.table(affectedCustomers.map(c => ({
        "Customer Name": c.customerName,
        "Actual Owed Balance (₹)": c.actualPendingBalance.toFixed(2),
        "What Dashboard Showed (₹)": c.wrongDashboardBalance.toFixed(2),
        "Amount Wrongly Deducted (₹)": c.totalReturnsSubtracted.toFixed(2)
      })));
      
      const droppedCustomers = affectedCustomers.filter(c => c.wrongDashboardBalance <= 0);
      if (droppedCustomers.length > 0) {
        console.log(`\n⚠️ CRITICAL: ${droppedCustomers.length} of these customers had a displayed balance <= 0 and were COMPLETELY HIDDEN from the dashboard!`);
      }
    }

  } catch (error) {
    console.error("Error extracting customers:", error);
  } finally {
    process.exit(0);
  }
}

extractAffectedCustomers();
