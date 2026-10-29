import db from "../config/db.js";
import xlsx from "xlsx";
import nodemailer from "nodemailer";

export const generateAndEmailDatabaseBackup = async (targetEmail) => {
  if (!targetEmail) {
    throw new Error("No target email defined for database backup.");
  }

  // 1. Fetch all major tables with safe error handling
  const fetchTable = async (query) => {
    try {
      const [rows] = await db.query(query);
      return rows;
    } catch (err) {
      console.warn(`Export query skipped: ${err.message}`);
      return [];
    }
  };

  const inventory = await fetchTable("SELECT * FROM inventory ORDER BY created_at DESC");
  const sales = await fetchTable("SELECT * FROM sales ORDER BY sale_date DESC");
  const saleItems = await fetchTable("SELECT * FROM sale_items");
  const returns = await fetchTable("SELECT * FROM returns ORDER BY return_date DESC");
  const returnItems = await fetchTable("SELECT * FROM return_items");
  const suppliers = await fetchTable("SELECT * FROM suppliers");
  const supplierOrders = await fetchTable("SELECT * FROM supplier_orders ORDER BY created_at DESC");
  const customers = await fetchTable("SELECT * FROM customers");
  const employees = await fetchTable("SELECT * FROM employees ORDER BY created_at DESC");
  const expenses = await fetchTable("SELECT * FROM expenses ORDER BY date DESC");
  const vouchers = await fetchTable("SELECT * FROM accounting_vouchers ORDER BY created_at DESC");
  const ledgers = await fetchTable("SELECT * FROM internal_ledgers ORDER BY created_at DESC");
  const leaves = await fetchTable("SELECT * FROM leaves ORDER BY created_at DESC");
  const references = await fetchTable("SELECT * FROM `references` ORDER BY created_at DESC");

  // 2. Build workbook
  const wb = xlsx.utils.book_new();

  const addSheet = (data, name) => {
    const sheetData = data.length > 0 ? data : [{ Info: "No records found" }];
    const ws = xlsx.utils.json_to_sheet(sheetData);

    // Auto-size columns for readability
    const colWidths = Object.keys(sheetData[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...sheetData.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;

    xlsx.utils.book_append_sheet(wb, ws, name);
  };

  addSheet(inventory, "Inventory");
  addSheet(sales, "Sales");
  addSheet(saleItems, "Sale Items");
  addSheet(returns, "Returns");
  addSheet(returnItems, "Return Items");
  addSheet(suppliers, "Suppliers");
  addSheet(supplierOrders, "Supplier Orders");
  addSheet(customers, "Customers");
  addSheet(employees, "Employees");
  addSheet(expenses, "Expenses");
  addSheet(vouchers, "Vouchers");
  addSheet(ledgers, "Internal Ledger");
  if (leaves.length > 0) addSheet(leaves, "Leaves");
  if (references.length > 0) addSheet(references, "References");

  // 3. Convert to buffer
  const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  // 4. Dispatch Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const mailOptions = {
    from: `<${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: `Complete Database Backup - ${dateStr}`,
    text: "Please find the attached complete database export.",
    html: `<div style="font-family: sans-serif; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #1a202c;">📊 Database Export Successful</h2>
            <p style="color: #4a5568;">Generated on: <strong>${dateStr}</strong></p>
            <p style="color: #4a5568;">The attached Excel file contains the following sheets:</p>
            <ul style="color: #2d3748;">
              <li>Inventory (${inventory.length} records)</li>
              <li>Sales (${sales.length} records) + Sale Items (${saleItems.length})</li>
              <li>Returns (${returns.length} records) + Return Items (${returnItems.length})</li>
              <li>Suppliers (${suppliers.length}) + Orders (${supplierOrders.length})</li>
              <li>Customers (${customers.length})</li>
              <li>Employees (${employees.length})</li>
              <li>Expenses (${expenses.length})</li>
              <li>Vouchers (${vouchers.length})</li>
              <li>Internal Ledger (${ledgers.length})</li>
              <li>Leaves (${leaves.length})</li>
            </ul>
           </div>`,
    attachments: [
      {
        filename: `DB_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`,
        content: excelBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return true;
};
