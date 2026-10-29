import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import {
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdPendingActions,
} from "react-icons/md";
import { Supplier } from "@/types/supplier";

interface Props {
  suppliers: Supplier[];
  vouchers?: any[];
}

const PayableSummaryCards = ({ suppliers, vouchers = [] }: Props) => {
  const totals = suppliers.reduce(
    (acc, supplier) => {
      (supplier.bills || []).forEach((bill) => {
        const totalAmount = Number(bill.totalAmount) || 0;
        const amountPaid = Number(bill.amountPaid) || 0;
        const balance = Number(bill?.balanceAmount) || 0;

        acc.totalAmount += totalAmount;
        acc.amountPaid += amountPaid;
        acc.pendingPayable += balance;
      });

      const ob = Number(supplier.openingBalance) || 0;
      acc.totalAmount += ob;
      acc.pendingPayable += ob;

      return acc;
    },
    { totalAmount: 0, amountPaid: 0, pendingPayable: 0 },
  );

  vouchers.forEach((v: any) => {
    if (v.status === "APPROVED" && v.relatedEntityType === "SUPPLIER") {
      const amt = Number(v.amount) || 0;
      if (v.transactionSide === "DEBIT") {
        totals.amountPaid += amt;
        totals.pendingPayable -= amt;
      } else if (v.transactionSide === "CREDIT") {
        totals.totalAmount += amt;
        totals.pendingPayable += amt;
      }
    }
  });

  const cardData = [
    {
      label: "Total Amount",
      value: totals.totalAmount,
      icon: MdAccountBalanceWallet,
      color: "blue.600",
      bg: "blue.50",
    },
    {
      label: "Amount Paid",
      value: totals.amountPaid,
      icon: MdCheckCircle,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: "Pending Payable",
      value: totals.pendingPayable,
      icon: MdPendingActions,
      color: "red.600",
      bg: "red.50",
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

export default PayableSummaryCards;
