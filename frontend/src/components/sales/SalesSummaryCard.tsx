import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import {
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdPendingActions,
} from "react-icons/md";
import { Sale } from "@/types/sales";

interface Props {
  sales: Sale[];
}

const SalesSummaryCard = ({ sales }: Props) => {
  const totals = sales.reduce(
    (acc, sale) => {
      acc.totalAmount += Number(sale.totalAmount) || 0;
      acc.amountPaid += Number(sale.amountPaid) || 0;
      acc.pendingBalance += Number(sale.balance) > 0 ? Number(sale.balance) : 0;
      acc.refundMade += Number(sale.balance) < 0 ? Number(sale.balance) : 0;
      return acc;
    },
    { totalAmount: 0, amountPaid: 0, pendingBalance: 0, refundMade: 0 },
  );

  const cardData = [
    {
      label: "Total Sales",
      value: totals.totalAmount,
      icon: MdAccountBalanceWallet,
      color: "blue.600",
      bg: "blue.50",
    },
    {
      label: "Total Collected",
      value: totals.amountPaid,
      icon: MdCheckCircle,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: "Total Balance",
      value: totals.pendingBalance,
      icon: MdPendingActions,
      color: "red.600",
      bg: "red.50",
    },
    {
      label: "Refund to Customer",
      value: Math.abs(totals.refundMade),
      icon: MdPendingActions,
      color: "purple.600",
      bg: "purple.50",
    },
  ];

  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
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
                  ₹{card.value.toLocaleString()}
                </Text>
              </Box>
            </Stack>
          </Box>
        </GridItem>
      ))}
    </Grid>
  );
};

export default SalesSummaryCard;
