import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import {
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdPendingActions,
} from "react-icons/md";

interface Props {
  data: any[];
  type: "suppliers" | "sales";
}

const LedgerSummaryCard = ({ data, type }: Props) => {
  const totals = data.reduce(
    (acc, record) => {
      if (type === "suppliers") {
        const totalAmount = Number(record.amount) || 0;
        const amountPaid = Number(record.amountPaid) || 0;
        const balance = totalAmount - amountPaid;

        acc.totalAmount += totalAmount;
        acc.amountPaid += amountPaid;
        acc.pendingAmount += balance;
      } else {
        const totalAmount = Number(record.amount) || 0;
        const amountPaid = Number(record.amountPaid) || 0;
        const balance = totalAmount - amountPaid;

        acc.totalAmount += totalAmount;
        acc.amountPaid += amountPaid;
        acc.pendingAmount += balance;
      }
      return acc;
    },
    { totalAmount: 0, amountPaid: 0, pendingAmount: 0 },
  );

  const isSupplier = type === "suppliers";

  const cardData = [
    {
      label: "Total Amount",
      value: totals.totalAmount,
      icon: MdAccountBalanceWallet,
      color: "blue.600",
      bg: "blue.50",
    },
    {
      label: isSupplier ? "Amount Paid" : "Amount Received",
      value: totals.amountPaid,
      icon: MdCheckCircle,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: isSupplier ? "Pending Payable" : "Pending Receivable",
      value: totals.pendingAmount,
      icon: MdPendingActions,
      color: isSupplier ? "red.600" : "orange.600",
      bg: isSupplier ? "red.50" : "orange.50",
    },
  ];

  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
      gap={6}
      mb={6}
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
                  ₹
                  {card.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Box>
            </Stack>
          </Box>
        </GridItem>
      ))}
    </Grid>
  );
};

export default LedgerSummaryCard;
