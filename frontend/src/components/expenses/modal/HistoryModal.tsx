import {
  Table,
  Box,
  Text,
  IconButton,
  HStack,
  Grid,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { CustomTable } from "@/components/ui/CustomTable";
import { MdVisibility } from "react-icons/md";
import { HistoryModalProps } from "@/types/expenses";
import { formatDate } from "@/utils/dateUtils";
import { useMemo } from "react";

export const HistoryModal = ({
  isOpen,
  onClose,
  expenses,
  employee,
  onViewAction,
}: HistoryModalProps) => {
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.status?.toUpperCase() === "APPROVED");
  }, [expenses]);

  const columns = [
    { label: "S.No", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Amount Paid", align: "start" as const },
    { label: "Category", align: "start" as const },
    { label: "Action", align: "end" as const },
  ];

  return (
    <CustomModal
      title="Payment History (Approved)"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <Stack gap={5}>
        {employee && (
          <Box
            p={4}
            bg="brand.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="brand.200"
            width="full"
          >
            <Grid
              templateColumns="repeat(4, 1fr)"
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
                  {employee.name}
                </Text>
              </Stack>

              <Stack gap={0}>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  color="brand.600"
                  textTransform="uppercase"
                >
                  Contact Info
                </Text>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="medium" truncate>
                    {employee.mobile || "No Phone"}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted" truncate>
                    {employee.email || "No Email"}
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
                  {employee.role}
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
                  ₹{Number(employee.salary || 0).toLocaleString("en-IN")}
                </Text>
              </Stack>
            </Grid>
          </Box>
        )}

        <Box overflowY="auto" maxH="350px">
          <CustomTable
            columns={columns}
            data={filteredExpenses}
            renderRow={(row, index) => (
              <Table.Row key={row.id || index}>
                <Table.Cell width="60px">{index + 1}</Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDate(row.date)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontWeight="bold" color="brand.600">
                    ₹{Number(row.amount).toLocaleString("en-IN")}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontWeight="medium" textTransform="capitalize">
                    {row.category}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={1} justify="flex-end">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label="View"
                      onClick={() => onViewAction(row)}
                    >
                      <MdVisibility />
                    </IconButton>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            )}
          />

          {filteredExpenses.length === 0 && (
            <Box p={10} textAlign="center">
              <Text color="fg.muted">
                No approved transaction history found.
              </Text>
            </Box>
          )}
        </Box>
      </Stack>
    </CustomModal>
  );
};
