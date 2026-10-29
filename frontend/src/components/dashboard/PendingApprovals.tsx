import { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Table,
  Avatar,
  Center,
  VStack,
  Badge,
  Tabs,
} from "@chakra-ui/react";
import { MdPendingActions } from "react-icons/md";
import { CustomTable } from "../ui/CustomTable";
import { CustomSpinner } from "../ui/CustomSpinner";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  expenses: any[];
  isLoading: boolean;
  isError: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PendingApprovals = ({
  expenses,
  isLoading,
  isError,
  onApprove,
  onReject,
}: Props) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("employee");

  if (isLoading) return <CustomSpinner message="Loading Approvals..." />;

  if (isError)
    return (
      <Center
        p={10}
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.200"
      >
        <Text color="red.500">Error loading inventory</Text>
      </Center>
    );

  const filteredPending = expenses.filter((e: any) => {
    const isPending = e.status?.toUpperCase() === "PENDING";
    const matchesTab = e.expenseType?.toLowerCase() === activeTab.toLowerCase();
    return isPending && matchesTab;
  });

  const columns = [
    { label: "Details", align: "start" as const },
    { label: "Amount", align: "start" as const },
    { label: "Quick Actions", align: "end" as const },
  ];

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.200"
      shadow="sm"
    >
      <HStack justify="space-between" mb={6}>
        <HStack gap={3}>
          <Box
            bg="orange.500"
            p={2}
            borderRadius="lg"
            color="white"
            display="flex"
            alignItems="center"
          >
            <MdPendingActions size={20} />
          </Box>
          <Box>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="brand.900"
              lineHeight="1"
            >
              Pending Approvals
            </Text>
            <Text fontSize="xs" color="brand.400">
              Review and take action
            </Text>
          </Box>
        </HStack>
        <Badge
          colorPalette="orange"
          variant="subtle"
          borderRadius="full"
          px={3}
        >
          {filteredPending.length} {activeTab} pending
        </Badge>
      </HStack>

      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        variant="subtle"
      >
        <Tabs.List
          bg="bg.muted"
          p="1"
          borderRadius="lg"
          mb="4"
          width="fit-content"
        >
          <Tabs.Trigger value="employee" fontSize="xs" fontWeight="bold" px={4}>
            Employee
          </Tabs.Trigger>
          <Tabs.Trigger value="office" fontSize="xs" fontWeight="bold" px={4}>
            Office
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value={activeTab} mt={2}>
          {filteredPending.length > 0 ? (
            <CustomTable
              columns={columns}
              data={filteredPending}
              maxRows={5}
              renderRow={(item: any, index: number) => (
                <Table.Row
                  key={item.id || index}
                  _hover={{ bg: "orange.50/20" }}
                >
                  <Table.Cell py={3}>
                    <HStack gap={3}>
                      <Avatar.Root
                        size="xs"
                        bg={activeTab === "employee" ? "brand.100" : "blue.100"}
                        color="brand.700"
                      >
                        <Avatar.Fallback
                          name={
                            activeTab === "employee"
                              ? item.employeeName
                              : item.category
                          }
                        />
                      </Avatar.Root>
                      <VStack align="start" gap={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="brand.600"
                          cursor="pointer"
                          _hover={{
                            textDecoration: "underline",
                            color: "brand.800",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/expenses?viewExpense=${item.id}&tab=${activeTab}`,
                            );
                          }}
                        >
                          {activeTab === "employee"
                            ? item.employeeName
                            : item.category}
                        </Text>
                        <Text
                          fontSize="2xs"
                          color="gray.500"
                          textTransform="capitalize"
                        >
                          {activeTab === "employee"
                            ? item.category
                            : "Office Expense"}
                        </Text>
                      </VStack>
                    </HStack>
                  </Table.Cell>

                  <Table.Cell py={3}>
                    <Text fontWeight="bold" fontSize="sm">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </Text>
                  </Table.Cell>

                  <Table.Cell py={3}>
                    <HStack gap={2} justify="flex-end">
                      <Button
                        size="xs"
                        colorPalette="green"
                        variant="subtle"
                        px={3}
                        fontSize="10px"
                        borderRadius="md"
                        onClick={() => onApprove(item.id)}
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
                        onClick={() => onReject(item.id)}
                      >
                        Reject
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              )}
            />
          ) : (
            <Center p={10} flexDirection="column" gap={2}>
              <Text color="gray.400" fontSize="sm" fontWeight="medium">
                No pending {activeTab} approvals.
              </Text>
            </Center>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default PendingApprovals;
