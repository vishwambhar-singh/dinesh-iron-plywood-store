import {
  Stack,
  Text,
  Box,
  Badge,
  Grid,
  Table,
  Separator,
  Center,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { CustomTable } from "@/components/ui/CustomTable";
import { Employee } from "@/types/employee";
import { getISTDateString, formatDate } from "@/utils/dateUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  expenses: any[];
}

export const EmployeeLedgerModal = ({
  isOpen,
  onClose,
  employee,
  expenses,
}: Props) => {
  const currentMonthData = useMemo(() => {
    if (!employee) return { totalPaid: 0, records: [] };

    const todayStr = getISTDateString(new Date()) || "";
    const [currentYear, currentMonth] = todayStr.split("-");

    const filtered = expenses.filter((exp) => {
      const expDateStr = getISTDateString(exp.date) || "";
      const [year, month] = expDateStr.split("-");

      return (
        exp.employeeId === employee.id &&
        (exp.category === "SALARY" || exp.category === "ADVANCE") &&
        exp.status?.toUpperCase() === "APPROVED" &&
        year === currentYear &&
        month === currentMonth
      );
    });

    const totalPaid = filtered.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );
    return { totalPaid, records: filtered };
  }, [employee, expenses]);

  const salary = Number(employee?.salary) || 0;
  const remaining = salary - currentMonthData.totalPaid;

  const columns = [
    { label: "Date", align: "start" as const },
    { label: "Payment Method", align: "start" as const },
    { label: "Amount Paid", align: "start" as const },
    { label: "Remarks", align: "end" as const },
  ];

  return (
    <CustomDialog
      title={`${employee?.name}'s Monthly Salary Ledger`}
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      size="xl"
    >
      <Stack gap="6" py="4">
        <Grid templateColumns="repeat(3, 1fr)" gap="4">
          <Box
            p="4"
            bg="blue.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="blue.100"
          >
            <Text fontSize="xs" fontWeight="bold" color="blue.600" mb="1">
              MONTHLY SALARY
            </Text>
            <Text fontSize="2xl" fontWeight="black">
              ₹{salary.toLocaleString("en-IN")}
            </Text>
          </Box>

          <Box
            p="4"
            bg="green.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="green.100"
          >
            <Text fontSize="xs" fontWeight="bold" color="green.600" mb="1">
              TOTAL PAID (THIS MONTH)
            </Text>
            <Text fontSize="2xl" fontWeight="black" color="green.700">
              ₹{currentMonthData.totalPaid.toLocaleString("en-IN")}
            </Text>
          </Box>

          <Box
            p="4"
            bg={remaining > 0 ? "red.50" : "green.50"}
            borderRadius="xl"
            border="1px solid"
            borderColor={remaining > 0 ? "red.100" : "green.100"}
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={remaining > 0 ? "red.600" : "green.600"}
              mb="1"
            >
              REMAINING BALANCE
            </Text>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color={remaining > 0 ? "red.700" : "green.700"}
            >
              ₹{remaining > 0 ? remaining.toLocaleString("en-IN") : "0"}
            </Text>
          </Box>
        </Grid>

        <Separator />

        <Box>
          <Text fontWeight="bold" mb="3" fontSize="md">
            Transaction Breakdown (Approved Only)
          </Text>
          <CustomTable
            columns={columns}
            data={currentMonthData.records}
            renderRow={(row, index) => (
              <Table.Row key={row.id || index}>
                <Table.Cell>{formatDate(row.date)}</Table.Cell>
                <Table.Cell>
                  <Badge variant="subtle" colorPalette="blue">
                    {row.method}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="start">
                  <Text fontWeight="bold">
                    ₹{Number(row.amount).toLocaleString("en-IN")}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Text fontSize="sm" color="fg.muted" maxWidth="200px">
                    {row.remarks || "--"}
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}
          />
          {currentMonthData.records.length === 0 && (
            <Center p="10" bg="gray.50" borderRadius="md" mt="2" width="full">
              <Text color="fg.muted">
                No approved salary payments for this month.
              </Text>
            </Center>
          )}
        </Box>
      </Stack>
    </CustomDialog>
  );
};
