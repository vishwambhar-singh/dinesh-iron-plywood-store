import {
  Box,
  HStack,
  Heading,
  Button,
  Icon,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { Text, Input } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseTrigger,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import EmployeeTable from "@/components/employee/EmployeeTable";
import { EmployeeModal } from "@/components/employee/EmployeeModal";
import { LeaveApprovalsTable } from "@/components/employee/LeaveApprovalsTable";
import { AdvanceApprovalsTable } from "@/components/employee/AdvanceApprovalsTable";
import { SalaryManagement } from "@/components/employee/SalaryManagement";
import { MdAdd, MdOutlineDownload, MdPeople } from "react-icons/md";
import { ModalMode } from "@/types/inventory";
import { Employee } from "@/types/employee";
import {
  useGetEmployeesQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useResetAllPasswordsMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import SearchBar from "@/components/ui/SearchBar";
import { transformEmployeeData } from "@/exportConfigs/employeeExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";

const EmployeePage = () => {
  const { exportFormat } = useSystemSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedEmployee, setSelectedEmployee] = useState<
    Employee | undefined
  >(undefined);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employees = [], isLoading } = useGetEmployeesQuery();
  const [addEmployee] = useAddEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeleting }] =
    useDeleteEmployeeMutation();
  const [resetAllPasswords, { isLoading: isResetting }] = useResetAllPasswordsMutation();

  const { isSuperAdmin } = useAuth();
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [globalPassword, setGlobalPassword] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: Employee) => {
      const isNotSuperAdmin = emp.role !== "SUPER_ADMIN";

      const matchesSearch =
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.mobile?.includes(searchQuery) ||
        emp.role?.toLowerCase().includes(searchQuery.toLowerCase());

      return isNotSuperAdmin && matchesSearch;
    });
  }, [employees, searchQuery]);

  const handleAdd = () => {
    setSelectedEmployee(undefined);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete.id).unwrap();
      toast.success("Employee deleted successfully");
      setEmployeeToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete employee");
    }
  };

  const handleSubmit = async (data: Employee) => {
    try {
      if (modalMode === "edit" && selectedEmployee) {
        await updateEmployee({ ...data, id: selectedEmployee.id }).unwrap();
        toast.success("Employee updated succesfully");
      } else {
        await addEmployee(data).unwrap();
        toast.success("Employee added succesfully");
      }
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
  };

  const handleExportExcel = () => {
    const data = transformEmployeeData(filteredEmployees);
    handleExport(data, exportFormat, "Employee List");
  };

  const handleResetPasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalPassword || globalPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!window.confirm("Are you sure you want to change ALL employee passwords? This will log them out immediately.")) {
      return;
    }
    
    try {
      const res = await resetAllPasswords({ password: globalPassword }).unwrap();
      toast.success(res.message || "Passwords reset successfully.");
      setIsResetModalOpen(false);
      setGlobalPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset passwords.");
    }
  };

  return (
    <Box w="full" p={6} bg="bg.canvas" minH="100vh">
      <Flex
        justify="space-between"
        align="center"
        bg="white"
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.100"
        shadow="sm"
        mb={6}
      >
        <HStack gap={4}>
          <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
            <Icon as={MdPeople} boxSize={6} />
          </Box>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Heading
                size="lg"
                letterSpacing="tight"
                color="brand.900"
                lineHeight="short"
              >
                Employee Management
              </Heading>
              <Badge
                colorPalette="brand"
                variant="subtle"
                size="sm"
                borderRadius="md"
              >
                Staff
              </Badge>
            </HStack>
            <Text color="brand.500" fontSize="sm" fontWeight="medium">
              Manage staff profiles, roles and payroll
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {isSuperAdmin && (
            <Button
              onClick={() => setIsResetModalOpen(true)}
              colorPalette="red"
              variant="outline"
              size="md"
              px={4}
              borderRadius="lg"
            >
              Reset All Passwords
            </Button>
          )}

          <Button
            onClick={handleAdd}
            colorPalette="brand"
            size="md"
            px={6}
            fontWeight="bold"
            borderRadius="lg"
            shadow="sm"
            _hover={{ transform: "translateY(-1px)", shadow: "md" }}
          >
            <Icon as={MdAdd} mr={1} boxSize={5} /> Add Employee
          </Button>
        </HStack>
      </Flex>

      <HStack gap="4" width="full" mb={4}>
        <Box flex="1">
          <SearchBar
            placeholder="Search by name, mobile, email & role..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </Box>
        <Button variant="outline" color="brand.500" onClick={handleExportExcel}>
          <MdOutlineDownload size="20px" /> Export
        </Button>
      </HStack>

      <EmployeeTable
        employees={filteredEmployees}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(emp) => setEmployeeToDelete(emp)}
      />

      <Box mt={6} mb={6}>
        <SalaryManagement />
      </Box>

      <LeaveApprovalsTable />
      <AdvanceApprovalsTable />

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        employee={selectedEmployee}
        mode={modalMode}
      />

      <CustomDeleteDialog
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Employee?"
        description={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone.`}
      />

      <DialogRoot open={isResetModalOpen} onOpenChange={(e) => setIsResetModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={handleResetPasswords}>
            <DialogHeader>
              <DialogTitle color="red.600">Global Password Override</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <Text mb={4} fontSize="sm">
                Enter the new universal password to be applied to ALL employee accounts. 
                <br /><b>Note:</b> Your SUPER_ADMIN account password will remain unchanged.
              </Text>
              <Input
                type="text"
                value={globalPassword}
                onChange={(e) => setGlobalPassword(e.target.value)}
                placeholder="Enter new 6+ char password"
                required
              />
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="ghost" mr={3}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button colorPalette="red" type="submit" loading={isResetting}>
                Reset Accounts
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default EmployeePage;
