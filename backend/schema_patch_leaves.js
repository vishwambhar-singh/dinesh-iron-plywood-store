import db from "./config/db.js";

async function runPatch() {
  const connection = await db.getConnection();
  try {
    console.log("Creating leaves table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        month INT NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("Leaves table created successfully.");
  } catch (err) {
    console.error("Error creating leaves table:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runPatch();
