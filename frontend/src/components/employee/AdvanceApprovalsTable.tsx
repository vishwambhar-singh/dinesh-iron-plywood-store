import {
  Box,
  Heading,
  Table,
  Button,
  HStack,
  Badge,
  Text,
} from "@chakra-ui/react";
import {
  useGetAdvancesQuery,
  useUpdateAdvanceStatusMutation,
  useDeleteAdvanceMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";

export const AdvanceApprovalsTable = () => {
  const { data: advances = [], isLoading } = useGetAdvancesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdvanceStatusMutation();
  const [deleteAdvance] = useDeleteAdvanceMutation();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Advance request ${status} successfully`);
    } catch {
      toast.error("Failed to update advance request status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this advance request?")) return;
    try {
      await deleteAdvance(id).unwrap();
      toast.success("Advance request deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  if (isLoading) return <Text>Loading advance requests...</Text>;

  return (
    <Box mt={8} p={5} bg="white" borderRadius="xl" border="1px solid" borderColor="brand.100" shadow="sm">
      <Heading size="md" mb={4} color="brand.800">
        Salary Advance Requests
      </Heading>
      <Box overflowX="auto">
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Employee</Table.ColumnHeader>
              <Table.ColumnHeader>Amount</Table.ColumnHeader>
              <Table.ColumnHeader>Reason</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {advances.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center">
                  No advance applications found.
                </Table.Cell>
              </Table.Row>
            ) : (
              advances.map((advance: any) => (
                <Table.Row key={advance.id}>
                  <Table.Cell>
                    <Text fontWeight="bold">{advance.employeeName}</Text>
                    <Badge size="sm" colorPalette="brand">{advance.employeeRole}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="lg" fontWeight="bold">
                      Rs. {Number(advance.amount).toLocaleString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" maxW="200px" truncate>
                      {advance.reason}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={
                        advance.status === "APPROVED"
                          ? "green"
                          : advance.status === "REJECTED"
                          ? "red"
                          : "yellow"
                      }
                    >
                      {advance.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack justify="flex-end" gap={2}>
                      {advance.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            colorPalette="green"
                            loading={isUpdating}
                            onClick={() => handleStatusChange(advance.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            colorPalette="red"
                            variant="outline"
                            loading={isUpdating}
                            onClick={() => handleStatusChange(advance.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(advance.id)}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
};
