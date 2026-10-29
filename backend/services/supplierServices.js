import { v4 as uuidv4 } from "uuid";
import * as repo from "../repositories/supplierRepo.js";
import { sanitizeResponse, toCamelCase } from "../utils/formatter.js";
import {
  processNewNotification,
  removeRelatedNotifications,
} from "../services/notificationServices.js";
import { emitGlobalUpdate } from "../socket.js";

export const fetchAllSuppliersFormatted = async (user) => {
  const canShowAll = user?.role === "SUPER_ADMIN";
  const { suppliers, orders, orderItems, bills, billItems, payments } =
    await repo.getSuppliersData(canShowAll);

  const suppliersWithOrders = suppliers.map((supplier) => {
    const supplierOrders = orders
      .filter((order) => order.supplier_id === supplier.id)
      .map((order) => ({
        ...order,
        items: orderItems.filter((item) => item.order_id === order.id),
      }));

    const supplierBills = bills
      .filter((b) => b.supplier_id === supplier.id)
      .map((bill) => ({
        ...bill,
        items: billItems.filter((bi) => bi.bill_id === bill.id),
        payments: payments.filter((p) => p.bill_id === bill.id),
      }));

    return {
      ...supplier,
      orders: supplierOrders,
      bills: supplierBills,
    };
  });

  const camelData = toCamelCase(suppliersWithOrders);

  return sanitizeResponse(camelData, canShowAll);
};

export const createNewSupplier = async (data, creator, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const id = uuidv4();
  const formattedData = {
    id,
    name: data.name.toLowerCase().trim(),
    email: data.email || null,
    mobile: data.mobile.trim(),
    address: data.address || null,
    openingBalance: Number(data.openingBalance) || 0,
    gstNumber: data.gstNumber || null,
    pan: data.pan || null,
    creator,
  };
  await repo.insertSupplier(formattedData);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_SUPPLIER",
      title: "New Supplier Registered",
      message: `Supplier '${data.name.toLowerCase()}' has been added by ${user.name} (${user.role}).`,
      reference_module: "suppliers",
      reference_id: id,
    },
    targets,
  );

  return id;
};

export const editSupplier = async (id, data, user) => {
  const canShowAll = user?.role === "SUPER_ADMIN";
  const oldSupplier = await repo.getSupplierByIdDB(id);

  if (!oldSupplier) throw new Error("SUPPLIER_NOT_FOUND");

  const formattedData = {
    name: data.name.toLowerCase().trim(),
    email: data.email || null,
    mobile: data.mobile.trim(),
    address: data.address || null,
    openingBalance: Number(data.openingBalance) || 0,
    gstNumber: data.gstNumber || null,
    pan: data.pan || null,
  };
  const affectedRows = await repo.updateSupplierInDB(id, formattedData);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  let changes = [];
  if (oldSupplier.name !== formattedData.name) {
    changes.push(`Name: ${oldSupplier.name} -> ${formattedData.name}`);
  }
  if (oldSupplier.mobile !== formattedData.mobile) {
    changes.push(`Mobile: ${oldSupplier.mobile} -> ${formattedData.mobile}`);
  }
  if (oldSupplier.email !== formattedData.email) {
    changes.push(
      `Email: ${oldSupplier.email || "N/A"} -> ${formattedData.email || "N/A"}`,
    );
  }
  if (changes.length > 0) {
    const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

    if (!canShowAll) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "SUPPLIER_UPDATED",
        title: "Supplier Details Modified",
        message: `${user.name} (${user.role}) updated supplier '${oldSupplier.name}'. Changes: ${changes.join(", ")}`,
        reference_module: "suppliers",
        reference_id: id,
      },
      targets,
    );
  }
  return affectedRows;
};

export const removeSupplier = async (id, user) => {
  const canShowAll = user?.role === "SUPER_ADMIN";
  const supplierDetails = await repo.getSupplierByIdDB(id);

  if (!supplierDetails) throw new Error("SUPPLIER_NOT_FOUND");

  const affectedRows = await repo.deleteSupplierFromDB(id);

  if (affectedRows > 0) {
    await removeRelatedNotifications(id, "suppliers");
    await removeRelatedNotifications(id, "orders");
    await removeRelatedNotifications(id, "bills");
    await removeRelatedNotifications(id, "payments");

    emitGlobalUpdate(["Supplier", "Notifications"]);

    const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

    if (!canShowAll) {
      targets.push({ target_type: "ROLE", target_value: "ADMIN" });
    }

    await processNewNotification(
      {
        type: "SUPPLIER_DELETED",
        title: "Supplier Removed",
        message: `Supplier '${supplierDetails.name}' and all its records deleted by ${user.name}.`,
        reference_module: "suppliers",
        reference_id: id,
      },
      targets,
    );
  }

  return affectedRows;
};

export const processSupplierOrder = async (data, creator, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";

  const orderId = uuidv4();

  const orderData = {
    ...data,
    id: orderId,
    created_by: creator,
  };

  await repo.insertSupplierOrderTx(orderData);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "NEW_SUPPLIER_ORDER",
      title: "New Purchase Order",
      message: `Purchase Order ${orderData.order_number} created by ${user.name} (${user.role}). Total: ₹${orderData.total_amount}.`,
      reference_module: "orders",
      reference_id: orderData.supplier_id,
    },
    targets,
  );

  return orderId;
};

export const updateSupplierOrder = async (orderId, data, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";

  const existingOrder = await repo.getSupplierOrderByIdDB(orderId);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const supplierId = data.supplierId || existingOrder.supplier_id;

  await repo.updateSupplierOrderTx(orderId, data);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];

  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  const orderNumber = data.orderNumber || existingOrder.order_number;
  const totalAmount = data.totalAmount || existingOrder.total_amount;

  await processNewNotification(
    {
      type: "UPDATE_SUPPLIER_ORDER",
      title: "Purchase Order Updated",
      message: `Purchase Order ${orderNumber} updated by ${user.name} (${user.role}). Total: ₹${totalAmount}.`,
      reference_module: "orders",
      reference_id: supplierId,
    },
    targets,
  );

  return orderId;
};

export const removeSupplierOrder = async (orderId, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";

  const order = await repo.getSupplierOrderByIdDB(orderId);
  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  await repo.deleteSupplierOrderTx(orderId);
  await removeRelatedNotifications(order.supplier_id, "orders");

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "DELETE_SUPPLIER_ORDER",
      title: "Purchase Order Deleted",
      message: `Purchase Order ${order.order_number} was deleted by ${user.name} ${user.role}.`,
      reference_module: "purchases",
      reference_id: order.supplier_id,
    },
    targets,
  );

  return true;
};

export const processSupplierBill = async (data, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const supplierOrder = await repo.getSupplierOrderByIdDB(data.purchaseOrderId);
  if (!supplierOrder) throw new Error("Order not found");

  const supplier = await repo.getSupplierByIdDB(data.supplierId);

  const inventoryType = supplierOrder.order_type;
  const billId = uuidv4();
  const creator = user?.id;

  const totalAmount = Number(data.totalAmount) || 0;
  const amountPaid = Number(data.amountPaid) || 0;
  const discount = Number(data.discount) || 0;
  const balance = totalAmount - discount - amountPaid;

  const billData = {
    id: billId,
    supplierId: data.supplierId,
    purchaseOrderId: data.purchaseOrderId,
    poNumber: data.orderNumber,
    poDate: data.orderDate,
    billNumber: data.billNumber,
    billDate: data.billDate,
    vehicleNumber: data.vehicleNumber,
    subtotal: Number(data.subtotal) || 0,
    totalGst: Number(data.totalGstAmount) || 0,
    freight: Number(data.freight) || 0,
    discount: discount,
    totalAmount: totalAmount,
    amountPaid: amountPaid,
    balance: balance,
    created_by: creator,
  };

  const paymentData = {
    amount: amountPaid,
    method: data.paymentMode,
    reference: data.referenceNo,
  };

  await repo.insertSupplierBillTx(
    billData,
    data.items,
    paymentData,
    inventoryType,
  );

  emitGlobalUpdate([
    "Supplier",
    "Notifications",
    "Inventory",
    "InternalLedger",
  ]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction && inventoryType === "PAKKA") {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "SUPPLIER_BILL_CREATED",
      title: "New Supplier Bill Recorded",
      message: `Bill ${billData.billNumber} of ₹${billData.totalAmount} for ${supplier.name} recorded by ${user.name}.`,
      reference_module: "bills",
      reference_id: billId,
    },
    targets,
  );

  return billId;
};

export const processBillPayment = async (data, creator, user) => {
  const isSuperAdminAction = user?.role === "SUPER_ADMIN";
  const paymentData = {
    ...data,
    paymentId: uuidv4(),
    method: data.method.toUpperCase(),
    creator,
  };

  await repo.addBillPaymentTx(paymentData);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  if (!isSuperAdminAction) {
    targets.push({ target_type: "ROLE", target_value: "ADMIN" });
  }

  await processNewNotification(
    {
      type: "SUPPLIER_PAYMENT",
      title: "Supplier Payment Recorded",
      message: `Payment of ₹${paymentData.amount} made via ${paymentData.method} by ${user.name}.`,
      reference_module: "payments",
      reference_id: paymentData.supplierId,
    },
    targets,
  );

  return paymentData.paymentId;
};

export const removeBillPayment = async (id, user) => {
  const payment = await repo.getPaymentByIdDB(id);
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  await repo.deleteBillPaymentTx(id, payment.bill_id, payment.amount);

  emitGlobalUpdate(["Supplier", "Notifications"]);

  const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
  await processNewNotification(
    {
      type: "SUPPLIER_PAYMENT_DELETED",
      title: "Payment Deleted",
      message: `${user.name} deleted payment of ₹${payment.amount} for Bill ID: ${payment.bill_id}`,
      reference_module: "payments",
      reference_id: payment.supplier_id,
    },
    targets,
  );
};
