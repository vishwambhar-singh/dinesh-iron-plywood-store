import { Box, Text, Grid, GridItem, Stack } from "@chakra-ui/react";
import {
  MdAccountBalanceWallet,
  MdArrowUpward,
  MdArrowDownward,
  MdAccountBalance,
} from "react-icons/md";

interface Props {
  vouchers: any[];
  allVouchers: any[];
  selectedBank: string;
}

const AccountingSummaryCard = ({
  vouchers,
  allVouchers,
  selectedBank,
}: Props) => {
  const totals = vouchers.reduce(
    (acc, voucher) => {
      const amount = Number(voucher.amount) || 0;
      if (voucher.transactionSide === "DEBIT") {
        acc.totalDebited += amount;
      } else if (voucher.transactionSide === "CREDIT") {
        acc.totalCredited += amount;
      }
      return acc;
    },
    { totalDebited: 0, totalCredited: 0 },
  );

  const lifetimeBalance = allVouchers.reduce((acc, v) => {
    const matchesBank = selectedBank === "ALL" || v.bankName === selectedBank;

    if (!matchesBank) return acc;
    const amount = Number(v.amount) || 0;
    return v.transactionSide === "CREDIT" ? acc + amount : acc - amount;
  }, 0);

  const netBalance = totals.totalCredited - totals.totalDebited;

  const cardData = [
    {
      label: "Total Credited (In)",
      value: totals.totalCredited,
      icon: MdArrowUpward,
      color: "green.600",
      bg: "green.50",
    },
    {
      label: "Total Debited (Out)",
      value: totals.totalDebited,
      icon: MdArrowDownward,
      color: "red.600",
      bg: "red.50",
    },
    {
      label: "Net Cash Flow",
      value: netBalance,
      icon: MdAccountBalanceWallet,
      color: netBalance >= 0 ? "blue.600" : "orange.600",
      bg: netBalance >= 0 ? "blue.50" : "orange.50",
    },
    {
      label: "Account Balance",
      value: lifetimeBalance,
      icon: MdAccountBalance,
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
                  ₹
                  {card.value.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
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

export default AccountingSummaryCard;
