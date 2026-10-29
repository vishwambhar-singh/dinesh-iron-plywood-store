import { Sale } from "./sales";

export interface Customer {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  gstNumber: string;
  needsReview?: boolean;
  openingBalance?: number;
}
export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Customer) => void;
  customer: Customer | null;
  mode: "view" | "edit" | "add";
  allCustomers?: Customer[];
}

export interface CustomerTableProps {
  customers: Customer[];
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onHistory: (c: Customer) => void;
  onDelete: (c: Customer) => void;
  loading?: boolean;
}

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  sales: Sale[];
  customerVouchers?: any[];
  returns?: any[];
}
