import { Box, HStack, Table, IconButton, Text, Badge } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdVisibility, MdEdit, MdDelete, MdHistory } from "react-icons/md";
import { CustomerTableProps } from "@/types/customer";
import { useAuth } from "@/hooks/useAuth";
import { CustomSpinner } from "../ui/CustomSpinner";

export const CustomerTable = ({
  customers,
  onView,
  onEdit,
  onHistory,
  onDelete,
  loading,
}: CustomerTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const columns = [
    { label: "Customer Details", align: "start" as const },
    { label: "Contact", align: "start" as const },
    { label: "Action", align: "center" as const },
  ];

  if (loading) {
    return <CustomSpinner message="Loading customers..." />;
  }

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
        data={customers}
        renderRow={(customer) => {
          return (
            <Table.Row key={customer.id} _hover={{ bg: "brand.50" }}>
              <Table.Cell py={4} px={4}>
                <HStack gap={2}>
                  <Text fontWeight="bold" textTransform="capitalize">
                    {customer.name}
                  </Text>
                  {customer.needsReview && (
                    <Badge colorPalette="orange" variant="subtle" size="sm">
                      Needs Review
                    </Badge>
                  )}
                </HStack>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <Text fontSize="sm">{customer.mobile?.startsWith("DUMMY_") ? "—" : customer.mobile}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {customer.email}
                </Text>
              </Table.Cell>
              <Table.Cell py={4} px={4}>
                <HStack gap={1} justify="center">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="brand"
                    onClick={() => onView(customer)}
                  >
                    <MdVisibility />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="blue"
                    onClick={() => onEdit(customer)}
                  >
                    <MdEdit />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="purple"
                    onClick={() => onHistory(customer)}
                  >
                    <MdHistory />
                  </IconButton>
                  {(isSuperAdmin || isAdmin) && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onDelete(customer)}
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
