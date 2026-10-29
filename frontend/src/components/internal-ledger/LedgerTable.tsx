import { Box, HStack, Table, IconButton, Badge } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdVisibility, MdEdit } from "react-icons/md";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/dateUtils";

export interface LedgerRecord {
  id: string;
  name: string;
  amount: number;
  amountPaid: number;
  balance: number;
  date: string;
}

interface LedgerTableProps {
  data: LedgerRecord[];
  onView: (record: LedgerRecord) => void;
  onEdit: (record: LedgerRecord) => void;
  onDelete?: (record: LedgerRecord) => void;
  isLoading?: boolean;
}

const LedgerTable = ({ data, onView, onEdit, isLoading }: LedgerTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const columns = [
    { label: "S.No", align: "start" as const },
    { label: "Name", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Amount", align: "end" as const },
    { label: "Amount Paid", align: "end" as const },
    { label: "Balance", align: "end" as const },
    { label: "Status", align: "center" as const },
    { label: "Action", align: "center" as const },
  ];

  if (isLoading) return <CustomSpinner message="Fetching records" />;

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.200"
    >
      <CustomTable
        columns={columns}
        data={data || []}
        renderRow={(record, index) => {
          const amount = Number(record.amount) || 0;
          const amountPaid = Number(record.amountPaid) || 0;
          const balance = amount - amountPaid;

          const status =
            balance <= 0 ? "Settled" : amountPaid > 0 ? "Partial" : "Pending";

          const statusColor =
            balance <= 0 ? "green" : amountPaid > 0 ? "orange" : "red";

          return (
            <Table.Row key={record.id || index} _hover={{ bg: "brand.50" }}>
              <Table.Cell py={4} px={4}>
                {index + 1}
              </Table.Cell>
              <Table.Cell
                py={4}
                px={4}
                fontWeight="bold"
                color="brand.800"
                textTransform="capitalize"
              >
                {record.name}
              </Table.Cell>
              <Table.Cell py={4} px={4} color="fg.muted">
                {formatDate(record.date)}
              </Table.Cell>
              <Table.Cell py={4} px={4} textAlign="right" fontWeight="medium">
                ₹{amount.toLocaleString("en-IN")}
              </Table.Cell>
              <Table.Cell
                py={4}
                px={4}
                textAlign="right"
                color="green.600"
                fontWeight="medium"
              >
                ₹{amountPaid.toLocaleString("en-IN")}
              </Table.Cell>
              <Table.Cell
                py={4}
                px={4}
                textAlign="right"
                fontWeight="bold"
                color={balance > 0 ? "red.500" : "green.500"}
              >
                ₹{balance.toLocaleString("en-IN")}
              </Table.Cell>
              <Table.Cell py={4} px={4} textAlign="center">
                <Badge colorPalette={statusColor} variant="subtle" size="sm">
                  {status}
                </Badge>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <HStack gap={1} justify="center">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="brand"
                    onClick={() => onView(record)}
                  >
                    <MdVisibility />
                  </IconButton>
                  {(isSuperAdmin || isAdmin) && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="blue"
                      onClick={() => onEdit(record)}
                    >
                      <MdEdit />
                    </IconButton>
                  )}
                </HStack>
              </Table.Cell>
            </Table.Row>
          );
        }}
      />
    </Box>
  );
};

export default LedgerTable;
