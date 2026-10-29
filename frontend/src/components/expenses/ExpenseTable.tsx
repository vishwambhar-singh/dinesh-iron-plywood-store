import {
  Table,
  IconButton,
  HStack,
  Badge,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdDelete, MdEdit, MdHistory, MdVisibility } from "react-icons/md";
import { ExpenseTableProps } from "@/types/expenses";
import { formatDate } from "@/utils/dateUtils";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";

export const ExpenseTable = ({
  expenses,
  onView,
  onEdit,
  onHistory,
  onDelete,
  onNameClick,
  onApprove,
  onReject,
  isLoading,
}: ExpenseTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const columns = [
    { label: "Employee & Category", align: "start" as const },
    { label: "Amount Paid", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Method", align: "center" as const },
    { label: "Status", align: "center" as const },
    { label: "Actions", align: "end" as const },
  ];

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "green",
      ONLINE: "blue",
      BANK: "purple",
      CARD: "orange",
    };
    return (
      <Badge
        colorPalette={colors[method.toUpperCase()] || "gray"}
        variant="subtle"
        size="sm"
      >
        {method}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    const config: Record<string, string> = {
      PENDING: "yellow",
      APPROVED: "green",
      REJECTED: "red",
    };
    return (
      <Badge
        colorPalette={config[s] || "gray"}
        variant="solid"
        px={2}
        borderRadius="md"
      >
        {s}
      </Badge>
    );
  };

  if (isLoading) return <CustomSpinner message="Fetching expenses" />;

  return (
    <CustomTable
      columns={columns}
      data={expenses}
      renderRow={(expense, index) => {
        const isPending = expense.status.toUpperCase() === "PENDING";
        const canSee = isPending && (isSuperAdmin || isAdmin);

        return (
          <Table.Row key={expense.id || index}>
            <Table.Cell>
              <VStack align="start" gap={0.5}>
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color="brand.600"
                  cursor="pointer"
                  _hover={{
                    color: "brand.700",
                    textDecoration: "underline",
                  }}
                  onClick={() => onNameClick(expense.employeeId)}
                >
                  {expense.employeeName}
                </Text>
                <Badge
                  size="xs"
                  variant="subtle"
                  colorPalette="gray"
                  fontSize="9px"
                  px={1}
                >
                  {expense.category || "others"}
                </Badge>
              </VStack>
            </Table.Cell>

            <Table.Cell>
              <Text fontWeight="bold" color="brand.600">
                ₹{Number(expense.amount).toLocaleString("en-IN")}
              </Text>
            </Table.Cell>

            <Table.Cell>
              <Text fontSize="sm">{formatDate(expense.date)}</Text>
            </Table.Cell>

            <Table.Cell textAlign="center">
              {getMethodBadge(expense.method)}
            </Table.Cell>

            <Table.Cell textAlign="center">
              {getStatusBadge(expense.status)}
            </Table.Cell>

            <Table.Cell>
              <VStack align="flex-end" gap={2}>
                <HStack gap={1} justify="flex-end">
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="View"
                    onClick={() => onView(expense)}
                  >
                    <MdVisibility />
                  </IconButton>
                  {isPending && (
                    <IconButton
                      size="sm"
                      variant="ghost"
                      aria-label="Edit"
                      onClick={() => onEdit(expense)}
                    >
                      <MdEdit />
                    </IconButton>
                  )}

                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="blue"
                    aria-label="History"
                    onClick={() => onHistory(expense.employeeId)}
                  >
                    <MdHistory />
                  </IconButton>

                  {(isSuperAdmin || isAdmin) && isPending && (
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      aria-label="Delete"
                      onClick={() => onDelete(expense)}
                    >
                      <MdDelete />
                    </IconButton>
                  )}
                </HStack>

                {canSee && (
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      colorPalette="green"
                      variant="subtle"
                      px={3}
                      fontSize="10px"
                      borderRadius="md"
                      onClick={() => onApprove(expense.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      colorPalette="red"
                      variant="subtle"
                      px={3}
                      fontSize="10px"
                      borderRadius="md"
                      onClick={() => onReject(expense.id)}
                    >
                      Reject
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Table.Cell>
          </Table.Row>
        );
      }}
    />
  );
};
