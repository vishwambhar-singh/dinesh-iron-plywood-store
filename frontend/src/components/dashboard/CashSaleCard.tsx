import { Box, HStack, Text, VStack, Center, Grid } from "@chakra-ui/react";
import { MdMonetizationOn, MdAccountBalanceWallet } from "react-icons/md";
import { useGetSalesQuery, useGetInternalLedgersQuery } from "@/store/apiSlice";
import { CustomSpinner } from "../ui/CustomSpinner";
import { getISTDateString } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";

const CashSaleCard = () => {
  const { data: sales, isLoading: isSalesLoading, isError: isSalesError } = useGetSalesQuery();
  const { data: ledgers, isLoading: isLedgersLoading, isError: isLedgersError } = useGetInternalLedgersQuery("CUSTOMER");
  const { isSuperAdmin } = useAuth();

  if (isSalesLoading || isLedgersLoading) return <CustomSpinner message="Calculating Sales..." />;
  if (isSalesError || isLedgersError) return <Center p={10}><Text color="red.600">Error loading sales data</Text></Center>;

  const todayStr = getISTDateString(new Date());

  let totalCash = 0;
  let totalOnline = 0;
  let pakkaCash = 0;
  let kacchaCash = 0;

  const countedSaleIds = new Set<string>();

  (sales || []).forEach((sale: any) => {
    if (sale.payments && Array.isArray(sale.payments)) {
      sale.payments.forEach((payment: any) => {
        const payDate = getISTDateString(payment.paymentDate || sale.saleDate);
        if (payDate === todayStr) {
          const amt = Number(payment.amount) || 0;
          if (payment.paymentMode === "CASH") {
            totalCash += amt;
            if (sale.saleType === "PAKKA") pakkaCash += amt;
            else kacchaCash += amt;
          } else {
            totalOnline += amt;
          }
          countedSaleIds.add(sale.id);
        }
      });
    }

    // Fallback: if a sale was made today with payment but has no payment records
    // (edge case: amountPaid > 0 but payments array is empty or missing)
    if (!countedSaleIds.has(sale.id)) {
      const saleDate = getISTDateString(sale.saleDate);
      if (saleDate === todayStr && Number(sale.amountPaid) > 0) {
        const amt = Number(sale.amountPaid) || 0;
        const mode = sale.paymentMode || sale.payments?.[0]?.paymentMode || "CASH";
        if (mode === "CASH") {
          totalCash += amt;
          if (sale.saleType === "PAKKA") pakkaCash += amt;
          else kacchaCash += amt;
        } else {
          totalOnline += amt;
        }
      }
    }
  });

  (ledgers || []).forEach((ledger: any) => {
    if (ledger.payments && Array.isArray(ledger.payments)) {
      ledger.payments.forEach((payment: any) => {
         const payDate = getISTDateString(payment.paymentDate);
         if (payDate === todayStr) {
           const amt = Number(payment.amount) || 0;
           if (payment.paymentMode === "CASH") {
             totalCash += amt;
             // Internal ledgers for customers are always Portal (KACCHA)
             kacchaCash += amt;
           } else {
             totalOnline += amt;
           }
         }
      });
    }
  });

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="green.200"
      shadow="sm"
    >
      <HStack justify="space-between" mb={6}>
        <HStack gap={3}>
          <Box
            bg="green.500"
            p={2}
            borderRadius="lg"
            color="white"
            display="flex"
            alignItems="center"
          >
            <MdMonetizationOn size={20} />
          </Box>
          <Box>
            <Text fontWeight="bold" fontSize="lg" color="brand.900" lineHeight="1">
              Today's Collections
            </Text>
            <Text fontSize="xs" color="brand.400">
              Cash & Online payments received today
            </Text>
          </Box>
        </HStack>

        <VStack align="end" gap={0}>
          <Text fontSize="2xl" fontWeight="black" color="green.600">
            ₹{totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text fontSize="xs" color="green.600" fontWeight="bold">
            Total Cash
          </Text>
        </VStack>
      </HStack>

      <Grid templateColumns="1fr" gap={4}>
        <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.100">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="bold" color="green.800">CASH COLLECTION</Text>
            <Text fontSize="md" fontWeight="black" color="green.700">₹{totalCash.toLocaleString()}</Text>
          </HStack>

          {isSuperAdmin && (
            <HStack justify="space-between" pl={2} pr={2} mt={2}>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="green.600">Online Portal</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.800">₹{pakkaCash.toLocaleString()}</Text>
              </VStack>
              <VStack align="end" gap={0}>
                <Text fontSize="xs" color="green.600">Portal</Text>
                <Text fontSize="sm" fontWeight="bold" color="green.800">₹{kacchaCash.toLocaleString()}</Text>
              </VStack>
            </HStack>
          )}
        </Box>

        <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.100">
          <HStack justify="space-between">
            <HStack color="blue.700">
              <MdAccountBalanceWallet />
              <Text fontSize="sm" fontWeight="bold">ONLINE COLLECTION</Text>
            </HStack>
            <Text fontSize="md" fontWeight="black" color="blue.700">₹{totalOnline.toLocaleString()}</Text>
          </HStack>
        </Box>
      </Grid>
    </Box>
  );
};

export default CashSaleCard;
