import { ModalMode } from "./inventory";
export interface Employee {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  salary: number;
  role: string;
  permissions: string[];
  password?: string;
}

export interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Employee) => void;
  employee?: Employee;
  mode?: ModalMode;
}

export interface EmployeeTableProps {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isLoading: boolean;
}
