import { Box, HStack, Table, IconButton } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { EmployeeTableProps } from "@/types/employee";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";

const EmployeeTable = ({
  employees,
  onView,
  onEdit,
  onDelete,
  isLoading,
}: EmployeeTableProps) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const columns = [
    { label: "S.No", align: "start" as const },
    { label: "Name", align: "start" as const },
    { label: "Email", align: "start" as const },
    { label: "Mobile", align: "start" as const },
    { label: "Role", align: "start" as const },
    { label: "Action", align: "center" as const },
  ];

  if (isLoading) <CustomSpinner message="Fetching employees" />;

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
        data={employees}
        renderRow={(employee, index) => (
          <Table.Row key={employee.id || index} _hover={{ bg: "brand.50" }}>
            <Table.Cell py={4} px={4}>
              {index + 1}
            </Table.Cell>
            <Table.Cell py={4} px={4} fontWeight="bold">
              {employee.name}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {employee.email}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {employee.mobile}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              {employee.role}
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              <HStack gap={1} justify="center">
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onView(employee)}
                >
                  <MdVisibility />
                </IconButton>
                {(isSuperAdmin || isAdmin) && (
                  <>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="blue"
                      onClick={() => onEdit(employee)}
                    >
                      <MdEdit />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onDelete(employee)}
                    >
                      <MdDelete />
                    </IconButton>
                  </>
                )}
              </HStack>
            </Table.Cell>
          </Table.Row>
        )}
      />
    </Box>
  );
};

export default EmployeeTable;
