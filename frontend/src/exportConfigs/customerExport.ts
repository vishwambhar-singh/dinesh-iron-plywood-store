import { Customer } from "@/types/customer";

export interface CustomerExportData extends Customer {
  totalAmount: number;
  amountPaid: number;
  balance: number;
}

export const transformCustomerData = (customers: CustomerExportData[]) => {
  return customers.map((c) => ({
    Name: c.name,
    Email: c.email || "N/A",
    Mobile: c.mobile,
    "GST Number": c.gstNumber || "N/A",
    Address: c.address || "N/A",
    "Total Amount": c.totalAmount,
    "Amount Paid": c.amountPaid,
    Balance: c.balance,
  }));
};
