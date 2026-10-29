import {
  MdDashboard,
  MdInventory2,
  MdShoppingCart,
  MdPeople,
  MdSettings,
  MdLocalShipping,
  MdReceiptLong,
  MdPayments,
  MdMenuBook,
  MdAccountBalanceWallet,
  MdSecurity,
  MdGroups,
} from "react-icons/md";

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: MdDashboard },
  { label: "Suppliers", to: "/suppliers", icon: MdLocalShipping },
  { label: "Customers", to: "/customers", icon: MdGroups },
  { label: "Inventory", to: "/inventory", icon: MdInventory2 },
  { label: "Sales", to: "/sales", icon: MdShoppingCart },
  { label: "Billings", to: "/billings", icon: MdReceiptLong },
  { label: "Expenses", to: "/expenses", icon: MdPayments },
  {
    label: "Internal Ledger",
    to: "/internal-ledger",
    icon: MdSecurity,
  },
  { label: "Accounting", to: "/accounting", icon: MdAccountBalanceWallet },
  { label: "Employees", to: "/employees", icon: MdPeople },
  { label: "References", to: "/references", icon: MdMenuBook },
  { label: "Settings", to: "/settings", icon: MdSettings },
];
