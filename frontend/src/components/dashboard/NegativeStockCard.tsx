import { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Badge,
  Table,
  Tabs,
  Center,
} from "@chakra-ui/react";
import { MdError } from "react-icons/md";
import { CustomTable } from "../ui/CustomTable";
import { Product } from "@/types/inventory";
import { useGetInventoryQuery } from "@/store/apiSlice";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const NegativeStockCard = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: products, isLoading, isError } = useGetInventoryQuery();

  const [activeTab, setActiveTab] = useState<string>("pakka");

  if (isLoading) return <CustomSpinner message="Checking Inventory..." />;

  if (isError)
    return (
      <Center
        p={10}
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.200"
      >
        <Text color="red.500">Error loading inventory</Text>
      </Center>
    );

  const filteredItems = (products || [])
    .filter((item: any) => {
      const isSameType = isSuperAdmin
        ? item.inventoryType?.toLowerCase() === activeTab.toLowerCase()
        : true;

      const isNegativeStock = Number(item.availableStock) < 0;

      return isSameType && isNegativeStock;
    })
    .sort(
      (a: any, b: any) => Number(a.availableStock) - Number(b.availableStock),
    );

  const columns = [
    { label: "Product Name", align: "start" as const },
    { label: "Current Stock", align: "center" as const },
    { label: "Status", align: "start" as const },
  ];

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="red.200"
      shadow="sm"
    >
      <HStack justify="space-between" mb={6}>
        <HStack gap={3}>
          <Box
            bg="red.50"
            p={2}
            borderRadius="lg"
            color="red.600"
            display="flex"
            alignItems="center"
          >
            <MdError size={20} />
          </Box>
          <Box>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="red.700"
              lineHeight="1"
            >
              Negative Stock Alerts
            </Text>
            <Text fontSize="xs" color="red.400">
              Items below 0 stock
            </Text>
          </Box>
        </HStack>

        <Badge
          colorPalette="red"
          variant="subtle"
          px={3}
          py={1}
          borderRadius="full"
        >
          {filteredItems.length} Critical
        </Badge>
      </HStack>

      <Tabs.Root
        value={activeTab}
        onValueChange={(details) => setActiveTab(details.value)}
      >
        {isSuperAdmin && (
          <Tabs.List mb={4} borderBottom="1px solid" borderColor="brand.100">
            <Tabs.Trigger value="pakka" px={6} fontWeight="bold">
              Online Portal
            </Tabs.Trigger>
            <Tabs.Trigger value="kaccha" px={6} fontWeight="bold">
              Portal
            </Tabs.Trigger>
          </Tabs.List>
        )}

        <Tabs.Content value={activeTab}>
          <CustomTable
            columns={columns}
            data={filteredItems}
            maxRows={5}
            renderRow={(item: Product, index: number) => (
              <Table.Row key={index} _hover={{ bg: "red.50" }}>
                <Table.Cell
                  py={3}
                  px={4}
                  color="brand.800"
                  fontWeight="bold"
                  textTransform="capitalize"
                  cursor="pointer"
                  _hover={{
                    textDecoration: "underline",
                    color: "brand.800",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inventory?viewItem=${item.id}&tab=${activeTab}`);
                  }}
                >
                  {item.name}
                </Table.Cell>

                <Table.Cell
                  py={3}
                  px={4}
                  color="red.600"
                  fontWeight="bold"
                  textAlign="center"
                >
                  {item.availableStock}
                </Table.Cell>

                <Table.Cell py={3} px={4}>
                  <Badge variant="solid" size="sm" colorPalette="red">
                    CRITICAL
                  </Badge>
                </Table.Cell>
              </Table.Row>
            )}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default NegativeStockCard;
