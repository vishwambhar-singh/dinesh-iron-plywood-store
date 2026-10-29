import { Box, HStack, Table, IconButton, Badge, Text } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import {
  MdVisibility,
  MdDelete,
  MdKeyboardReturn,
  MdEdit,
} from "react-icons/md";
import { Sale } from "@/types/sales";
import { CustomSpinner } from "../ui/CustomSpinner";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDate } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";

interface SalesTableProps {
  sales: Sale[];
  onView: (sale: Sale) => void;
  onReturn: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  loading: boolean;
  activeTab?: string;
}

const SalesTable = ({
  sales,
  onView,
  onReturn,
  onDelete,
  onEdit,
  loading,
  activeTab,
}: SalesTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const columns = [
    { label: "Date", align: "start" as const },
    { label: "Customer", align: "start" as const },
    { label: "Bill No", align: "start" as const },
    ...(isSuperAdmin && activeTab === "all"
      ? [{ label: "Type", align: "start" as const }]
      : []),
    { label: "Total", align: "start" as const },
    { label: "Status & Balance", align: "center" as const },
    { label: "Action", align: "center" as const },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PAID":
        return "green";
      case "PARTIALLY_PAID":
        return "orange";
      case "PENDING":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) return <CustomSpinner message="Fetching Sales" />;

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
        data={sales}
        renderRow={(sale) => (
          <Table.Row key={sale.id} _hover={{ bg: "brand.50" }}>
            <Table.Cell py={4}>{formatDate(sale.saleDate)}</Table.Cell>
            <Table.Cell py={4} fontWeight="bold">
              {sale.customerName}
            </Table.Cell>
            <Table.Cell py={4} fontWeight="bold">
              {sale.invoiceNumber}
            </Table.Cell>{" "}
            {isSuperAdmin && activeTab === "all" && (
              <Table.Cell py={4} fontWeight="bold">
                {sale.saleType === "PAKKA" ? "Online Portal" : sale.saleType === "KACCHA" ? "Portal" : sale.saleType}
              </Table.Cell>
            )}
            <Table.Cell py={4} fontWeight="bold">
              ₹{sale.totalAmount}
            </Table.Cell>
            <Table.Cell py={4} px={4} textAlign="center">
              <Box>
                {Number(sale?.balance) > 0 && (
                  <Badge
                    colorPalette={getStatusColor(sale?.paymentStatus)}
                    variant="solid"
                    size="sm"
                    mb={1}
                  >
                    {sale.paymentStatus?.replace("_", " ")}
                  </Badge>
                )}

                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={
                    Number(sale?.balance) > 0
                      ? "red.600"
                      : Number(sale?.balance) < 0
                        ? "green.600"
                        : "gray.500"
                  }
                >
                  {Number(sale?.balance) < 0 ? "Refund: " : ""}₹
                  {Math.abs(sale?.balance).toLocaleString()}
                </Text>

                {Number(sale?.balance) === 0 && (
                  <Text fontSize="xs" color="gray.400">
                    Settled
                  </Text>
                )}
              </Box>
            </Table.Cell>
            <Table.Cell py={4}>
              <HStack gap={1} justify="center">
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onView(sale)}
                >
                  <MdVisibility />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onEdit(sale)}
                >
                  <MdEdit />
                </IconButton>
                {(isSuperAdmin || isAdmin) && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="red"
                    onClick={() => onDelete(sale)}
                  >
                    <MdDelete />
                  </IconButton>
                )}
                <Tooltip content="Create Return Note" showArrow>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onReturn(sale)}
                    color="brand.600"
                  >
                    <MdKeyboardReturn />
                  </IconButton>
                </Tooltip>
              </HStack>
            </Table.Cell>
          </Table.Row>
        )}
      />
    </Box>
  );
};

export default SalesTable;
