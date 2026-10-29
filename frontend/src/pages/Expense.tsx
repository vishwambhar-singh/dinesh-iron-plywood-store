import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Heading,
  Stack,
  Flex,
  Text,
  HStack,
  Icon,
  Badge,
  Tabs,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdAdd, MdOutlineDownload, MdPayments } from "react-icons/md";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseModal } from "@/components/expenses/modal/ExpenseModal";
import { HistoryModal } from "@/components/expenses/modal/HistoryModal";
import {
  useGetExpensesQuery,
  useGetEmployeesQuery,
  useAddExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import SearchBar from "@/components/ui/SearchBar";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import { EmployeeLedgerModal } from "@/components/expenses/modal/EmployeeLedgerModal";
import ExpensesSummaryCards from "@/components/expenses/ExpensesSummaryCards";
import { getISTDateString, getSafeDate } from "@/utils/dateUtils";
import { transformExpenseData } from "@/exportConfigs/expenseExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { OfficeExpenseTable } from "@/components/expenses/OfficeExpenseTable";
import { OfficeExpenseModal } from "@/components/expenses/modal/OfficeExpenseModal";
import { useSearchParams } from "react-router-dom";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";

export const Expenses = () => {
  const { exportFormat } = useSystemSettings();
  const { data: expenses = [], isLoading } = useGetExpensesQuery();
  const { data: employees = [] } = useGetEmployeesQuery();
  const [addExpense] = useAddExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const [searchQuery, setSearchQuery] = useState("");

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "add">("add");
  const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<
    "day" | "month" | "year" | "all"
  >("all");
  const [activeTab, setActiveTab] = useState<string>("employee");
  const [tempDates, setTempDates] = useState({ start: "", end: "" });
  const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const viewExpenseId = searchParams.get("viewExpense");
    const tabParam = searchParams.get("tab");

    if (viewExpenseId) {
      if (tabParam) {
        setActiveTab(tabParam);
      }

      setSelectedExpenseId(viewExpenseId);
      setModalMode("view");
      setIsExpenseOpen(true);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("viewExpense");
      newParams.delete("tab");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const displayExpenses = useMemo(() => {
    const todayStr = getISTDateString(new Date()) || "";
    const [tYear, tMonth, tDay] = todayStr.split("-");

    return expenses.filter((e: any) => {
      const expenseDateStr = getISTDateString(e.date) || "";
      const [eYear, eMonth, eDay] = expenseDateStr.split("-");

      const matchesSearch =
        e.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.remarks?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = e.expenseType === activeTab.toUpperCase();

      let matchesTime = true;

      if (timeFilter === "day") {
        matchesTime = eYear === tYear && eMonth === tMonth && eDay === tDay;
      } else if (timeFilter === "month") {
        matchesTime = eYear === tYear && eMonth === tMonth;
      } else if (timeFilter === "year") {
        matchesTime = eYear === tYear;
      }

      let matchesDate = true;

      if (appliedDates.start && appliedDates.end) {
        const sDate = getSafeDate(e.date).getTime();

        const start = getSafeDate(appliedDates.start);
        const end = getSafeDate(appliedDates.end);

        end.setHours(23, 59, 59, 999);

        matchesDate = sDate >= start.getTime() && sDate <= end.getTime();
      }

      return matchesSearch && matchesTime && matchesTab && matchesDate;
    });
  }, [expenses, searchQuery, timeFilter, activeTab, appliedDates]);

  const selectedExpense = useMemo(
    () => expenses.find((e: any) => e.id === selectedExpenseId) || null,
    [expenses, selectedExpenseId],
  );

  const selectedEmployee = useMemo(
    () => employees.find((e: any) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const handleAdd = () => {
    setModalMode("add");
    setSelectedExpenseId(null);
    setIsExpenseOpen(true);
  };

  const handleEdit = (exp: any) => {
    setModalMode("edit");
    setSelectedExpenseId(exp.id);
    setIsExpenseOpen(true);
  };

  const handleView = (exp: any) => {
    setModalMode("view");
    setSelectedExpenseId(exp.id);
    setIsExpenseOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseOpen(false);
    setSelectedExpenseId(null);
    setModalMode("add");
  };

  const handleHistoryAction = (empId: string) => {
    setSelectedEmployeeId(empId);
    const filteredHistory = expenses.filter(
      (exp: any) => exp.employeeId === empId,
    );
    setEmployeeHistory(filteredHistory);
    setIsHistoryOpen(true);
  };

  const handleNameClick = (empId: string) => {
    setSelectedEmployeeId(empId);
    setIsLedgerOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (modalMode === "edit") {
        await updateExpense({ id: selectedExpenseId, ...formData }).unwrap();
        toast.success("Expense updated successfully!");
      } else {
        await addExpense({
          ...formData,
          expenseType: activeTab.toUpperCase(),
          status: "PENDING",
        }).unwrap();
        toast.success("Expense recorded!");
      }
      setIsExpenseOpen(false);
      setSelectedExpenseId(null);
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete?.id) return;
    try {
      await deleteExpense(expenseToDelete.id).unwrap();
      toast.success("Expense deleted!");
      setExpenseToDelete(null);
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      await updateExpense({ id, status: newStatus }).unwrap();
      toast.success(`Expense ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${newStatus.toLowerCase()} expense`);
    }
  };

  const handleExportExcel = () => {
    const data = transformExpenseData(displayExpenses);
    handleExport(data, exportFormat, "Expense Report");
  };

  const handleDateSearch = () => {
    setTimeFilter("all");
    setAppliedDates({
      start: tempDates.start,
      end: tempDates.end,
    });
  };

  const handleClearDateFilter = () => {
    setTempDates({ start: "", end: "" });
    setAppliedDates({ start: "", end: "" });
  };

  return (
    <Box p={8}>
      <Stack gap={6}>
        <Flex
          justify="space-between"
          align="center"
          bg="white"
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor="brand.100"
          shadow="sm"
          mb={8}
          wrap="wrap"
          gap={4}
        >
          <HStack gap={4}>
            <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
              <Icon as={MdPayments} boxSize={6} />
            </Box>
            <Box>
              <HStack gap={2} mb={0.5}>
                <Heading
                  size="lg"
                  letterSpacing="tight"
                  color="brand.900"
                  lineHeight="short"
                >
                  Expenses
                </Heading>
                <Badge
                  colorPalette="brand"
                  variant="subtle"
                  size="sm"
                  borderRadius="md"
                >
                  Outflow
                </Badge>
              </HStack>
              <Text color="brand.500" fontSize="sm" fontWeight="medium">
                {activeTab === "employee"
                  ? "Track employee salaries, fuel, and food costs"
                  : "Manage office rent, bills, and maintenance costs"}
              </Text>
            </Box>
          </HStack>

          <Flex align="center" gap={4} wrap="wrap">
            <HStack
              bg="gray.50"
              p="1.5"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.200"
            >
              {[
                { label: "Today", value: "day" },
                { label: "Month", value: "month" },
                { label: "Year", value: "year" },
                { label: "All", value: "all" },
              ].map((btn) => (
                <Button
                  key={btn.value}
                  size="sm"
                  variant={timeFilter === btn.value ? "solid" : "ghost"}
                  colorPalette={timeFilter === btn.value ? "brand" : "gray"}
                  onClick={() => setTimeFilter(btn.value as any)}
                  borderRadius="lg"
                  px={4}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {btn.label}
                </Button>
              ))}
            </HStack>

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
              <Icon as={MdAdd} mr={1} boxSize={5} /> Add Expense
            </Button>
          </Flex>
        </Flex>

        <Box flex="1" my={4}>
          <DateRangeFilter
            startDate={tempDates.start}
            endDate={tempDates.end}
            onStartChange={(val: any) =>
              setTempDates({ ...tempDates, start: val })
            }
            onEndChange={(val: any) => setTempDates({ ...tempDates, end: val })}
            onSearch={handleDateSearch}
            onClear={handleClearDateFilter}
          />
        </Box>

        <Box>
          <ExpensesSummaryCards expenses={displayExpenses} />
        </Box>

        <Tabs.Root
          lazyMount
          value={activeTab}
          onValueChange={(e) => {
            setActiveTab(e.value);
            setSearchQuery("");
          }}
        >
          <Tabs.List bg="bg.muted" p="1" borderRadius="lg" width="300px" mb="4">
            <Tabs.Trigger value="employee" flex="1">
              Employee
            </Tabs.Trigger>
            <Tabs.Trigger value="office" flex="1">
              Office
            </Tabs.Trigger>{" "}
            <Tabs.Indicator />
          </Tabs.List>

          <HStack gap="4" width="full" mb={4}>
            <Box flex="1">
              <SearchBar
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </Box>
            <Button
              variant="outline"
              color="brand.500"
              onClick={handleExportExcel}
            >
              <MdOutlineDownload size="20px" /> Export
            </Button>
          </HStack>

          <Tabs.Content value="employee">
            <ExpenseTable
              expenses={displayExpenses}
              onView={handleView}
              onEdit={handleEdit}
              onHistory={handleHistoryAction}
              onDelete={(exp) => setExpenseToDelete(exp)}
              onNameClick={handleNameClick}
              onApprove={(id) => handleStatusChange(id, "APPROVED")}
              onReject={(id) => handleStatusChange(id, "REJECTED")}
              isLoading={isLoading}
            />
          </Tabs.Content>

          <Tabs.Content value="office">
            <OfficeExpenseTable
              expenses={displayExpenses}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(exp) => setExpenseToDelete(exp)}
              isLoading={isLoading}
              onApprove={(id) => handleStatusChange(id, "APPROVED")}
              onReject={(id) => handleStatusChange(id, "REJECTED")}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Stack>

      {activeTab === "employee" ? (
        <ExpenseModal
          isOpen={isExpenseOpen}
          onClose={closeExpenseModal}
          mode={modalMode}
          expense={selectedExpense}
          onSubmit={handleSubmit}
          employees={employees}
        />
      ) : (
        <OfficeExpenseModal
          isOpen={isExpenseOpen}
          onClose={closeExpenseModal}
          mode={modalMode}
          expense={selectedExpense}
          onSubmit={handleSubmit}
        />
      )}

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        expenses={employeeHistory}
        onViewAction={handleView}
        employee={selectedEmployee}
      />
      <EmployeeLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        employee={selectedEmployee}
        expenses={expenses}
      />
      <CustomDeleteDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Expense?"
        description={`Sure you want to delete ₹${expenseToDelete?.amount}?`}
      />
    </Box>
  );
};
