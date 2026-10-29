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
import {
  useGetSalesQuery,
  useGetExpensesQuery,
  useGetReturnsQuery,
} from "@/store/apiSlice";
import { useAuth } from "@/hooks/useAuth";
import { getSafeDate, getISTDateString } from "@/utils/dateUtils";
import { CustomSpinner } from "../ui/CustomSpinner";

const RevenueGraph = () => {
  const { isSuperAdmin } = useAuth();
  const [brand600, brand500] = useToken("colors", ["brand.600", "brand.500"]);
  const [billType, setBillType] = useState<string>(
    isSuperAdmin ? "all" : "pakka",
  );
  const [timeRange, setTimeRange] = useState<string>("monthly");

  const { data: sales, isLoading: salesLoading } = useGetSalesQuery();
  const { data: expenses, isLoading: expensesLoading } = useGetExpensesQuery();
  const { data: returns, isLoading: returnLoading } = useGetReturnsQuery();

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (currentYear - i).toString()),
    [currentYear],
  );

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

  const processData = (
    sData: any[],
    rData: any[],
    eData: any[],
    label: string,
  ) => {
    const totalE = eData.reduce(
      (sum: number, e: any) =>
        e.status === "APPROVED" ? sum + Number(e.amount || 0) : sum,
      0,
    );
    const pakkaB = sData
      .filter((s: any) =>
        isSuperAdmin ? s.saleType?.toLowerCase() === "pakka" : true,
      )
      .reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);
    const kacchaB = sData
      .filter((s: any) => s.saleType?.toLowerCase() === "kaccha")
      .reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);

    const totalS = pakkaB + kacchaB;

    const pakkaR = rData
      .filter((r: any) =>
        isSuperAdmin ? r.saleType?.toLowerCase() === "pakka" : true,
      )
      .reduce((sum: number, r: any) => sum + Number(r.totalAmount || 0), 0);

    const kacchaR = rData
      .filter((r: any) => r.saleType?.toLowerCase() === "kaccha")
      .reduce((sum: number, r: any) => sum + Number(r.totalAmount || 0), 0);

    const totalR = pakkaR + kacchaR;

    let finalRevenue = 0;
    let saleAmount = 0;
    let returnAmount = 0;
    let expenseAmount = 0;

    if (!isSuperAdmin) {
      saleAmount = pakkaB;
      returnAmount = pakkaR;
      expenseAmount = totalE;
      finalRevenue = saleAmount - returnAmount - expenseAmount;
    } else {
      if (billType === "all") {
        saleAmount = totalS;
        returnAmount = totalR;
        expenseAmount = totalE;
        finalRevenue = saleAmount - returnAmount - expenseAmount;
      } else {
        const currentCategorySale = billType === "pakka" ? pakkaB : kacchaB;
        const currentCategoryReturn = billType === "pakka" ? pakkaR : kacchaR;
        saleAmount = currentCategorySale;
        if (totalS > 0) {
          const ratio = currentCategorySale / totalS;
          expenseAmount = totalE * ratio;
          finalRevenue =
            currentCategorySale - currentCategoryReturn - expenseAmount;
        } else {
          expenseAmount = totalE;
          finalRevenue = -totalE;
        }
      }
    }

    return {
      label,
      revenue: finalRevenue,
      saleAmount: saleAmount,
      returnAmount: returnAmount,
      expenseAmount: expenseAmount,
    };
  };

  const chartData = useMemo(() => {
    if (!sales || !expenses) return [];

    if (timeRange === "monthly") {
      const days = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
      return [...Array(days)].map((_, i) => {
        const day = i + 1;
        const dateKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const daySales = sales.filter(
          (s: any) => getISTDateString(s.saleDate) === dateKey,
        );

        const dayReturns = returns?.filter(
          (r: any) => getISTDateString(r.returnDate) === dateKey,
        );

        const dayExp = expenses.filter(
          (e: any) => getISTDateString(e.date) === dateKey,
        );

        return processData(daySales, dayReturns || [], dayExp, day.toString());
      });
    }

    if (timeRange === "weekly") {
      return [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = getISTDateString(d);
        const daySales = sales.filter(
          (s: any) => getISTDateString(s.saleDate) === dateStr,
        );

        const dayReturns = returns?.filter(
          (r: any) => getISTDateString(r.returnDate) === dateStr,
        );

        const dayExp = expenses.filter(
          (e: any) => getISTDateString(e.date) === dateStr,
        );
        return processData(
          daySales,
          dayReturns || [],
          dayExp,
          d.toLocaleDateString("en-IN", { weekday: "short" }),
        );
      });
    }

    return [
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
    ].map((month, index) => {
      const mSales = sales.filter(
        (s: any) =>
          getSafeDate(s.saleDate).getMonth() === index &&
          getSafeDate(s.saleDate).getFullYear().toString() === timeRange,
      );

      const mReturns = returns?.filter(
        (r: any) =>
          getSafeDate(r.returnDate).getMonth() === index &&
          getSafeDate(r.returnDate).getFullYear().toString() === timeRange,
      );

      const mExp = expenses.filter(
        (e: any) =>
          getSafeDate(e.date).getMonth() === index &&
          getSafeDate(e.date).getFullYear().toString() === timeRange,
      );
      return processData(mSales, mReturns || [], mExp, month);
    });
  }, [
    sales,
    expenses,
    timeRange,
    currentYear,
    currentMonthIdx,
    billType,
    isSuperAdmin,
  ]);

  const totalVal = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenue, 0),
    [chartData],
  );

  if (salesLoading || expensesLoading || returnLoading)
    return <CustomSpinner message="Syncing Data..." />;

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
              Revenue Stream
            </Text>
            <HStack gap={2} align="baseline">
              <Text fontSize="2xl" fontWeight="black" color="brand.600">
                ₹{totalVal.toLocaleString()}
              </Text>
              <Text fontSize="xs" color="brand.400">
                Net Earnings
              </Text>
            </HStack>
          </Box>
          <SelectRoot
            collection={collection}
            size="sm"
            width="160px"
            value={[timeRange]}
            onValueChange={(e) => e.value[0] && setTimeRange(e.value[0])}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              {collection.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </HStack>

        {isSuperAdmin && (
          <Tabs.Root
            value={billType}
            onValueChange={(e) => setBillType(e.value)}
            variant="subtle"
            size="sm"
          >
            <Tabs.List gap={4}>
              <Tabs.Trigger value="all" fontWeight="bold">
                Total
              </Tabs.Trigger>
              <Tabs.Trigger value="pakka" fontWeight="bold">
                Online Portal
              </Tabs.Trigger>
              <Tabs.Trigger value="kaccha" fontWeight="bold">
                Portal
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        )}

        <Box h="300px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revSlope" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brand500} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={brand500} stopOpacity={0} />
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
                formatter={(_value: any, _name: any, props: any) => {
                  const data = props?.payload;
                  if (!data) return [null, null] as any;
                  return [
                    `Net: ₹${data.revenue.toLocaleString()} | Sale: ₹${data.saleAmount.toLocaleString()} | Return: ₹${data.returnAmount?.toLocaleString() || 0} | Exp: ₹${data.expenseAmount.toLocaleString()}`,
                    "Earnings",
                  ] as [string, string];
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={brand600}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revSlope)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </VStack>
    </Box>
  );
};

export default RevenueGraph;
