import * as repo from "../repositories/settingRepo.js";
import * as salesServices from "./salesServices.js";
import * as supplierServices from "./supplierServices.js";
import {
  processNewNotification,
  sendSystemEmail,
} from "./notificationServices.js";
import * as userRepo from "../repositories/employeeRepo.js";

export const runDailyPaymentChecks = async () => {
  const internalAdmin = { role: "SUPER_ADMIN" };

  const cDays = Number(
    (await repo.getSettingValueByKeyDB("customer_credit_days")) || 0,
  );
  const sDays = Number(
    (await repo.getSettingValueByKeyDB("supplier_credit_days")) || 0,
  );

  const allSales = await salesServices.getFormattedSales(internalAdmin);
  const allSuppliers =
    await supplierServices.fetchAllSuppliersFormatted(internalAdmin);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const superAdmins = await userRepo.getEmployeesByRoleDB("SUPER_ADMIN");
  const admins = await userRepo.getEmployeesByRoleDB("ADMIN");

  if (allSales?.length) {
    for (const sale of allSales) {
      if (Number(sale.balance) <= 0) continue;

      const createdAt = new Date(sale.saleDate);
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + cDays);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 5) {
        const isFinal = diffDays === 0;
        const title = isFinal ? "Final Due Today" : "Upcoming Payment";
        const message = isFinal
          ? `Invoice ${sale.invoiceNumber} for ${sale.customerName} is due today. Balance: ₹${sale.balance}`
          : `Invoice ${sale.invoiceNumber} for ${sale.customerName} is due in ${diffDays} days. Balance: ₹${sale.balance}`;

        const targets = [{ target_type: "ROLE", target_value: "SUPER_ADMIN" }];
        const emailTargets = [...superAdmins.map((u) => u.email)];

        if (sale.saleType === "PAKKA") {
          targets.push({ target_type: "ROLE", target_value: "ADMIN" });
          emailTargets.push(...admins.map((u) => u.email));
        }

        await processNewNotification(
          {
            type: isFinal ? "PAYMENT_DUE_TODAY" : "PAYMENT_REMINDER",
            title,
            message,
            reference_module: "sales",
            reference_id: sale.id,
          },
          targets,
        );

        await sendSystemEmail(title, message, emailTargets);
      }
    }
  }

  if (allSuppliers?.length) {
    for (const supplier of allSuppliers) {
      if (!supplier.bills?.length) continue;

      for (const bill of supplier.bills) {
        if (Number(bill.balanceAmount) <= 0) continue;

        const billDate = new Date(bill.billDate);
        const dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + sDays);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 5) {
          const isFinal = diffDays === 0;
          const title = isFinal ? "Final Due Today" : "Upcoming Payment";
          const message = isFinal
            ? `Bill ${bill.billNumber} for ${supplier.name} is due today. Balance: ₹${bill.balanceAmount}`
            : `Bill ${bill.billNumber} for ${supplier.name} is due in ${diffDays} days. Balance: ₹${bill.balanceAmount}`;

          const targets = [
            { target_type: "ROLE", target_value: "SUPER_ADMIN" },
          ];
          const emailTargets = [...superAdmins.map((u) => u.email)];

          const relatedOrder = supplier.orders?.find((o) => o.id === bill.poId);

          if (relatedOrder?.orderType === "PAKKA") {
            targets.push({ target_type: "ROLE", target_value: "ADMIN" });
            emailTargets.push(...admins.map((u) => u.email));
          }

          await processNewNotification(
            {
              type: isFinal ? "PAYMENT_DUE_TODAY" : "PAYMENT_REMINDER",
              title,
              message,
              reference_module: "suppliers",
              reference_id: supplier.id,
            },
            targets,
          );

          await sendSystemEmail(title, message, emailTargets);
        }
      }
    }
  }
};
