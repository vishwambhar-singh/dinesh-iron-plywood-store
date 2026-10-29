import { Employee } from "@/types/employee";

export const transformEmployeeData = (employees: Employee[]) => {
  return employees.map((e) => ({
    Name: e.name,
    Email: e.email,
    Mobile: e.mobile,
    Salary: e.salary,
    Role: e.role,
  }));
};
