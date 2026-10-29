import db from "./config/db.js";

async function addRole() {
  const connection = await db.getConnection();
  try {
    const role = 'EMPLOYEE';
    const permissions = JSON.stringify([]); // No extra permissions
    await connection.query("INSERT INTO role_permissions (role, permissions) VALUES (?, ?) ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)", [role, permissions]);
    console.log("Successfully added EMPLOYEE role!");
  } catch (err) {
    console.error(err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addRole();
