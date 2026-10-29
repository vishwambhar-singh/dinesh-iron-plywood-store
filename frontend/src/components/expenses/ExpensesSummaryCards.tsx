import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import { MdAccountBalanceWallet, MdWork, MdCategory } from "react-icons/md";

interface Expense {
  amount: number;
  category: string;
  status: string;
}

interface Props {
  expenses: Expense[];
}

const ExpensesSummaryCards = ({ expenses }: Props) => {
  const totals = expenses.reduce(
    (acc, expense) => {
      if (expense.status?.toUpperCase() !== "APPROVED") {
        return acc;
      }

      const amount = Number(expense.amount) || 0;
      acc.totalExpenses += amount;

      if (
        expense.category?.toUpperCase() === "SALARY" ||
        expense.category?.toUpperCase() === "ADVANCE"
      ) {
        acc.salaryExpenses += amount;
      } else {
        acc.otherExpenses += amount;
      }

      return acc;
    },
    { totalExpenses: 0, salaryExpenses: 0, otherExpenses: 0 },
  );

  const cardData = [
    {
      label: "Total Approved",
      value: totals.totalExpenses,
      icon: MdAccountBalanceWallet,
      color: "blue.600",
      bg: "blue.50",
    },
    {
      label: "Salary (Approved)",
      value: totals.salaryExpenses,
      icon: MdWork,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: "Others (Approved)",
      value: totals.otherExpenses,
      icon: MdCategory,
      color: "orange.600",
      bg: "orange.50",
    },
  ];

  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
      gap={6}
      mb={8}
      w="full"
    >
      {cardData.map((card, index) => (
        <GridItem key={index}>
          <Box
            p={5}
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="brand.200"
            shadow="sm"
          >
            <Stack direction="row" align="center" gap={4}>
              <Box
                p={3}
                bg={card.bg}
                color={card.color}
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <card.icon size={24} />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.500">
                  {card.label}
                </Text>

                <Text fontSize="xl" fontWeight="bold" color="brand.900">
                  ₹{card.value.toLocaleString("en-IN")}
                </Text>
              </Box>
            </Stack>
          </Box>
        </GridItem>
      ))}
    </Grid>
  );
};

export default ExpensesSummaryCards;
