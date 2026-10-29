import {
  Input,
  Stack,
  Grid,
  Field,
  createListCollection,
  Box,
  Text,
  Textarea,
  Flex,
  VStack,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useMemo, useEffect } from "react";
import { Button } from "../../ui/button";
import { toast } from "@/utils/toast";
import { ExpenseModalProps } from "@/types/expenses";
import { getISTDateString } from "@/utils/dateUtils";

export const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  expense,
  mode: initialMode = "add",
}: ExpenseModalProps) => {
  const [empSearch, setEmpSearch] = useState("");
  const [formData, setFormData] = useState({
    employeeId: "",
    category: "",
    amount: "",
    method: "CASH",
    remarks: "",
    date: getISTDateString(new Date()) || "",
  });
  const [currentMode, setCurrentMode] = useState(initialMode);
  const isView = currentMode === "view";

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (expense && (currentMode === "view" || currentMode === "edit")) {
      setFormData({
        employeeId: expense.employee_id || expense.employeeId,
        category: expense.category || "",
        amount: expense.amount.toString(),
        method: expense.method || "CASH",
        remarks: expense.remarks || "",
        date: getISTDateString(expense.date) || "",
      });
    } else {
      setFormData({
        employeeId: "",
        category: "",
        amount: "",
        method: "CASH",
        remarks: "",
        date: getISTDateString(new Date()) || "",
      });
    }
  }, [expense, currentMode, isOpen]);

  const selectedEmp = useMemo(
    () => employees.find((emp) => emp.id === formData.employeeId),
    [employees, formData.employeeId],
  );

  const employeeCollection = useMemo(() => {
    const filtered = (employees || []).filter((emp) => {
      const matchesRole = emp.role !== "SUPER_ADMIN";
      const matchesSearch = (emp.name || "")
        .toLowerCase()
        .includes(empSearch.toLowerCase());

      return matchesRole && matchesSearch;
    });

    return createListCollection({
      items: filtered.map((emp) => ({
        label: emp.name,
        value: emp.id,
      })),
    });
  }, [employees, empSearch]);

  const methodCollection = createListCollection({
    items: [
      { label: "Cash", value: "CASH" },
      { label: "Online / UPI", value: "ONLINE" },
      { label: "Bank Transfer", value: "BANK" },
      { label: "Card", value: "CARD" },
    ],
  });

  const categoryCollection = createListCollection({
    items: [
      { label: "Salary", value: "SALARY" },
      { label: "Fuel / Conveyance", value: "FUEL" },
      { label: "Food & Tea", value: "FOOD" },
      { label: "Others", value: "OTHERS" },
    ],
  });

  const validateExpenseData = (data: {
    employeeId: string;
    category: string;
    amount: string;
  }) => {
    const errors: string[] = [];

    if (!data.employeeId) {
      errors.push("Please select an employee");
    }

    if (!data.category) {
      errors.push("Please select an expense category");
    }

    const amountNum = Number(data.amount);
    if (!data.amount || isNaN(amountNum) || amountNum <= 0) {
      errors.push("Please enter a valid amount greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  const handleConfirm = () => {
    if (isView) {
      onClose();
      return;
    }
    const validation = validateExpenseData(formData);

    if (!validation.isValid && validation.errors[0]) {
      toast.error(validation.errors[0]);
      return;
    }

    onSubmit(
      currentMode === "edit" ? { ...formData, id: expense.id } : formData,
    );
    onClose();
  };

  return (
    <CustomModal
      title={
        currentMode === "add"
          ? "Record New Expense"
          : currentMode === "view"
            ? "Expense Details"
            : "Edit Expense"
      }
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      onConfirm={handleConfirm}
      confirmLabel={currentMode === "edit" ? "Update Expense" : "Save Expense"}
      mode={currentMode}
      onEditClick={() => {
        if (expense.status.toUpperCase() === "PENDING") {
          setCurrentMode("edit");
        } else {
          toast.error("Only pending expenses can be edited");
        }
      }}
    >
      <Stack gap={5}>
        {!formData.employeeId ? (
          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Select Employee *</Field.Label>
            <SelectRoot
              collection={employeeCollection}
              value={[formData.employeeId]}
              onValueChange={(e) =>
                e.value[0] &&
                setFormData({ ...formData, employeeId: e.value[0] })
              }
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Search employee..." />
              </SelectTrigger>
              <SelectContent portalled={false}>
                <Box p={2}>
                  <Input
                    placeholder="Type name..."
                    size="sm"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </Box>
                {employeeCollection.items.map((emp) => (
                  <SelectItem key={emp.value} item={emp}>
                    {emp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        ) : (
          <Box
            p={4}
            bg="brand.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="brand.200"
            width="full"
          >
            <Grid
              templateColumns="repeat(4, 1fr) auto"
              gap={4}
              alignContent="center"
            >
              <Stack gap={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="brand.600"
                  textTransform="uppercase"
                >
                  Name
                </Text>
                <Text fontSize="xs" fontWeight="medium" truncate>
                  {selectedEmp?.name}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="brand.600"
                  textTransform="uppercase"
                >
                  Contact
                </Text>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="medium" truncate>
                    {selectedEmp?.mobile || "N/A"}
                  </Text>
                </VStack>
              </Stack>
              <Stack gap={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="brand.600"
                  textTransform="uppercase"
                >
                  Role
                </Text>
                <Text fontSize="xs" fontWeight="medium" truncate>
                  {selectedEmp?.role}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="brand.600"
                  textTransform="uppercase"
                >
                  Salary
                </Text>
                <Text fontSize="xs" fontWeight="bold" color="brand.700">
                  ₹{selectedEmp?.salary || "0"}
                </Text>
              </Stack>
              {!isView && (
                <Flex align="center">
                  <Button
                    size="xs"
                    variant="subtle"
                    colorPalette="red"
                    onClick={() => setFormData({ ...formData, employeeId: "" })}
                  >
                    Remove
                  </Button>
                </Flex>
              )}
            </Grid>
          </Box>
        )}

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Expense Date *</Field.Label>
            <Input
              type="date"
              value={formData.date}
              readOnly={isView}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </Field.Root>

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Category *</Field.Label>
            <SelectRoot
              collection={categoryCollection}
              value={[formData.category]}
              disabled={isView}
              onValueChange={(e) =>
                e.value[0] && setFormData({ ...formData, category: e.value[0] })
              }
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryCollection.items.map((c) => (
                  <SelectItem key={c.value} item={c}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Amount (₹) *</Field.Label>
            <Input
              type="number"
              placeholder="0.00"
              readOnly={isView}
              value={formData.amount === "0" ? "" : formData.amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0)
                  setFormData({ ...formData, amount: val });
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onKeyDown={(e) =>
                ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
              }
            />
          </Field.Root>

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Payment Method *</Field.Label>
            <SelectRoot
              collection={methodCollection}
              value={[formData.method]}
              disabled={isView}
              onValueChange={(e) =>
                e.value[0] && setFormData({ ...formData, method: e.value[0] })
              }
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {methodCollection.items.map((m) => (
                  <SelectItem key={m.value} item={m}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        </Grid>

        <Field.Root disabled={isView}>
          <Field.Label fontWeight="bold">Remarks</Field.Label>
          <Textarea
            placeholder="Description..."
            readOnly={isView}
            value={formData.remarks}
            onChange={(e) =>
              setFormData({ ...formData, remarks: e.target.value })
            }
            rows={3}
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
