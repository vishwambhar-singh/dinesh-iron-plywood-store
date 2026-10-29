import db from './config/db.js';

async function updateAdminPermissions() {
  try {
    const permissions = JSON.stringify([
      "/",
      "/suppliers",
      "/inventory",
      "/sales",
      "/billings",
      "/expenses",
      "/customers",
      "/internal-ledger",
      "/accounting",
      "/employees",
      "/references",
      "/settings"
    ]);
    
    await db.query(`UPDATE employees SET permissions = ? WHERE role = 'SUPER_ADMIN'`, [permissions]);
    console.log("Successfully updated SUPER_ADMIN permissions to include all modules.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateAdminPermissions();
