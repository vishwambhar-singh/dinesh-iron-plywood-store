import { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Table,
  Avatar,
  Center,
  VStack,
} from "@chakra-ui/react";
import { MdPayments } from "react-icons/md";
import { CustomTable } from "../ui/CustomTable";
import { useGetSalesQuery, useGetCustomersQuery, useGetVouchersQuery, useGetReturnsQuery } from "@/store/apiSlice";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useNavigate } from "react-router-dom";
import SearchBar from "../ui/SearchBar";

const BalanceReceivable = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { customerCreditDays } = useSystemSettings();
  const [activeTab] = useState<string>("pakka");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: sales, isLoading: isLoadingSales, isError: isErrorSales } = useGetSalesQuery();
  const { data: customers, isLoading: isLoadingCust, isError: isErrorCust } = useGetCustomersQuery();
  const { data: vouchers, isLoading: isLoadingVouch, isError: isErrorVouch } = useGetVouchersQuery();
  const { isLoading: isLoadingReturns, isError: isErrorReturns } = useGetReturnsQuery();

  const isLoading = isLoadingSales || isLoadingCust || isLoadingVouch || isLoadingReturns;
  const isError = isErrorSales || isErrorCust || isErrorVouch || isErrorReturns;

  if (isLoading) return <CustomSpinner message="Fetching Receivables..." />;

  if (isError)
    return (
      <Center p={10}>
        <Text color="red.600">Error loading sales data</Text>
      </Center>
    );

  const processSalesData = (type: string) => {
    const customerMap: Record<string, any> = {};

    (customers || []).forEach((customer: any) => {
      const customerKey = customer.id;
      customerMap[customerKey] = {
        id: customerKey,
        customerId: customer.id,
        name: customer.name,
        totalSales: 0,
        pendingBalance: Number(customer.openingBalance) || 0,
        oldestSaleDate: Infinity,
      };
    });

    (sales || [])
      .filter((sale: any) =>
        isSuperAdmin ? true : sale.saleType?.toLowerCase() === type.toLowerCase(),
      )
      .forEach((sale: any) => {
        const customerKey = sale.customerId || sale.customerName?.trim().toLowerCase() || "unknown";

        if (!customerMap[customerKey]) {
          customerMap[customerKey] = {
            id: sale.id,
            customerId: customerKey,
            name: sale.customerName || "Unknown Customer",
            totalSales: 0,
            pendingBalance: 0,
            oldestSaleDate: Infinity,
          };
        }

        customerMap[customerKey].totalSales += Number(sale.totalAmount);
        
        if (isSuperAdmin) {
          customerMap[customerKey].pendingBalance += Number(sale.balance) + Number(sale.discount || 0);
        } else {
          customerMap[customerKey].pendingBalance += Number(sale.balance);
        }

        if (Number(sale.balance) > 0) {
          const currentSaleDate = new Date(sale.saleDate).getTime();
          if (currentSaleDate < customerMap[customerKey].oldestSaleDate) {
            customerMap[customerKey].oldestSaleDate = currentSaleDate;
          }
        }
      });

    (vouchers || [])
      .filter(
        (v: any) =>
          v.relatedEntityType === "CUSTOMER" &&
          v.status === "APPROVED"
      )
      .forEach((voucher: any) => {
        const customerKey = voucher.relatedEntityId;
        if (customerMap[customerKey]) {
          const amount = Number(voucher.amount) || 0;
          if (voucher.transactionSide === "DEBIT") {
            customerMap[customerKey].pendingBalance += amount;
          } else {
            customerMap[customerKey].pendingBalance -= amount;
          }
        }
      });


    return Object.values(customerMap)
      .filter((item: any) => Math.round(item.pendingBalance * 100) / 100 > 0)
      .map((item: any) => {
        let timestamp = item.oldestSaleDate;
        if (timestamp === Infinity) {
          timestamp = Date.now();
        }
        const dueDate = new Date(timestamp);
        dueDate.setDate(dueDate.getDate() + customerCreditDays);
        return { ...item, dueDate };
      })
      .sort((a, b) => b.pendingBalance - a.pendingBalance);
  };

  const filteredData = processSalesData(activeTab).filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalReceivable = filteredData.reduce(
    (sum, item) => sum + item.pendingBalance,
    0,
  );

  const columns = [
    { label: "Customer", align: "start" as const },
    { label: "Total Sales", align: "start" as const },
    { label: "Pending", align: "start" as const },
    { label: "Due Date", align: "start" as const },
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
            bg="green.600"
            p={2}
            borderRadius="lg"
            color="white"
            display="flex"
            alignItems="center"
          >
            <MdPayments size={20} />
          </Box>
          <Box>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="brand.900"
              lineHeight="1"
            >
              Customer Receivables
            </Text>
            <Text fontSize="xs" color="brand.400">
              Money to collect
            </Text>
          </Box>
        </HStack>

        <VStack align="end" gap={0}>
          <Text fontSize="xl" fontWeight="black" color="green.600">
            ₹{totalReceivable.toLocaleString()}
          </Text>
        </VStack>
      </HStack>

        <HStack justify="flex-end" mb={4}>
          <Box maxW="300px" w="full">
            <SearchBar
              placeholder="Search customer..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Box>
        </HStack>

        <CustomTable
          columns={columns}
          data={filteredData}
          maxRows={5}
          renderRow={(item: any, index: number) => (
            <Table.Row key={index} _hover={{ bg: "green.50/30" }}>
              <Table.Cell py={3} px={4}>
                <HStack gap={3}>
                  <Avatar.Root size="xs" bg="brand.100" color="brand.700">
                    <Avatar.Fallback name={item.name} />
                  </Avatar.Root>
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
                        `/customers?openHistory=${item.customerId}&tab=${isSuperAdmin ? "all" : "pakka"}`,
                      );
                    }}
                  >
                    {item.name}
                  </Text>
                </HStack>
              </Table.Cell>

              <Table.Cell py={3} px={4} fontSize="sm">
                ₹{item.totalSales.toLocaleString()}
              </Table.Cell>

              <Table.Cell py={3} px={4} fontWeight="bold" color="green.700">
                ₹{item.pendingBalance.toLocaleString()}
              </Table.Cell>

              <Table.Cell py={3} px={4} fontSize="sm" color="brand.500">
                {item.dueDate.toLocaleDateString("en-IN")}
              </Table.Cell>
            </Table.Row>
          )}
        />
      </Box>
  );
};

export default BalanceReceivable;
