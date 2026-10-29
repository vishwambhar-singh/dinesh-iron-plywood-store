import { Employee } from "./employee";

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: any[];
  employee: Employee | null;
  onViewAction: (expense: any) => void;
}

export interface ExpenseData {
  id: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  method: string;
  remarks: string;
  employeeId: string;
  employeeRole?: string;
  expenseType?: string;
  status: string;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  employees: Employee[];
  expense?: any;
  mode?: "view" | "edit" | "add";
}

export interface ExpenseTableProps {
  expenses: ExpenseData[];
  onView: (expense: ExpenseData) => void;
  onEdit: (expense: ExpenseData) => void;
  onHistory: (employeeId: string) => void;
  onDelete: (expense: ExpenseData) => void;
  onNameClick: (employeeId: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export interface OfficeExpenseTableProps {
  expenses: ExpenseData[];
  onView: (expense: ExpenseData) => void;
  onEdit: (expense: ExpenseData) => void;
  onDelete: (expense: ExpenseData) => void;
  isLoading?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}
