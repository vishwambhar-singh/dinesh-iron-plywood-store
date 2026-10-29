import { Box, HStack, Table, IconButton } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { ReferenceTableProps } from "@/types/references";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";

export const ReferenceTable = ({
  references,
  onView,
  onEdit,
  onDelete,
  isLoading,
}: ReferenceTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const columns = [
    { label: "Ref No.", align: "start" as const },
    { label: "Name", align: "start" as const },
    { label: "Mobile", align: "start" as const },
    { label: "Points", align: "start" as const },
    { label: "Redeemed", align: "start" as const },
    { label: "Action", align: "center" as const },
  ];

  if (isLoading) return <CustomSpinner message="Fetching References" />;

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
        data={references}
        renderRow={(ref, index) => (
          <Table.Row key={ref.id || index} _hover={{ bg: "brand.50" }}>
            <Table.Cell py={4} px={4} fontWeight="medium" fontSize="xs">
              {ref.referenceNumber || "N/A"}
            </Table.Cell>
            <Table.Cell py={4} px={4} fontWeight="bold">
              {ref.name}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {ref.mobile}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {ref.points || 0}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {ref.redeemedPoints || 0}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              <HStack gap={1} justify="center">
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onView(ref)}
                  aria-label="View reference"
                >
                  <MdVisibility />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="blue"
                  onClick={() => onEdit(ref)}
                  aria-label="Edit reference"
                >
                  <MdEdit />
                </IconButton>
                {(isSuperAdmin || isAdmin) && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="red"
                    onClick={() => onDelete(ref)}
                    aria-label="Delete reference"
                  >
                    <MdDelete />
                  </IconButton>
                )}
              </HStack>
            </Table.Cell>
          </Table.Row>
        )}
      />
    </Box>
  );
};
