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
  useGetLeavesQuery,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { Leave } from "@/types/leave";

export const LeaveApprovalsTable = () => {
  const { data: leaves = [], isLoading } = useGetLeavesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();
  const [deleteLeave] = useDeleteLeaveMutation();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Leave ${status} successfully`);
    } catch {
      toast.error("Failed to update leave status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this leave record?")) return;
    try {
      await deleteLeave(id).unwrap();
      toast.success("Leave record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  if (isLoading) return <Text>Loading leave applications...</Text>;

  return (
    <Box mt={8} p={5} bg="white" borderRadius="xl" border="1px solid" borderColor="brand.100" shadow="sm">
      <Heading size="md" mb={4} color="brand.800">
        Leave Applications
      </Heading>
      <Box overflowX="auto">
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Employee</Table.ColumnHeader>
              <Table.ColumnHeader>Duration</Table.ColumnHeader>
              <Table.ColumnHeader>Reason</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {leaves.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center">
                  No leave applications found.
                </Table.Cell>
              </Table.Row>
            ) : (
              leaves.map((leave: Leave) => (
                <Table.Row key={leave.id}>
                  <Table.Cell>
                    <Text fontWeight="bold">{leave.employeeName}</Text>
                    <Badge size="sm" colorPalette="brand">{leave.employeeRole}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">
                      {new Date(leave.start_date).toLocaleDateString()} -{" "}
                      {new Date(leave.end_date).toLocaleDateString()}
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">
                      {leave.days} Days
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" maxW="200px" truncate>
                      {leave.reason}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={
                        leave.status === "APPROVED"
                          ? "green"
                          : leave.status === "REJECTED"
                          ? "red"
                          : "yellow"
                      }
                    >
                      {leave.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack justify="flex-end" gap={2}>
                      {leave.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            colorPalette="green"
                            loading={isUpdating}
                            onClick={() => handleStatusChange(leave.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            colorPalette="red"
                            variant="outline"
                            loading={isUpdating}
                            onClick={() => handleStatusChange(leave.id, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(leave.id)}
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
