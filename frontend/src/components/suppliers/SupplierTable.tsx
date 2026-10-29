import { Box, HStack, Table, IconButton, Text } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdVisibility, MdEdit, MdDelete, MdHistory } from "react-icons/md";
import { Supplier } from "@/types/supplier";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  suppliers: Supplier[];
  onView: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
  onHistory: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}

export const SupplierTable = ({
  suppliers,
  onView,
  onEdit,
  onHistory,
  onDelete,
}: Props) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const columns = [
    { label: "Supplier Details", align: "start" as const },
    { label: "Contact", align: "start" as const },
    { label: "Total Amount", align: "start" as const },
    { label: "Pending Payable", align: "start" as const },
    { label: "Action", align: "center" as const },
  ];

  return (
    <Box
      bg="bg.panel"
      p={6}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="brand.200"
    >
      <CustomTable
        columns={columns}
        data={suppliers}
        renderRow={(supplier) => {
          const totalAmount =
            supplier?.bills?.reduce(
              (sum, bill) => sum + Number(bill.totalAmount || 0),
              0,
            ) || 0;

          const totalPaid =
            supplier?.bills?.reduce(
              (sum, bill) => sum + Number(bill.amountPaid || 0),
              0,
            ) || 0;

          const totalBalance = totalAmount - totalPaid;

          return (
            <Table.Row key={supplier.id} _hover={{ bg: "brand.50" }}>
              <Table.Cell py={4} px={4}>
                <Text fontWeight="bold" textTransform="capitalize">
                  {supplier.name}
                </Text>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <Text fontSize="sm">{supplier.mobile}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {supplier.email}
                </Text>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <Text fontWeight="bold" color="brand.600">
                  {totalAmount}
                </Text>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <Text
                  fontWeight="bold"
                  color={totalBalance > 0 ? "red" : "green"}
                >
                  {totalBalance}
                </Text>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <HStack gap={1} justify="center">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="brand"
                    onClick={() => onView(supplier)}
                  >
                    <MdVisibility />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="blue"
                    onClick={() => onEdit(supplier)}
                  >
                    <MdEdit />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="purple"
                    onClick={() => onHistory(supplier)}
                  >
                    <MdHistory />
                  </IconButton>
                  {(isSuperAdmin || isAdmin) && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onDelete(supplier)}
                    >
                      <MdDelete />
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
