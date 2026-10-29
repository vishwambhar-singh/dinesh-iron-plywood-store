import { useState, useMemo } from "react";
import {
  Box,
  Heading,
  HStack,
  Stack,
  Flex,
  Text,
  Icon,
  Tabs,
  Badge,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { MdOutlineDownload, MdSecurity } from "react-icons/md";
import SearchBar from "@/components/ui/SearchBar";
import {
  useGetInternalLedgersQuery,
  useGetSuppliersQuery,
  useGetSalesQuery,
} from "@/store/apiSlice";
import LedgerTable from "@/components/internal-ledger/LedgerTable";
import { SupplierLedgerModal } from "@/components/internal-ledger/SupplierLedgerModal";
import { CustomerLedgerModal } from "@/components/internal-ledger/CustomerLedgerModal";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { handleExport } from "@/utils/export";
import { transformLedgerData } from "@/exportConfigs/internalLedgerExport";
import LedgerSummaryCard from "@/components/internal-ledger/LedgerSummaryCard";
import { getISTDateString } from "@/utils/dateUtils";

export const InternalLedger = () => {
  const { exportFormat } = useSystemSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("suppliers");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "view">("view");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<
    "day" | "month" | "year" | "all"
  >("all");

  const queryType = activeTab === "suppliers" ? "SUPPLIER" : "CUSTOMER";

  const { data: ledgersData = [], isLoading } =
    useGetInternalLedgersQuery(queryType);
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: sales = [] } = useGetSalesQuery();

  const filteredData = useMemo(() => {
    return ledgersData.filter((record: any) => {
      let matchesSearch = true;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        matchesSearch =
          record.name?.toLowerCase().includes(lowerQuery) ||
          record.billId?.toLowerCase().includes(lowerQuery);
      }

      const todayStr = getISTDateString(new Date());
      const recordDateStr = getISTDateString(record.date);
      let matchesTime = true;

      if (timeFilter !== "all") {
        if (recordDateStr && todayStr) {
          if (timeFilter === "day") {
            matchesTime = recordDateStr === todayStr;
          } else if (timeFilter === "month") {
            const rParts = recordDateStr.split("-");
            const tParts = todayStr.split("-");
            matchesTime = rParts[0] === tParts[0] && rParts[1] === tParts[1];
          } else if (timeFilter === "year") {
            matchesTime =
              recordDateStr.split("-")[0] === todayStr.split("-")[0];
          }
        } else {
          matchesTime = false;
        }
      }

      return matchesSearch && matchesTime;
    });
  }, [ledgersData, searchQuery, timeFilter]);

  const selectedEntity = useMemo(() => {
    if (!selectedRecord) return null;
    if (selectedRecord.entityType === "SUPPLIER") {
      return suppliers.find((s: any) => s.id === selectedRecord.entityId);
    }
    if (selectedRecord.entityType === "CUSTOMER") {
      return sales.find((s: any) => s.id === selectedRecord.billId);
    }
    return null;
  }, [selectedRecord, suppliers, sales]);

  const handleOpenModal = (mode: "edit" | "view", record?: any) => {
    setModalMode(mode);
    setSelectedRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleExportExcel = () => {
    const data = transformLedgerData(filteredData);
    handleExport(data, exportFormat, `Internal_Ledger_${activeTab}`);
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto">
      <Stack gap={8}>
        <Flex
          justify="space-between"
          align="center"
          bg="white"
          p={6}
          borderRadius="xl"
          border="1px solid"
          borderColor="brand.100"
          shadow="sm"
          mb={6}
        >
          <HStack gap={4}>
            <Box p={2} bg="brand.50" borderRadius="lg" color="brand.600">
              <Icon as={MdSecurity} boxSize={6} />
            </Box>
            <Box>
              <HStack gap={2} mb={0.5}>
                <Heading
                  size="lg"
                  letterSpacing="tight"
                  color="brand.900"
                  lineHeight="short"
                >
                  Internal Ledger
                </Heading>
                <Badge
                  colorPalette="brand"
                  variant="subtle"
                  size="sm"
                  borderRadius="md"
                >
                  Accounts
                </Badge>
              </HStack>
              <Text color="brand.500" fontSize="sm" fontWeight="medium">
                Manage additional discounts given in supplier bills and sales
                invoices
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

        <Box>
          <LedgerSummaryCard
            data={filteredData}
            type={activeTab as "suppliers" | "sales"}
          />
        </Box>

        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value)}
          variant="line"
          colorPalette="brand"
        >
          <Tabs.List mb={4} borderBottomWidth="1px" borderColor="brand.100">
            <Tabs.Trigger value="suppliers" px={6} py={3} fontWeight="semibold">
              Suppliers (Payables)
            </Tabs.Trigger>
            <Tabs.Trigger value="sales" px={6} py={3} fontWeight="semibold">
              Sales (Receivables)
            </Tabs.Trigger>
          </Tabs.List>

          <HStack gap="4" width="full" mb={6}>
            <Box flex="1">
              <SearchBar
                placeholder={`Search ${activeTab}...`}
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

          <Tabs.Content value="suppliers">
            <LedgerTable
              data={filteredData}
              isLoading={isLoading}
              onView={(record) => handleOpenModal("view", record)}
              onEdit={(record) => handleOpenModal("edit", record)}
            />
          </Tabs.Content>

          <Tabs.Content value="sales">
            <LedgerTable
              data={filteredData}
              isLoading={isLoading}
              onView={(record) => handleOpenModal("view", record)}
              onEdit={(record) => handleOpenModal("edit", record)}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Stack>

      {selectedRecord?.entityType === "SUPPLIER" ? (
        <SupplierLedgerModal
          isOpen={isModalOpen}
          entityDetails={selectedEntity}
          onClose={handleCloseModal}
          mode={modalMode}
          record={selectedRecord}
        />
      ) : selectedRecord?.entityType === "CUSTOMER" ? (
        <CustomerLedgerModal
          isOpen={isModalOpen}
          entityDetails={selectedEntity}
          onClose={handleCloseModal}
          mode={modalMode}
          record={selectedRecord}
        />
      ) : null}
    </Box>
  );
};

export default InternalLedger;
