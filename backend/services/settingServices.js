import * as repo from "../repositories/settingRepo.js";
import { processNewNotification } from "../services/notificationServices.js";
import { toCamelCase } from "../utils/formatter.js";
import { emitGlobalUpdate } from "../socket.js";

export const getCompanyInfo = async () => {
  const rows = await repo.fetchCompanyDetailsDB();
  if (rows.length === 0) throw new Error("DETAILS_NOT_FOUND");
  return toCamelCase(rows[0]);
};

export const modifyCompanyInfo = async (data, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const oldDetailsArray = await repo.fetchCompanyDetailsDB();
  const oldDetails = oldDetailsArray[0];

  if (!oldDetails) throw new Error("RECORD_NOT_FOUND");

  await repo.updateCompanyDetailsDB(data);

  emitGlobalUpdate(["Settings", "Notifications"]);

  let changes = [];
  if (oldDetails.name !== data.name) {
    changes.push(`Name: ${oldDetails.name} -> ${data.name}`);
  }

  if (oldDetails.mobile !== data.mobile) {
    changes.push(`Contact: ${oldDetails.mobile} -> ${data.mobile}`);
  }
  if (oldDetails.email !== data.email) {
    changes.push(`Email: ${oldDetails.email} -> ${data.email}`);
  }
  if (changes.length > 0) {
    const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "COMPANY_UPDATED",
        title: "Company Profile Modified",
        message: `${user.name} (${user.role}) updated company settings. Changes: ${changes.join(", ")}`,
        reference_module: "settings",
        reference_id: "1",
      },
      targets,
    );
  }
};

export const getDummyCompanyInfo = async (user) => {
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  if (!isSuperAdmin) {
    throw new Error("UNAUTHORIZED_ACCESS");
  }
  const rows = await repo.fetchDummyCompanyDetailsDB();
  if (rows.length === 0) throw new Error("DETAILS_NOT_FOUND");
  return rows[0];
};

export const modifyDummyCompanyInfo = async (data) => {
  const affectedRows = await repo.updateDummyCompanyDetailsDB(data);

  emitGlobalUpdate(["Settings", "Notifications"]);

  if (affectedRows === 0) throw new Error("RECORD_NOT_FOUND");
};

export const getFormattedRolePermissions = async () => {
  const rows = await repo.fetchAllRolePermissionsDB();

  const formattedData = {};
  rows.forEach((row) => {
    formattedData[row.role] =
      typeof row.permissions === "string"
        ? JSON.parse(row.permissions)
        : row.permissions;
  });

  return formattedData;
};

export const getSingleRolePermission = async (role) => {
  const rows = await repo.fetchRolePermissionDB(role);
  if (rows.length === 0) throw new Error("ROLE_NOT_FOUND");

  const permissions =
    typeof rows[0].permissions === "string"
      ? JSON.parse(rows[0].permissions)
      : rows[0].permissions;

  return { role, permissions };
};

export const saveRolePermission = async (role, permissions, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const oldPermsData = await repo.fetchRolePermissionDB(role);
  const isNew = oldPermsData.length === 0;

  const jsonPermissions = JSON.stringify(permissions);
  await repo.upsertRolePermissionDB(role, jsonPermissions);

  emitGlobalUpdate(["Settings", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "ROLE_PERMISSION_CHANGE",
      title: isNew ? "New Role Created" : "Role Permissions Modified",
      message: isNew
        ? `${user.name} (${user.role}) created role '${role}' with ${permissions.length} permissions.`
        : `${user.name} (${user.role}) updated permissions for '${role}'. Total permissions: ${permissions.length}.`,
      reference_module: "settings",
      reference_id: role,
    },
    targets,
  );
};

export const getAllSettings = async () => {
  const rows = await repo.fetchAllSettingsDB();

  const settingsObject = {};
  rows.forEach((row) => {
    settingsObject[row.key] = row.value;
  });

  return settingsObject;
};

export const modifySetting = async (group, key, value, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const oldValue = await repo.getSettingValueByKeyDB(key);

  const affectedRows = await repo.upsertSettingDB(group, key, value);

  emitGlobalUpdate(["Settings", "Notifications"]);

  if (affectedRows === 0) throw new Error("SETTING_UPDATE_FAILED");

  if (oldValue !== value) {
    const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "SETTING_CHANGED",
        title: "System Setting Updated",
        message: `Setting '${key}' in group '${group}' was changed from '${oldValue || "NULL"}' to '${value}' by ${user.name} (${user.role}).`,
        reference_module: "settings",
        reference_id: key,
      },
      targets,
    );
  }

  return affectedRows;
};
