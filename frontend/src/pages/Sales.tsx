import {
  Badge,
  Box,
  Flex,
  HStack,
  Heading,
  Icon,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import SalesTable from "@/components/sales/SalesTable";
import { SalesModal } from "@/components/sales/SalesModal";
import { MdAdd, MdOutlineDownload, MdTrendingUp } from "react-icons/md";
import { Sale } from "@/types/sales";
import { ModalMode } from "@/types/inventory";
import {
  useGetInventoryQuery,
  useGetSalesQuery,
  useAddSaleMutation,
  useDeleteSaleMutation,
  useAddReturnMutation,
  useGetReturnsQuery,
  useUpdateSaleMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { ReturnModal } from "@/components/sales/ReturnModal";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import SearchBar from "@/components/ui/SearchBar";
import SalesSummaryCard from "@/components/sales/SalesSummaryCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getISTDateString, getSafeDate } from "@/utils/dateUtils";
import { transformSalesData } from "@/exportConfigs/salesExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import PaymentSummaryCard from "@/components/sales/PaymentSummaryCard";
import { AnomaliesTab } from "@/components/sales/AnomaliesTab";

const Sales = () => {
  const { isSuperAdmin } = useAuth();
  const { exportFormat } = useSystemSettings();
  const { data: allProducts = [] } = useGetInventoryQuery();
  const { data: allSales = [], isLoading } = useGetSalesQuery();
  const { data: allReturns = [] } = useGetReturnsQuery();

  const [createSale, { isLoading: isCreatingSale }] = useAddSaleMutation();
  const [updateSale, { isLoading: isUpdatingSale }] = useUpdateSaleMutation();
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation();
  const [createReturn, { isLoading: isCreatingReturn }] = useAddReturnMutation();

  const [activeTab, setActiveTab] = useState<string>("pakka");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | undefined>();
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [returnConfirmationData, setReturnConfirmationData] = useState<any>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "day" | "month" | "year" | "all"
  >("all");

  const [tempDates, setTempDates] = useState({ start: "", end: "" });
  const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);

  const sortedAllSales = useMemo(() => {
    return [...allSales].sort((a, b) => {
      const getBillNum = (invoice?: string) => {
        if (!invoice) return null;
        const match = invoice.trim().match(/\/(\d+)$/);
        return match && match[1] ? parseInt(match[1], 10) : null;
      };

      const numA = getBillNum(a.invoiceNumber);
      const numB = getBillNum(b.invoiceNumber);

      if (numA !== null && numB !== null) {
        return numB - numA;
      }

      if (numA !== null) return -1;
      if (numB !== null) return 1;

      const dateA = new Date((a as any).createdAt || a.saleDate || 0).getTime();
      const dateB = new Date((b as any).createdAt || b.saleDate || 0).getTime();
      return dateB - dateA;
    });
  }, [allSales]);

  const activeTabSales = useMemo(() => {
    return sortedAllSales.filter((s) => {
      if (activeTab === "all") return true;
      return s.saleType === activeTab.toUpperCase();
    });
  }, [sortedAllSales, activeTab]);

  const latestBillNo =
    activeTabSales.length > 0 ? activeTabSales[0].invoiceNumber : undefined;

  const filteredSales = useMemo(() => {
    return sortedAllSales.filter((s: Sale) => {
      const matchesTab = isSuperAdmin
        ? activeTab === "all"
          ? true
          : s.saleType === activeTab.toUpperCase()
        : true;

      const matchesSearch =
        s.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerMobile?.includes(searchQuery);

      const saleDateStr = getISTDateString(s.saleDate);
      const todayStr = getISTDateString(new Date());

      let matchesTime = true;

      if (timeFilter !== "all") {
        if (saleDateStr && todayStr) {
          if (timeFilter === "day") {
            matchesTime = saleDateStr === todayStr;
          } else if (timeFilter === "month") {
            const sParts = saleDateStr.split("-");
            const tParts = todayStr.split("-");
            matchesTime = sParts[0] === tParts[0] && sParts[1] === tParts[1];
          } else if (timeFilter === "year") {
            matchesTime = saleDateStr.split("-")[0] === todayStr.split("-")[0];
          }
        } else {
          matchesTime = false;
        }
      }

      let matchesDate = true;

      if (appliedDates.start && appliedDates.end) {
        const sDate = getSafeDate(s.saleDate).getTime();

        const start = getSafeDate(appliedDates.start);
        const end = getSafeDate(appliedDates.end);

        end.setHours(23, 59, 59, 999);

        matchesDate = sDate >= start.getTime() && sDate <= end.getTime();
      }

      return matchesTab && matchesSearch && matchesTime && matchesDate;
    });
  }, [sortedAllSales, activeTab, searchQuery, timeFilter, appliedDates]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p: any) =>
      isSuperAdmin ? p.inventoryType === activeTab.toUpperCase() : true,
    );
  }, [allProducts, activeTab]);

  const filteredReturns = useMemo(() => {
    return allReturns.filter(
      (r: any) => r.saleType === activeTab.toUpperCase(),
    );
  }, [allReturns, activeTab]);

  const currentReturn = useMemo(() => {
    if (!selectedSale) return [];

    return filteredReturns.filter(
      (r: any) => r.originalSaleId === selectedSale.id,
    );
  }, [selectedSale, filteredReturns]);

  const handleRecordSale = () => {
    setSelectedSale(undefined);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleView = (sale: Sale) => {
    setSelectedSale(sale);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleReturn = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReturnModalOpen(true);
  };
  const handleDeleteTrigger = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  const handleDelete = async () => {
    if (saleToDelete) {
      try {
        await deleteSale(saleToDelete.id).unwrap();
        toast.success("Sale deleted successfully");
        setSaleToDelete(null);
      } catch (error) {
        toast.error("Failed to delete sale");
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const isEdit = !!data.id;

      if (isEdit) {
        const payload = {
          ...data,
        };
        await updateSale(payload).unwrap();
        toast.success("Sale updated successfully");
      } else {
        const payload = {
          ...data,
          saleType: activeTab.toUpperCase(),
          invoiceNumber: data?.billNo,
        };
        await createSale(payload).unwrap();
        toast.success("Sale recorded successfully");
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error("Operation failed");
    }
  };
  const handleReturnSubmit = async (returnData: any) => {
    try {
      const payload = {
        ...returnData,
        return_number: returnData.return_number || `RET-${Date.now()}`,
      };

      await createReturn(payload).unwrap();

      toast.success("Return processed and stock updated");
      setIsReturnModalOpen(false);
      setReturnConfirmationData(null);
    } catch (error: any) {
      if (error?.data?.code === "PRODUCT_MISSING_CONFIRMATION_REQUIRED") {
        setReturnConfirmationData({
          ...returnData,
          return_number: returnData.return_number || `RET-${Date.now()}`,
          force_recreate_missing: true,
          message: error.data.message || "Product is missing from inventory. Do you want to manually recreate it?",
        });
      } else {
        toast.error(error?.data?.message || "Failed to process return");
      }
    }
  };

  const handleExportExcel = () => {
    const data = transformSalesData(filteredSales);
    handleExport(data, exportFormat, "sales_report");
  };

  const handleDateSearch = () => {
    setTimeFilter("all");
    setAppliedDates({
      start: tempDates.start,
      end: tempDates.end,
    });
  };

  const handleClearDateFilter = () => {
    setTempDates({ start: "", end: "" });
    setAppliedDates({ start: "", end: "" });
  };

  return (
    <Box w="full" p={{ base: 4, md: 8 }} bg="bg.canvas" minH="100vh">
      <Flex
        justify="space-between"
        align="center"
        bg="white"
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor="brand.100"
        shadow="sm"
        mb={8}
        wrap="wrap"
        gap={4}
      >
        <HStack gap={4}>
          <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
            <Icon as={MdTrendingUp} boxSize={6} />
          </Box>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Heading
                size="lg"
                letterSpacing="tight"
                color="brand.900"
                lineHeight="short"
              >
                Sales Management
              </Heading>
              <Badge
                colorPalette="brand"
                variant="subtle"
                size="sm"
                borderRadius="md"
              >
                Live
              </Badge>
            </HStack>
            <Text color="brand.500" fontSize="sm" fontWeight="medium">
              Track and manage your sales and revenue
            </Text>
          </Box>
        </HStack>

        <Flex align="center" gap={4} wrap="wrap">
          <HStack
            bg="gray.50"
            p="1.5"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
          >
            {[
              { label: "Today", value: "day" },
              { label: "Month", value: "month" },
              { label: "Year", value: "year" },
              { label: "All", value: "all" },
            ].map((btn) => (
              <Button
                key={btn.value}
                size="sm"
                variant={timeFilter === btn.value ? "solid" : "ghost"}
                colorPalette={timeFilter === btn.value ? "brand" : "gray"}
                onClick={() => setTimeFilter(btn.value as any)}
                borderRadius="lg"
                px={4}
                fontSize="xs"
                fontWeight="bold"
              >
                {btn.label}
              </Button>
            ))}
          </HStack>

          <Button
            colorPalette="brand"
            size="md"
            onClick={handleRecordSale}
            px={6}
            fontWeight="bold"
            borderRadius="lg"
            shadow="sm"
            _hover={{ transform: "translateY(-1px)", shadow: "md" }}
          >
            <Icon as={MdAdd} mr={1} boxSize={5} /> Record New Sale
          </Button>
        </Flex>
      </Flex>

      <Box flex="1" my={4}>
        <DateRangeFilter
          startDate={tempDates.start}
          endDate={tempDates.end}
          onStartChange={(val: any) =>
            setTempDates({ ...tempDates, start: val })
          }
          onEndChange={(val: any) => setTempDates({ ...tempDates, end: val })}
          onSearch={handleDateSearch}
          onClear={handleClearDateFilter}
        />
      </Box>

      <Box mb={8}>
        <SalesSummaryCard sales={filteredSales} />
      </Box>

      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Summary</Heading>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPaymentSummary((prev) => !prev)}
        >
          {showPaymentSummary ? "Hide Payment Summary" : "Show Payment Summary"}
        </Button>
      </Flex>

      {showPaymentSummary && (
        <Box mb={8}>
          <PaymentSummaryCard sales={filteredSales} />
        </Box>
      )}

      <Tabs.Root
        lazyMount
        value={activeTab}
        onValueChange={(e) => {
          setActiveTab(e.value);
          setTimeFilter("all");
        }}
      >
        {isSuperAdmin && (
          <Tabs.List bg="bg.muted" p="1" borderRadius="lg" width="full" maxW="500px" mb="4">
            <Tabs.Trigger value="pakka" flex="1">
              Online Portal
            </Tabs.Trigger>
            <Tabs.Trigger value="kaccha" flex="1">
              Portal
            </Tabs.Trigger>{" "}
            <Tabs.Trigger value="all" flex="1">
              All Sales
            </Tabs.Trigger>
            <Tabs.Trigger value="anomalies" flex="1">
              Anomalies
            </Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>
        )}

        <HStack gap="4" width="full" display={activeTab === "anomalies" ? "none" : "flex"}>
          <Box flex="1">
            <SearchBar
              placeholder="Search sales..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Box>
          <Button
            variant="outline"
            color="brand.500"
            onClick={handleExportExcel}
          >
            <MdOutlineDownload size="20px" /> Export
          </Button>
        </HStack>

        <Tabs.Content value="pakka">
          <SalesTable
            loading={isLoading}
            sales={filteredSales}
            onView={handleView}
            onDelete={handleDeleteTrigger}
            onReturn={handleReturn}
            activeTab={activeTab}
            onEdit={handleEdit}
          />
        </Tabs.Content>

        <Tabs.Content value="kaccha">
          <SalesTable
            loading={isLoading}
            sales={filteredSales}
            onView={handleView}
            onDelete={handleDeleteTrigger}
            onReturn={handleReturn}
            activeTab={activeTab}
            onEdit={handleEdit}
          />
        </Tabs.Content>

        {activeTab === "all" && (
          <Tabs.Content value="all">
            <SalesTable
              loading={isLoading}
              sales={filteredSales}
              onView={handleView}
              onDelete={handleDeleteTrigger}
              onReturn={handleReturn}
              activeTab={activeTab}
              onEdit={handleEdit}
            />
          </Tabs.Content>
        )}

        {isSuperAdmin && activeTab === "anomalies" && (
          <Tabs.Content value="anomalies">
            <AnomaliesTab />
          </Tabs.Content>
        )}
      </Tabs.Root>

      <SalesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        products={filteredProducts}
        sale={selectedSale}
        existingReturn={currentReturn}
        mode={modalMode}
        lastBillNumber={latestBillNo}
        loading={isCreatingSale || isUpdatingSale}
      />
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturnSubmit}
        sale={selectedSale}
        existingReturn={currentReturn}
        loading={isCreatingReturn}
      />
      <CustomDeleteDialog
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Sale?"
        description={`Are you sure you want to delete this sale? This action will permanently remove the sale and related records.`}
      />

      {returnConfirmationData && (
        <CustomDeleteDialog
          isOpen={!!returnConfirmationData}
          onClose={() => setReturnConfirmationData(null)}
          onConfirm={() => handleReturnSubmit(returnConfirmationData)}
          title="Missing Product Detected"
          description={returnConfirmationData.message}
          confirmText="Recreate"
          confirmColor="blue"
          loading={false}
        />
      )}
    </Box>
  );
};

export default Sales;
