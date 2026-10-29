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
import { MdWarning } from "react-icons/md";
import { CustomTable } from "../ui/CustomTable";
import { Product } from "@/types/inventory";
import { useGetInventoryQuery } from "@/store/apiSlice";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useNavigate } from "react-router-dom";

const LowStockCard = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { minThreshold } = useSystemSettings();
  const { data: products, isLoading, isError } = useGetInventoryQuery();

  const [activeTab, setActiveTab] = useState<string>("pakka");
  const lowStockValue = Number(minThreshold);

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

      const isLowStock =
        Number(item.availableStock) >= 0 &&
        Number(item.availableStock) < lowStockValue;

      return isSameType && isLowStock;
    })
    .sort(
      (a: any, b: any) => Number(a.availableStock) - Number(b.availableStock),
    );

  const columns = [
    { label: "Product Name", align: "start" as const },
    { label: "Current Stock", align: "start" as const },
    { label: "Status", align: "start" as const },
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
            bg="brand.50"
            p={2}
            borderRadius="lg"
            color="brand.600"
            display="flex"
            alignItems="center"
          >
            <MdWarning size={20} />
          </Box>
          <Box>
            <Text
              fontWeight="bold"
              fontSize="lg"
              color="brand.900"
              lineHeight="1"
            >
              Low Stock Alerts
            </Text>
            <Text fontSize="xs" color="brand.400">
              Threshold: {lowStockValue} units
            </Text>
          </Box>
        </HStack>

        <Badge
          colorPalette="teal"
          variant="subtle"
          px={3}
          py={1}
          borderRadius="full"
        >
          {filteredItems.length} Items Low
        </Badge>
      </HStack>

      <Tabs.Root
        value={activeTab}
        onValueChange={(details) => setActiveTab(details.value)}
      >
        {isSuperAdmin && (
          <Tabs.List mb={4} borderBottom="1px solid" borderColor="brand.100">
            <Tabs.Trigger
              value="pakka"
              px={6}
              fontWeight="bold"
              _selected={{ color: "brand.600", borderColor: "brand.600" }}
            >
              Online Portal
            </Tabs.Trigger>
            <Tabs.Trigger
              value="kaccha"
              px={6}
              fontWeight="bold"
              _selected={{ color: "brand.600", borderColor: "brand.600" }}
            >
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
              <Table.Row key={index} _hover={{ bg: "brand.50" }}>
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
                  color={
                    Number(item.availableStock) <= 2 ? "red.600" : "brand.700"
                  }
                  fontWeight="bold"
                >
                  {item.availableStock}
                </Table.Cell>
                <Table.Cell py={3} px={4}>
                  <Badge
                    variant="plain"
                    size="sm"
                    color={
                      Number(item.availableStock) <= 2
                        ? "red.600"
                        : "orange.500"
                    }
                    p={0}
                  >
                    {Number(item.availableStock) <= 2 ? "CRITICAL" : "LOW"}
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

export default LowStockCard;
