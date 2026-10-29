import db from "../config/db.js";

export const fetchCompanyDetailsDB = async () => {
  const [rows] = await db.query("SELECT * FROM company_details WHERE id = 1");
  return rows;
};

export const updateCompanyDetailsDB = async (data) => {
  const query = `UPDATE company_details SET name = ?, email = ?, mobile = ?, address = ?, logo_url = ?, gst_number = ?, pan_number = ? WHERE id = 1`;
  const [result] = await db.query(query, [
    data.name,
    data.email,
    data.mobile,
    data.address,
    data.logoUrl,
    data.gstNumber,
    data.panNumber,
  ]);
  return result.affectedRows;
};

export const fetchDummyCompanyDetailsDB = async () => {
  const [rows] = await db.query(
    "SELECT * FROM dummy_company_details WHERE id = 1",
  );
  return rows;
};

export const updateDummyCompanyDetailsDB = async (data) => {
  const query = `UPDATE dummy_company_details SET name = ?, email = ?, mobile = ?, address = ? WHERE id = 1`;
  const [result] = await db.query(query, [
    data.name,
    data.email,
    data.mobile,
    data.address,
  ]);
  return result.affectedRows;
};

export const fetchAllRolePermissionsDB = async () => {
  const [rows] = await db.query(
    "SELECT role, permissions FROM role_permissions where role != 'SUPER_ADMIN'",
  );
  return rows;
};

export const fetchRolePermissionDB = async (role) => {
  const [rows] = await db.query(
    "SELECT permissions FROM role_permissions WHERE role = ? AND role != 'SUPER_ADMIN'",
    [role],
  );
  return rows;
};

export const upsertRolePermissionDB = async (role, jsonPermissions) => {
  const query = `INSERT INTO role_permissions (role, permissions) VALUES (?, ?) ON DUPLICATE KEY UPDATE permissions = ?`;
  await db.query(query, [role, jsonPermissions, jsonPermissions]);
};

export const fetchAllSettingsDB = async () => {
  const [rows] = await db.query("SELECT `key`, `value`, `group` FROM settings");
  return rows;
};

export const upsertSettingDB = async (group, key, value) => {
  const query = `
    INSERT INTO settings (\`group\`, \`key\`, \`value\`) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
    value = VALUES(value), \`group\` = VALUES(\`group\`)
  `;
  const [result] = await db.query(query, [group, key, String(value)]);
  return result.affectedRows;
};

export const getSettingValueByKeyDB = async (key) => {
  const [rows] = await db.query(
    "SELECT `value` FROM settings WHERE `key` = ?",
    [key],
  );

  if (rows.length === 0) return null;

  const value = rows[0].value;

  return value;
};
