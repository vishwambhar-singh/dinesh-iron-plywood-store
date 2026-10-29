import { Box, Text, Grid, GridItem, Stack, Badge } from "@chakra-ui/react";
import { MdInventory, MdStorefront, MdTrendingUp } from "react-icons/md";
import { Product } from "@/types/inventory";

interface Props {
  inventory: Product[];
}

const InventorySummaryCard = ({ inventory }: Props) => {
  const totals = inventory
    .filter((item) => Number(item.availableStock) >= 0)
    .reduce(
      (acc, item) => {
        const stock = Number(item.availableStock) || 0;
        const buyPrice = Number(item.buyingPrice) || 0;
        const sellPrice = Number(item.sellingPrice) || 0;
        const cRate = Number(item.conversionRate);

        acc.totalBuyingValue += stock * buyPrice * cRate;
        acc.totalSellingValue += stock * sellPrice * cRate;
        return acc;
      },
      { totalBuyingValue: 0, totalSellingValue: 0 },
    );

  const potentialProfit = totals.totalSellingValue - totals.totalBuyingValue;

  const profitMargin =
    totals.totalBuyingValue > 0
      ? ((potentialProfit / totals.totalBuyingValue) * 100).toFixed(1)
      : 0;

  const cardData = [
    {
      label: "Total Stock Value",
      value: totals.totalBuyingValue,
      subtext: "Based on Buying Price",
      icon: MdInventory,
      color: "blue.600",
      bg: "blue.50",
      borderColor: "blue.200",
    },
    {
      label: "Estimated Market Value",
      value: totals.totalSellingValue,
      subtext: "Based on Selling Price",
      icon: MdStorefront,
      color: "green.600",
      bg: "green.50",
      borderColor: "green.200",
    },
    {
      label: "Expected Gross Profit",
      value: Math.max(0, potentialProfit),
      subtext: "If all stock is sold",
      badge: `${profitMargin}% Margin`,
      icon: MdTrendingUp,
      color: "purple.600",
      bg: "purple.50",
      borderColor: "purple.200",
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
            borderColor={card.borderColor}
            shadow="sm"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              left={0}
              top={0}
              bottom={0}
              w="4px"
              bg={card.color}
            />

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
                <card.icon size={26} />
              </Box>
              <Box flex="1">
                <Stack direction="row" justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="bold" color="gray.600">
                    {card.label}
                  </Text>
                  {card.badge && (
                    <Badge colorPalette="purple" variant="subtle" size="sm">
                      {card.badge}
                    </Badge>
                  )}
                </Stack>
                <Text fontSize="2xl" fontWeight="black" color="gray.800" mt={1}>
                  ₹
                  {card.value.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text fontSize="xs" fontWeight="medium" color="gray.400" mt={1}>
                  {card.subtext}
                </Text>
              </Box>
            </Stack>
          </Box>
        </GridItem>
      ))}
    </Grid>
  );
};

export default InventorySummaryCard;
