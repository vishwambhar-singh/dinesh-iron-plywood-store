import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Heading,
  Stack,
  Flex,
  Text,
  Tabs,
  HStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { BillingTable } from "@/components/billings/BillingTable";
import { BillingModal } from "@/components/billings/modal/BillingModal";
import { HistoryModal } from "@/components/billings/modal/HistoryModal";
import {
  useGetCompanyQuery,
  useGetDummyCompanyQuery,
  useGetReturnsQuery,
  useGetSalesQuery,
  useSendInvoiceMailMutation,
} from "@/store/apiSlice";
import { Sale } from "@/types/sales";
import { toast } from "@/utils/toast";
import { generateInvoicePDF, sendInvoiceEmail } from "@/utils/pdfGenerator";
import SearchBar from "@/components/ui/SearchBar";
import { useAuth } from "@/hooks/useAuth";
import SalesSummaryCard from "@/components/sales/SalesSummaryCard";
import { Button } from "@/components/ui/button";
import { MdOutlineDownload, MdReceiptLong } from "react-icons/md";
import { getISTDateString, getSafeDate } from "@/utils/dateUtils";
import { transformSalesData } from "@/exportConfigs/salesExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useSearchParams } from "react-router-dom";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import PaymentSummaryCard from "@/components/sales/PaymentSummaryCard";

export const BillingPage = () => {
  const { isSuperAdmin } = useAuth();
  const { exportFormat, invoiceTerms } = useSystemSettings();
  const { data: allSales = [], isLoading } = useGetSalesQuery();
  const { data: allReturns = [] } = useGetReturnsQuery();
  const { data: companyData = [] } = useGetCompanyQuery();
  const { data: dummyCompanyData = [] } = useGetDummyCompanyQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const [sendMail] = useSendInvoiceMailMutation();

  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = useState<string>("pakka");
  const [customerHistory, setCustomerHistory] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "day" | "month" | "year" | "all"
  >("all");

  const [tempDates, setTempDates] = useState({ start: "", end: "" });
  const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const viewSaleId = searchParams.get("viewSale");
    const tabParam = searchParams.get("tab");

    if (viewSaleId && allSales.length > 0) {
      const exists = allSales.find((s: any) => s.id === viewSaleId);

      if (tabParam) {
        setActiveTab(tabParam);
      }

      if (exists) {
        setSelectedBill(exists);
        setIsBillingOpen(true);
        setModalMode("view");

        const newParams = new URLSearchParams(searchParams);
        newParams.delete("viewSale");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, allSales, setSearchParams]);

  const currentSaleReturns = useMemo(() => {
    if (!selectedBill) return [];
    return allReturns.filter((r: any) => r.originalSaleId === selectedBill.id);
  }, [allReturns, selectedBill]);

  const filteredSales = useMemo(() => {
    return allSales.filter((s: Sale) => {
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
  }, [allSales, activeTab, searchQuery, timeFilter, appliedDates]);

  const groupedSales = useMemo(() => {
    const groups: Record<string, Sale> = {};

    filteredSales.forEach((sale) => {
      const mobile = sale.customerMobile?.trim();
      const email = sale.customerEmail?.trim().toLowerCase();
      const name = sale.customerName?.trim().toLowerCase();

      const customerKey = mobile || email || name;

      if (!customerKey) return;

      if (!groups[customerKey]) {
        groups[customerKey] = sale;
      } else {
        const existingDate =
          getISTDateString(groups[customerKey].saleDate) || "";
        const currentDate = getISTDateString(sale.saleDate) || "";

        if (currentDate > existingDate) {
          groups[customerKey] = sale;
        }
      }
    });

    return Object.values(groups);
  }, [filteredSales]);

  const handleHistoryAction = (b: Sale) => {
    setSelectedBill(b);

    const mobile = b.customerMobile?.trim();
    const email = b.customerEmail?.trim().toLowerCase();
    const name = b.customerName?.trim().toLowerCase();

    const historyForCustomer = allSales.filter((s) => {
      const saleMobile = s.customerMobile?.trim();
      const saleEmail = s.customerEmail?.trim().toLowerCase();
      const saleName = s.customerName?.trim().toLowerCase();

      if (mobile && saleMobile) {
        return saleMobile === mobile;
      }

      if (!mobile && email && saleEmail) {
        return saleEmail === email;
      }

      if (!mobile && !email && name && saleName) {
        return saleName === name;
      }

      return false;
    });

    const sortedHistory = [...historyForCustomer].sort((a, b) => {
      const dateA = getISTDateString(a.saleDate) || "";
      const dateB = getISTDateString(b.saleDate) || "";
      return dateB.localeCompare(dateA);
    });

    setCustomerHistory(sortedHistory);
    setIsHistoryOpen(true);
  };

  const handleBillingAction = (mode: "view" | "edit", b: Sale) => {
    setModalMode(mode);
    setSelectedBill(b);
    setIsBillingOpen(true);
  };

  const handleEditFromHistory = (invoice: Sale) => {
    setSelectedBill(invoice);
    setModalMode("edit");
    setIsBillingOpen(true);
  };

  const handleViewFromHistory = (invoice: Sale) => {
    setSelectedBill(invoice);
    setModalMode("view");
    setIsBillingOpen(true);
  };

  const handleDownloadPdf = (sale: any) => {
    const activeCompany = isSuperAdmin
      ? sale.saleType === "PAKKA"
        ? companyData
        : dummyCompanyData
      : companyData;
    generateInvoicePDF(sale, activeCompany, allReturns, invoiceTerms);
  };

  const handleSendEmailPdf = async (sale: any) => {
    try {
      const activeCompany = isSuperAdmin
        ? sale.saleType === "PAKKA"
          ? companyData
          : dummyCompanyData
        : companyData;

      await sendInvoiceEmail(
        sendMail,
        sale,
        activeCompany,
        allReturns,
        invoiceTerms,
      );

      toast.success("Mail sent successfully!");
    } catch (error: any) {
      toast.error(error.message || error?.data?.message || "Failed to send mail.");
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
      <Stack gap={6}>
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
              <Icon as={MdReceiptLong} boxSize={6} />
            </Box>
            <Box>
              <HStack gap={2} mb={0.5}>
                <Heading
                  size="lg"
                  letterSpacing="tight"
                  color="brand.900"
                  lineHeight="short"
                >
                  Customer Billing
                </Heading>
                <Badge
                  colorPalette="brand"
                  variant="subtle"
                  size="sm"
                  borderRadius="md"
                >
                  Transactions
                </Badge>
              </HStack>
              <Text color="brand.500" fontSize="sm" fontWeight="medium">
                Manage customer invoices and payment history
              </Text>
            </Box>
          </HStack>

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
        </Flex>

        <Box flex="1">
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

        <Box>
          <SalesSummaryCard sales={filteredSales} />
        </Box>

        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Summary</Heading>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPaymentSummary((prev) => !prev)}
          >
            {showPaymentSummary
              ? "Hide Payment Summary"
              : "Show Payment Summary"}
          </Button>
        </Flex>

        {showPaymentSummary && (
          <Box>
            <PaymentSummaryCard sales={filteredSales} />
          </Box>
        )}

        <Tabs.Root
          lazyMount
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value)}
        >
          {isSuperAdmin && (
            <Tabs.List
              bg="bg.muted"
              p="1"
              borderRadius="lg"
              mb={6}
              width="400px"
            >
              <Tabs.Trigger value="pakka" flex="1" borderRadius="md">
                Online Portal
              </Tabs.Trigger>
              <Tabs.Trigger value="kaccha" flex="1" borderRadius="md">
                Portal
              </Tabs.Trigger>
              <Tabs.Trigger value="all" flex="1">
                All Sales
              </Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
          )}

          <HStack gap="4" width="full">
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
            <BillingTable
              bills={groupedSales}
              onView={(b) => handleBillingAction("view", b)}
              onEdit={(b) => handleBillingAction("edit", b)}
              onHistory={handleHistoryAction}
              onDownloadPdf={handleDownloadPdf}
              loading={isLoading}
              activeTab={activeTab}
              onSendEmail={handleSendEmailPdf}
            />
          </Tabs.Content>

          <Tabs.Content value="kaccha">
            <BillingTable
              bills={filteredSales}
              onView={(b) => handleBillingAction("view", b)}
              onEdit={(b) => handleBillingAction("edit", b)}
              onHistory={handleHistoryAction}
              onDownloadPdf={handleDownloadPdf}
              loading={isLoading}
              activeTab={activeTab}
              onSendEmail={handleSendEmailPdf}
            />
          </Tabs.Content>
          {activeTab === "all" && (
            <Tabs.Content value="all">
              <BillingTable
                bills={filteredSales}
                onView={(b) => handleBillingAction("view", b)}
                onEdit={(b) => handleBillingAction("edit", b)}
                onHistory={handleHistoryAction}
                onDownloadPdf={handleDownloadPdf}
                loading={isLoading}
                activeTab={activeTab}
                onSendEmail={handleSendEmailPdf}
              />
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Stack>

      {selectedBill && (
        <BillingModal
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          bill={selectedBill}
          mode={modalMode}
          returns={currentSaleReturns}
        />
      )}

      {selectedBill && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          bill={selectedBill}
          onEditInvoice={handleEditFromHistory}
          onViewInvoice={handleViewFromHistory}
          onDownloadPdf={handleDownloadPdf}
          customerHistory={customerHistory}
          onSendEmail={handleSendEmailPdf}
        />
      )}
    </Box>
  );
};
