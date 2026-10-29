import db from "./config/db.js";

async function runPatch() {
  const connection = await db.getConnection();
  try {
    console.log("Adding item_index to sale_items...");
    await connection.query("ALTER TABLE sale_items ADD COLUMN item_index INT NOT NULL DEFAULT 0");
    console.log("Success.");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column item_index already exists in sale_items");
    } else {
      console.error(err);
    }
  }

  try {
    console.log("Adding item_index to return_items...");
    await connection.query("ALTER TABLE return_items ADD COLUMN item_index INT NOT NULL DEFAULT 0");
    console.log("Success.");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column item_index already exists in return_items");
    } else {
      console.error(err);
    }
  }

  // Update existing data simply based on sorting by created date or by random if needed
  // No strict action needed for past data; they will just all be 0.
  console.log("Patch complete.");
  process.exit(0);
}

runPatch();
