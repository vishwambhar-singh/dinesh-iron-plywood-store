import db from './config/db.js';

async function verify() {
  const [sales] = await db.query(`SELECT id, customer_name, customer_mobile, customer_id FROM sales LIMIT 10`);
  console.log("SALES with customer_id links:");
  console.table(sales);

  const [customers] = await db.query(`SELECT id, name, mobile, needs_review, opening_balance FROM customers`);
  console.log("CUSTOMERS created:");
  console.table(customers);

  const [returns] = await db.query(`SELECT id, original_sale_id, customer_name, customer_id FROM returns LIMIT 10`);
  console.log("RETURNS with customer_id links:");
  console.table(returns);

  const [cols] = await db.query(`SHOW COLUMNS FROM customers`);
  console.log("CUSTOMERS TABLE SCHEMA:");
  console.table(cols);

  process.exit(0);
}
verify();
