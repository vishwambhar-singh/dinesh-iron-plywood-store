import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/referenceRepo.js";
import { toCamelCase } from "../utils/formatter.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "../services/notificationServices.js";
import { emitGlobalUpdate } from "../socket.js";

export const getFormattedReferences = async () => {
  const references = await repo.fetchAllReferencesDB();
  return toCamelCase(references);
};

export const createNewReference = async (data, creator, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const id = uuidv4();

  const referenceData = {
    id,
    referenceNumber: data.referenceNumber,
    name: data.name,
    email: data.email || null,
    mobile: data.mobile,
    address: data.address || null,
    points: data.points || 0,
    redeemedPoints: data.redeemedPoints || 0,
    status: data.status || "Active",
    remarks: data.remarks || null,
    creator,
  };

  await repo.insertReferenceDB(referenceData);

  emitGlobalUpdate(["References"]);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_REFERENCE",
      title: "New Reference Added",
      message: `${referenceData.name} has been added as a new reference by ${user.name} (${user.role}).`,
      reference_module: "references",
      reference_id: id,
    },
    targets,
  );

  return id;
};

export const modifyReference = async (id, data, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const oldRef = await repo.getReferenceByIdDB(id);
  if (!oldRef) throw new Error("REFERENCE_NOT_FOUND");

  const updateData = {
    name: data.name,
    email: data.email || null,
    mobile: data.mobile,
    address: data.address || null,
    points: data.points || 0,
    redeemedPoints: data.redeemedPoints || 0,
    status: data.status || "Active",
    remarks: data.remarks || null,
  };

  await repo.updateReferenceDB(id, updateData);

  emitGlobalUpdate(["References"]);

  let changes = [];
  if (oldRef.name !== updateData.name) {
    changes.push(`Name: ${oldRef.name} -> ${updateData.name}`);
  }
  if (oldRef.status !== updateData.status) {
    changes.push(`Status: ${oldRef.status} -> ${updateData.status}`);
  }
  if (oldRef.mobile !== updateData.mobile) {
    changes.push(`Mobile: ${oldRef.mobile} -> ${updateData.mobile}`);
  }

  if (changes.length > 0) {
    let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "REFERENCE_UPDATED",
        title: "Reference Modified",
        message: `${user.name} (${user.role}) updated ${oldRef.name}. Changes: ${changes.join(", ")}`,
        reference_module: "references",
        reference_id: id,
      },
      targets,
    );
  }
};

export const removeReference = async (id, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const oldRef = await repo.getReferenceByIdDB(id);
  if (!oldRef) throw new Error("REFERENCE_NOT_FOUND");

  await repo.deleteReferenceDB(id);
  await removeRelatedNotifications(id, "references");

  emitGlobalUpdate(["References"]);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "REFERENCE_DELETED",
      title: "Reference Deleted",
      message: `Reference profile of ${oldRef.name} was deleted by ${user.name} (${user.role}).`,
      reference_module: "references",
      reference_id: id,
    },
    targets,
  );
};
