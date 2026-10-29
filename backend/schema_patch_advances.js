import db from "./config/db.js";

async function runPatch() {
  const connection = await db.getConnection();
  try {
    console.log("Creating salary_advances table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_advances (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        month INT NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("salary_advances table created successfully.");
  } catch (err) {
    console.error("Error creating salary_advances table:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runPatch();
