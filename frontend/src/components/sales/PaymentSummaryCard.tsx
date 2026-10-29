import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import {
  MdPayments,
  MdAccountBalance,
  MdQrCode,
  MdCreditCard,
} from "react-icons/md";
import { Sale } from "@/types/sales";

interface Props {
  sales: Sale[];
}

const PaymentSummaryCard = ({ sales }: Props) => {
  const totals = sales.reduce(
    (acc, sale) => {
      sale.payments?.forEach((payment) => {
        const mode = payment.paymentMode; // NO lowercase
        const amount = Number(payment.amount) || 0;

        if (mode === "CASH") acc.cash += amount;
        else if (mode === "UPI") acc.upi += amount;
        else if (mode === "CHEQUE") acc.cheque += amount;
        else if (mode === "BANK_TRANSFER") acc.bank += amount;
        else acc.other += amount;
      });

      return acc;
    },
    { cash: 0, upi: 0, cheque: 0, bank: 0, other: 0 },
  );

  const cardData = [
    {
      label: "Cash",
      value: totals.cash,
      icon: MdPayments,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: "UPI",
      value: totals.upi,
      icon: MdQrCode,
      color: "blue.600",
      bg: "blue.50",
    },
    {
      label: "Cheque",
      value: totals.cheque,
      icon: MdAccountBalance,
      color: "yellow.600",
      bg: "yellow.50",
    },
    {
      label: "Bank Transfer",
      value: totals.bank,
      icon: MdCreditCard,
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

export default PaymentSummaryCard;
