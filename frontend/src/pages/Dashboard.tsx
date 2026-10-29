import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  VStack,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { MdDashboard, MdCalendarToday, MdAccountCircle } from "react-icons/md";
import TotalPayable from "@/components/dashboard/TotalPayable";
import LowStockCard from "@/components/dashboard/LowStockCard";
import { useAuth } from "@/hooks/useAuth";
import BalanceReceivable from "@/components/dashboard/BalanceReceivable";
import SalesGraph from "@/components/dashboard/SalesGraph";
import RevenueGraph from "@/components/dashboard/RevenueGraph";
import { getSafeDate } from "@/utils/dateUtils";
import NegativeStockCard from "@/components/dashboard/NegativeStockCard";
import PendingApprovals from "@/components/dashboard/PendingApprovals";
import CashSaleCard from "@/components/dashboard/CashSaleCard";
import {
  useGetExpensesQuery,
  useUpdateExpenseMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import MyPayrollWidget from "@/components/employee/MyPayrollWidget";

const Dashboard = () => {
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const { data: expenses, isLoading, isError } = useGetExpensesQuery();
  const [updateExpense] = useUpdateExpenseMutation();
  const isEmployeeOnly = user?.role === "EMPLOYEE";

  const today = getSafeDate(new Date()).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleStatusChange = async (
    id: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      await updateExpense({ id, status: newStatus }).unwrap();
      toast.success(`Expense ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${newStatus.toLowerCase()} expense`);
    }
  };

  return (
    <Box w="full" bg="bg.canvas" minH="100vh" p={{ base: 4, md: 8 }}>
      <HStack
        justify="space-between"
        align="flex-start"
        mb={10}
        wrap="wrap"
        gap={4}
      >
        <VStack align="flex-start" gap={1}>
          <HStack gap={2} color="brand.600">
            <Icon as={MdDashboard} />
            <Text
              fontSize="xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="widest"
            >
              Management Console
            </Text>
          </HStack>
          <HStack gap={3}>
            <Icon as={MdAccountCircle} boxSize={8} color="brand.500" />
            <Heading
              size="xl"
              color="brand.900"
              fontWeight="black"
              letterSpacing="tight"
            >
              Hello, {user?.name}
            </Heading>
          </HStack>
          <Text fontSize="md" color="brand.500" fontWeight="medium" pl={11}>
            Here's what's happening with your store today.
          </Text>
        </VStack>

        <HStack
          bg="white"
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="brand.100"
          shadow="sm"
          gap={3}
        >
          <Icon as={MdCalendarToday} color="brand.600" />
          <Text fontSize="sm" fontWeight="bold" color="brand.700">
            {today}
          </Text>
        </HStack>
      </HStack>

      <MyPayrollWidget />

      {!isEmployeeOnly && (
        <Grid
          templateColumns={{
            base: "1fr",
            lg: "repeat(2, 1fr)",
          }}
          gap={6}
          mb={8}
          alignItems="start"
        >
          {(isSuperAdmin || isAdmin) && (
            <>
              <GridItem>
                <TotalPayable />
              </GridItem>
              <GridItem>
                <PendingApprovals
                  expenses={expenses || []}
                  isLoading={isLoading}
                  isError={isError}
                  onApprove={(id) => handleStatusChange(id, "APPROVED")}
                  onReject={(id) => handleStatusChange(id, "REJECTED")}
                />
              </GridItem>
            </>
          )}
          <GridItem>
            <LowStockCard />
          </GridItem>
          <GridItem>
            <NegativeStockCard />
          </GridItem>
          <GridItem>
            <BalanceReceivable />
          </GridItem>
          <GridItem>
            <CashSaleCard />
          </GridItem>
        </Grid>
      )}

      {(isSuperAdmin || isAdmin) && (
        <VStack gap={8} align="stretch">
          <SalesGraph />
          <RevenueGraph />
        </VStack>
      )}
    </Box>
  );
};

export default Dashboard;
