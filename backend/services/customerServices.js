import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/customerRepo.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "../services/notificationServices.js";
import { toCamelCase } from "../utils/formatter.js";

export const getFormattedCustomers = async () => {
  const data = await repo.fetchAllCustomers();
  return toCamelCase(data);
};

export const registerCustomer = async (data, user) => {
  const id = uuidv4();
  const isSuperAdminAction = user.role === "SUPER_ADMIN";

  if (data.mobile) {
    const existing = await repo.getCustomerByMobileDB(data.mobile);
    if (existing) throw new Error("A customer with this mobile number already exists.");
  }

  const customerData = {
    id,
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    address: data.address,
    gstNumber: data.gstNumber,
    opening_balance: Number(data.openingBalance) || 0,
  };

  await repo.insertCustomer(customerData);

  let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_CUSTOMER",
      title: "New Customer Added",
      message: `Customer ${customerData.name} has been registered by ${user.name} (${user.role}).`,
      reference_module: "customers",
      reference_id: id,
    },
    targets,
  );

  return id;
};

export const modifyCustomer = async (id, data, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const oldCustomer = await repo.getCustomerByIdDB(id);
  if (!oldCustomer) throw new Error("CUSTOMER_NOT_FOUND");

  if (data.mobile) {
    const existing = await repo.getCustomerByMobileDB(data.mobile);
    if (existing && existing.id !== id) throw new Error("A customer with this mobile number already exists.");
  }

  const updateData = {
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    address: data.address,
    gstNumber: data.gstNumber,
  };
  
  if (data.openingBalance !== undefined) {
    updateData.opening_balance = Number(data.openingBalance) || 0;
  }

  await repo.updateCustomerInDB(id, updateData);

  let changes = [];
  if (oldCustomer.name !== updateData.name) changes.push("Name");
  if (oldCustomer.mobile !== updateData.mobile) changes.push("Mobile");
  if (oldCustomer.gstNumber !== updateData.gstNumber)
    changes.push("GST Number");

  if (changes.length > 0) {
    let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "CUSTOMER_UPDATED",
        title: "Customer Profile Updated",
        message: `${user.name} (${user.role}) updated details for ${oldCustomer.name}. Fields changed: ${changes.join(", ")}`,
        reference_module: "customers",
        reference_id: id,
      },
      targets,
    );
  }
};

export const removeCustomer = async (id, user) => {
  const isSuperAdminAction = user.role === "SUPER_ADMIN";
  const customerDetails = await repo.getCustomerByIdDB(id);
  if (!customerDetails) throw new Error("CUSTOMER_NOT_FOUND");

  const affectedRows = await repo.deleteCustomerFromDB(id);
  if (affectedRows > 0) {
    await removeRelatedNotifications(id, "customers");

    let targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
    if (!isSuperAdminAction) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "CUSTOMER_DELETED",
        title: "Customer Removed",
        message: `Customer ${customerDetails.name} was deleted by ${user.name} (${user.role}).`,
        reference_module: "customers",
        reference_id: id,
      },
      targets,
    );
  }
  return affectedRows;
};

export const mergeCustomers = async (winnerId, loserIds, winnerData, user) => {
  if (!winnerId || !loserIds || loserIds.length === 0) {
    throw new Error("Winner and at least one duplicate customer required");
  }
  if (loserIds.includes(winnerId)) {
    throw new Error("Winner cannot be in the list of duplicates");
  }

  const winner = await repo.getCustomerByIdDB(winnerId);
  if (!winner) throw new Error("CUSTOMER_NOT_FOUND");

  if (winnerData?.mobile) {
    const existing = await repo.getCustomerByMobileDB(winnerData.mobile);
    if (existing && existing.id !== winnerId && !loserIds.includes(existing.id)) {
      throw new Error(`Mobile number ${winnerData.mobile} is already in use by another customer (${existing.name}).`);
    }
  }

  await repo.mergeCustomersInDB(winnerId, loserIds, winnerData);

  await processNewNotification(
    {
      type: "CUSTOMER_MERGED",
      title: "Customers Merged",
      message: `${user.name} (${user.role}) merged ${loserIds.length} duplicate customer(s) into "${winnerData?.name || winner.name}".`,
      reference_module: "customers",
      reference_id: winnerId,
    },
    [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }],
  );
};
