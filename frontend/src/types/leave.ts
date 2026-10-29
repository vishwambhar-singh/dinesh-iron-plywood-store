export interface Leave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  employeeName?: string;
  employeeRole?: string;
}
