import { useState, useMemo } from "react";
import {
  Box,
  Text,
  HStack,
  Tabs,
  VStack,
  createListCollection,
  useToken,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetSalesQuery, useGetReturnsQuery } from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import { getISTDateString, getSafeDate } from "@/utils/dateUtils";
import { CustomSpinner } from "../ui/CustomSpinner";

const SalesGraph = () => {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("totalSales");
  const [billType, setBillType] = useState<string>("total");
  const [timeRange, setTimeRange] = useState<string>("monthly");

  const {
    data: sales,
    isLoading: salesLoading,
    isError: salesError,
  } = useGetSalesQuery();
  const { data: returns, isLoading: returnsLoading } = useGetReturnsQuery();

  const [brand600, red600, gray400] = useToken("colors", [
    "brand.600",
    "red.600",
    "gray.400",
  ]);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, [currentYear]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Weekly", value: "weekly" },
          { label: "This Month", value: "monthly" },
          ...years.map((y) => ({ label: `Year ${y}`, value: y })),
        ],
      }),
    [years],
  );

  const chartData = useMemo(() => {
    if (!sales) return [];

    const filteredSales = sales.filter((s: any) =>
      isSuperAdmin
        ? billType === "total"
          ? true
          : s.saleType?.toLowerCase() === billType.toLowerCase()
        : true,
    );
    const filteredReturns = (returns || []).filter((r: any) =>
      isSuperAdmin
        ? billType === "total"
          ? true
          : r.saleType?.toLowerCase() === billType.toLowerCase()
        : true,
    );

    if (timeRange === "weekly") {
      return [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = getISTDateString(d);

        const daySales = filteredSales.filter((s: any) => {
          const sDate = getISTDateString(s.saleDate);
          return sDate === dateStr;
        });
        const dayReturns = filteredReturns.filter((r: any) => {
          const rDate = getISTDateString(r.returnDate);
          return rDate === dateStr;
        });

        return {
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          totalSales: daySales.reduce(
            (sum: number, s: any) => sum + Number(s.totalAmount),
            0,
          ),
          pendingBalance: daySales.reduce(
            (sum: number, s: any) =>
              sum + Number(s.balance > 0 ? s.balance : 0),
            0,
          ),
          totalReturns: dayReturns.reduce(
            (sum: number, r: any) => sum + Number(r.totalAmount),
            0,
          ),
        };
      });
    }

    if (timeRange === "monthly") {
      const daysInMonth = new Date(
        currentYear,
        currentMonthIdx + 1,
        0,
      ).getDate();
      return [...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const monthPart = String(currentMonthIdx + 1).padStart(2, "0");
        const dateKey = `${currentYear}-${monthPart}-${String(day).padStart(2, "0")}`;

        const daySales = filteredSales.filter((s: any) => {
          const sDate = getISTDateString(s.saleDate);
          return sDate === dateKey;
        });
        const dayReturns = filteredReturns.filter((r: any) => {
          const rDate = getISTDateString(r.returnDate);
          return rDate === dateKey;
        });

        return {
          label: day.toString(),
          totalSales: daySales.reduce(
            (sum: number, s: any) => sum + Number(s.totalAmount),
            0,
          ),
          pendingBalance: daySales.reduce(
            (sum: number, s: any) =>
              sum + Number(s.balance > 0 ? s.balance : 0),
            0,
          ),
          totalReturns: dayReturns.reduce(
            (sum: number, r: any) => sum + Number(r.totalAmount),
            0,
          ),
        };
      });
    }

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month, index) => {
      const monthSales = filteredSales.filter((s: any) => {
        const d = getSafeDate(s.saleDate);
        return (
          d.getMonth() === index && d.getFullYear().toString() === timeRange
        );
      });
      const monthReturns = filteredReturns.filter((r: any) => {
        const d = getSafeDate(r.returnDate);
        return (
          d.getMonth() === index && d.getFullYear().toString() === timeRange
        );
      });

      return {
        label: month,
        totalSales: monthSales.reduce(
          (sum: number, s: any) => sum + Number(s.totalAmount),
          0,
        ),
        pendingBalance: monthSales.reduce(
          (sum: number, s: any) => sum + Number(s.balance > 0 ? s.balance : 0),
          0,
        ),
        totalReturns: monthReturns.reduce(
          (sum: number, r: any) => sum + Number(r.totalAmount),
          0,
        ),
      };
    });
  }, [
    sales,
    returns,
    timeRange,
    currentYear,
    currentMonthIdx,
    billType,
    isSuperAdmin,
  ]);

  const grandTotal = useMemo(() => {
    return chartData.reduce(
      (sum, item) =>
        sum +
        (activeTab === "totalSales" ? item.totalSales : item.pendingBalance),
      0,
    );
  }, [chartData, activeTab]);

  if (salesLoading || returnsLoading)
    return <CustomSpinner message="Loading Analytics" />;
  if (salesError) return null;

  const activeColor = activeTab === "totalSales" ? brand600 : red600;

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="brand.200"
      shadow="sm"
    >
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <Box>
            <Text fontWeight="bold" fontSize="lg" color="brand.900">
              Sales Performance
            </Text>
            <HStack gap={2} align="baseline">
              <Text fontSize="2xl" fontWeight="black" color={activeColor}>
                ₹{grandTotal.toLocaleString()}
              </Text>
              <Text fontSize="xs" color="brand.400">
                Total {activeTab === "totalSales" ? "Sales" : "Balance"}
              </Text>
            </HStack>
          </Box>
          <HStack gap={3}>
            <SelectRoot
              collection={collection}
              size="sm"
              width="180px"
              value={[timeRange]}
              onValueChange={(e) => e.value[0] && setTimeRange(e.value[0])}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {collection.items.map((item) => (
                  <SelectItem item={item} key={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
            <Tabs.Root
              value={activeTab}
              onValueChange={(e) => setActiveTab(e.value)}
              variant="plain"
            >
              <Tabs.List bg="gray.100" p="1" borderRadius="md">
                <Tabs.Trigger
                  value="totalSales"
                  fontSize="xs"
                  fontWeight="bold"
                  _selected={{ bg: "white", color: "brand.600", shadow: "sm" }}
                >
                  Sales
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="pendingBalance"
                  fontSize="xs"
                  fontWeight="bold"
                  _selected={{ bg: "white", color: "red.600", shadow: "sm" }}
                >
                  Balance
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </HStack>
        </HStack>

        {isSuperAdmin && (
          <Tabs.Root
            value={billType}
            onValueChange={(e) => setBillType(e.value)}
            variant="subtle"
            size="sm"
          >
            <Tabs.List gap={4}>
              <Tabs.Trigger
                value="total"
                fontWeight="bold"
                _selected={{ color: "brand.600", borderBottom: "2px solid" }}
              >
                Total
              </Tabs.Trigger>

              <Tabs.Trigger
                value="pakka"
                fontWeight="bold"
                _selected={{ color: "brand.600", borderBottom: "2px solid" }}
              >
                Online Portal
              </Tabs.Trigger>
              <Tabs.Trigger
                value="kaccha"
                fontWeight="bold"
                _selected={{ color: "brand.600", borderBottom: "2px solid" }}
              >
                Portal
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )}

        <Box h="300px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSlope" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                fontSize={10}
                tick={{ fill: "#718096" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={10}
                tick={{ fill: "#718096" }}
                tickFormatter={(val) =>
                  `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
                labelFormatter={(label) => {
                  if (timeRange === "monthly") {
                    const months = [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ];
                    return `${label} ${months[currentMonthIdx]}`;
                  }
                  return label;
                }}
                formatter={(_value: any, name: any, props: any) => {
                  const data = props?.payload;
                  if (!data || name !== activeTab) return [null, null] as any;

                  if (activeTab === "totalSales") {
                    return [
                      `Sale: ₹${Number(data.totalSales).toLocaleString()} | Return: ₹${Number(data.totalReturns).toLocaleString()}`,
                      "Performance",
                    ] as [string, string];
                  }

                  return [
                    `₹${Number(data.pendingBalance).toLocaleString()}`,
                    "Pending Balance",
                  ] as [string, string];
                }}
              />
              <Area
                type="monotone"
                dataKey={activeTab}
                stroke={activeColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSlope)"
                animationDuration={1000}
              />
              {activeTab === "totalSales" && (
                <Area
                  type="monotone"
                  dataKey="totalReturns"
                  stroke={gray400}
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </VStack>
    </Box>
  );
};

export default SalesGraph;
