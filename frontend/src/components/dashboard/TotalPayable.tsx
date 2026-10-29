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
import { MdOutlinePayments } from "react-icons/md";
import { CustomTable } from "../ui/CustomTable";
import { useGetSuppliersQuery } from "@/store/apiSlice";
import { Supplier } from "@/types/supplier";
import { useNavigate } from "react-router-dom";
import SearchBar from "../ui/SearchBar";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const TotalPayable = () => {
  const { isSuperAdmin } = useAuth();
  const { supplierCreditDays } = useSystemSettings();
  const { data: suppliers, isLoading, isError } = useGetSuppliersQuery();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) return <CustomSpinner message="Fetching Suppliers..." />;
  if (isError)
    return (
      <Center p={10}>
        <Text color="red.600">Error loading suppliers</Text>
      </Center>
    );

  const processSuppliers = () => {
    const supplierMap: Record<string, any> = {};

    (suppliers || []).forEach((s: Supplier) => {
      const sid = s.id as string;
      if (sid && !supplierMap[sid]) {
        supplierMap[sid] = {
          supplierId: sid,
          name: s.name,
          totalAmount: 0,
          pendingBalance: Number(s.openingBalance) || 0,
          oldestBillDate: Infinity,
        };
      }

      if (s.bills && s.bills.length > 0) {
        s.bills.forEach((bill) => {
          const totalAmt = Number(bill.totalAmount) || 0;
          let balance = Number(bill.balanceAmount) || 0;
          
          if (isSuperAdmin) {
            balance += Number(bill.discount || 0);
          }

          const isCorrectType = true; // Backend already filters for non-super admins, and super admins want unified view

          if (isCorrectType && sid) {
            const dateToUse = bill.billDate || bill.createdAt;
            const currentDueDate = new Date(dateToUse).getTime();

            supplierMap[sid].totalAmount += totalAmt;
            supplierMap[sid].pendingBalance += balance;

            if (balance > 0 && currentDueDate < supplierMap[sid].oldestBillDate) {
              supplierMap[sid].oldestBillDate = currentDueDate;
            }
          }
        });
      }
    });

    return Object.values(supplierMap)
      .filter((item: any) => Math.round(item.pendingBalance * 100) / 100 > 0)
      .map((item: any) => {
        let timestamp = item.oldestBillDate;
        if (timestamp === Infinity) {
          timestamp = Date.now();
        }
        const dueDate = new Date(timestamp);
        dueDate.setDate(dueDate.getDate() + (supplierCreditDays || 0));
        return { ...item, dueDate };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  };

  const allFilteredData = processSuppliers().filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalDisplayBalance = allFilteredData.reduce(
    (sum: any, item: any) => sum + item.pendingBalance,
    0,
  );

  const columns = [
    { label: "Supplier", align: "start" as const },
    { label: "Total Amt", align: "start" as const },
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
            bg="brand.500"
            p={2}
            borderRadius="lg"
            color="white"
            display="flex"
            alignItems="center"
          >
            <MdOutlinePayments size={20} />
          </Box>
          <Box>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="brand.900"
              lineHeight="1"
            >
              Total Payable
            </Text>
            <Text fontSize="xs" color="brand.400">
              Outstanding Dues
            </Text>
          </Box>
        </HStack>

        <VStack align="end" gap={0}>
          <Text fontSize="xl" fontWeight="black" color="red.600">
            ₹{totalDisplayBalance.toLocaleString()}
          </Text>
        </VStack>
      </HStack>

        <HStack justify="flex-end" mb={4}>
          <Box maxW="300px" w="full">
            <SearchBar
              placeholder="Search supplier..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Box>
        </HStack>

        <CustomTable
          columns={columns}
          data={allFilteredData}
          maxRows={5}
          renderRow={(item: any, index: number) => (
            <Table.Row key={index} _hover={{ bg: "brand.50" }}>
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
                    textTransform="capitalize"
                    _hover={{
                      textDecoration: "underline",
                      color: "brand.800",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/suppliers?openHistory=${item.supplierId}&tab=${isSuperAdmin ? "all" : "pakka"}`,
                      );
                    }}
                  >
                    {item.name}
                  </Text>
                </HStack>
              </Table.Cell>

              <Table.Cell py={3} px={4} fontSize="sm" color="brand.600">
                ₹{item.totalAmount.toLocaleString()}
              </Table.Cell>

              <Table.Cell py={3} px={4} fontWeight="bold" color="red.600">
                ₹{item.pendingBalance.toLocaleString()}
              </Table.Cell>

              <Table.Cell py={3} px={4} fontSize="sm" color="brand.500">
                {item.dueDate
                  ? item.dueDate.toLocaleDateString("en-IN")
                  : "N/A"}
              </Table.Cell>
            </Table.Row>
          )}
        />
      </Box>
  );
};

export default TotalPayable;
