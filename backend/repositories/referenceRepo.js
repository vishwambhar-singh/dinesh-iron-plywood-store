import db from "../config/db.js";

export const fetchAllReferencesDB = async () => {
  const [rows] = await db.query(
    `SELECT * FROM \`references\` ORDER BY created_at DESC`,
  );
  return rows;
};

export const getReferenceByIdDB = async (id) => {
  const [rows] = await db.query(`SELECT * FROM \`references\` WHERE id = ?`, [
    id,
  ]);
  return rows[0];
};

export const insertReferenceDB = async (data) => {
  const query = `
    INSERT INTO \`references\` (
      id, reference_number, name, email, mobile, address, 
      points, redeemed_points, status, remarks, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  await db.query(query, [
    data.id,
    data.referenceNumber,
    data.name,
    data.email,
    data.mobile,
    data.address,
    data.points,
    data.redeemedPoints,
    data.status,
    data.remarks,
    data.creator,
  ]);
};

export const updateReferenceDB = async (id, data) => {
  const query = `
    UPDATE \`references\` 
    SET name = ?, email = ?, mobile = ?, address = ?, points = ?, 
        redeemed_points = ?, status = ?, remarks = ?, updated_at = NOW()
    WHERE id = ?
  `;
  const [result] = await db.query(query, [
    data.name,
    data.email,
    data.mobile,
    data.address,
    data.points,
    data.redeemedPoints,
    data.status,
    data.remarks,
    id,
  ]);
  return result.affectedRows;
};

export const deleteReferenceDB = async (id) => {
  const [result] = await db.query(`DELETE FROM \`references\` WHERE id = ?`, [
    id,
  ]);
  return result.affectedRows;
};
