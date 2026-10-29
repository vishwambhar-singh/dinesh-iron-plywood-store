import {
  Box,
  HStack,
  Heading,
  Button,
  Icon,
  Badge,
  Flex,
  Text,
  Field,
  createListCollection,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { VoucherList } from "@/components/accounting/VoucherList";
import { AccountingVoucherModal } from "@/components/accounting/AccountingVoucherModal";
import {
  MdAdd,
  MdOutlineAccountBalanceWallet,
  MdOutlineDownload,
} from "react-icons/md";
import {
  useGetVouchersQuery,
  useAddVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useApproveVoucherMutation,
} from "@/store/apiSlice";
import { toast } from "@/utils/toast";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import SearchBar from "@/components/ui/SearchBar";
import AccountingSummaryCard from "@/components/accounting/AccountingSummaryCard";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { getSafeDate } from "@/utils/dateUtils";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { transformAccountingData } from "@/exportConfigs/accountingExport";
import { handleExport } from "@/utils/export";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const Accounting = () => {
  const { exportFormat, bankList } = useSystemSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(undefined);
  const [voucherToDelete, setVoucherToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempDates, setTempDates] = useState({ start: "", end: "" });
  const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sideFilter, setSideFilter] = useState<"ALL" | "DEBIT" | "CREDIT">(
    "ALL",
  );
  const [bankFilter, setBankFilter] = useState<string>("ALL");

  const { data: vouchers = [], isLoading } = useGetVouchersQuery();
  const [addVoucher] = useAddVoucherMutation();
  const [updateVoucher] = useUpdateVoucherMutation();
  const [deleteVoucher, { isLoading: isDeleting }] = useDeleteVoucherMutation();
  const [approveVoucher] = useApproveVoucherMutation();

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v: any) => {
      const matchesSearch =
        v.particulars?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.voucherType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "ALL" || v.voucherType === typeFilter;

      const matchesSide =
        sideFilter === "ALL" || v.transactionSide === sideFilter;

      const matchesBank = bankFilter === "ALL" || v.bankName === bankFilter;

      let matchesDate = true;

      if (appliedDates.start && appliedDates.end) {
        const vDate = getSafeDate(v.voucherDate).getTime();

        const start = getSafeDate(appliedDates.start);
        const end = getSafeDate(appliedDates.end);

        end.setHours(23, 59, 59, 999);

        matchesDate = vDate >= start.getTime() && vDate <= end.getTime();
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesDate &&
        matchesSide &&
        matchesBank
      );
    });
  }, [vouchers, searchQuery, appliedDates, typeFilter, sideFilter, bankFilter]);

  const handleAdd = () => {
    setSelectedVoucher(undefined);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (voucher: any) => {
    setSelectedVoucher(voucher);
    setModalMode("edit");
    setModalOpen(true);
  };
  const handleView = (voucher: any) => {
    setSelectedVoucher(voucher);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;
    try {
      await deleteVoucher(voucherToDelete.id).unwrap();
      toast.success("Voucher deleted successfully");
      setVoucherToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete voucher");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (modalMode === "edit" && selectedVoucher) {
        await updateVoucher({ ...data, id: selectedVoucher.id }).unwrap();
        toast.success("Voucher updated successfully");
      } else {
        await addVoucher(data).unwrap();
        toast.success("Voucher posted successfully");
      }
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Operation failed");
    }
  };

  const handleApprove = async (id: string, status: string) => {
    try {
      await approveVoucher({ id, status }).unwrap();
      toast.success(`Voucher ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update voucher status");
    }
  };

  const handleSearch = () => {
    setAppliedDates({
      start: tempDates.start,
      end: tempDates.end,
    });
  };

  const handleClearFilters = () => {
    setTempDates({ start: "", end: "" });
    setAppliedDates({ start: "", end: "" });
    setTypeFilter("ALL");
    setBankFilter("ALL");
  };

  const voucherTypes = createListCollection({
    items: [
      { label: "Purchase Payment", value: "PURCHASE_PAYMENT" },
      { label: "Expense", value: "EXPENSE" },
      { label: "Sales Receipt", value: "SALES_RECEIPT" },
      { label: "Contra Entry", value: "CONTRA" },
    ],
  });

  const handleExportExcel = () => {
    const data = transformAccountingData(filteredVouchers);
    handleExport(data, exportFormat, "Accounting Report");
  };

  return (
    <Box w="full" p={6} bg="bg.canvas" minH="100vh">
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
            <Icon as={MdOutlineAccountBalanceWallet} boxSize={6} />
          </Box>
          <Box>
            <HStack gap={2} mb={0.5}>
              <Heading
                size="lg"
                letterSpacing="tight"
                color="brand.900"
                lineHeight="short"
              >
                Accounting
              </Heading>
              <Badge
                colorPalette="brand"
                variant="subtle"
                size="sm"
                borderRadius="md"
              >
                Ledger
              </Badge>
            </HStack>
            <Text color="brand.500" fontSize="sm" fontWeight="medium">
              Record and manage all financial transactions
            </Text>
          </Box>
        </HStack>

        <Button
          onClick={handleAdd}
          colorPalette="brand"
          size="md"
          px={6}
          fontWeight="bold"
          borderRadius="lg"
          shadow="sm"
          _hover={{ transform: "translateY(-1px)", shadow: "md" }}
        >
          <Icon as={MdAdd} mr={1} boxSize={5} /> New Voucher
        </Button>
      </Flex>

      <Flex
        gap={6}
        mb={6}
        direction={{ base: "column", lg: "row" }}
        justify="space-between"
      >
        <Box minW="250px">
          <Field.Root>
            <Field.Label
              fontSize="xs"
              fontWeight="bold"
              color="gray.600"
              mb={1.5}
            >
              Select Bank Account
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={createListCollection({
                items: [
                  { label: "All Banks", value: "ALL" },
                  ...bankList.map((b: string) => ({ label: b, value: b })),
                ],
              })}
              value={[bankFilter]}
              onValueChange={(e) => e.value[0] && setBankFilter(e.value[0])}
            >
              <SelectTrigger bg="white">
                <SelectValueText placeholder="All Banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item={{ label: "All Banks", value: "ALL" }}>
                  All Banks
                </SelectItem>
                {bankList.map((bank: string) => (
                  <SelectItem item={{ label: bank, value: bank }} key={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        </Box>
        <Box minW="250px">
          <Field.Root>
            <Field.Label
              fontSize="xs"
              fontWeight="bold"
              color="gray.600"
              mb={1.5}
            >
              Voucher Type
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={voucherTypes}
              value={[typeFilter]}
              onValueChange={(e) => {
                if (e.value[0]) {
                  setTypeFilter(e.value[0]);
                }
              }}
            >
              <SelectTrigger bg="white">
                <SelectValueText placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item={{ label: "All Types", value: "ALL" }}>
                  All Types
                </SelectItem>
                {voucherTypes.items.map((type) => (
                  <SelectItem item={type} key={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        </Box>

        <Box>
          <Field.Root>
            <Field.Label
              fontSize="xs"
              fontWeight="bold"
              color="gray.600"
              mb={1.5}
            >
              Transaction Side
            </Field.Label>
            <HStack
              bg="gray.50"
              p="1.5"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.200"
              width="fit-content"
            >
              {[
                { label: "All", value: "ALL" },
                { label: "Debit (Out)", value: "DEBIT" },
                { label: "Credit (In)", value: "CREDIT" },
              ].map((btn) => (
                <Button
                  key={btn.value}
                  size="sm"
                  variant={sideFilter === btn.value ? "solid" : "ghost"}
                  colorPalette={
                    sideFilter === btn.value
                      ? btn.value === "DEBIT"
                        ? "red"
                        : btn.value === "CREDIT"
                          ? "green"
                          : "brand"
                      : "gray"
                  }
                  onClick={() => setSideFilter(btn.value as any)}
                  borderRadius="lg"
                  px={6}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {btn.label}
                </Button>
              ))}
            </HStack>
          </Field.Root>
        </Box>
      </Flex>

      <Box flex="1" my={4}>
        <DateRangeFilter
          startDate={tempDates.start}
          endDate={tempDates.end}
          onStartChange={(val: any) =>
            setTempDates({ ...tempDates, start: val })
          }
          onEndChange={(val: any) => setTempDates({ ...tempDates, end: val })}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />
      </Box>

      <AccountingSummaryCard
        vouchers={filteredVouchers}
        allVouchers={vouchers}
        selectedBank={bankFilter}
      />

      <HStack gap="4" width="full" mb={4}>
        <Box flex="1">
          <SearchBar
            placeholder="Search by particulars, reference or type..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </Box>
        <Button variant="outline" color="brand.500" onClick={handleExportExcel}>
          <MdOutlineDownload size="20px" /> Export
        </Button>
      </HStack>

      <VoucherList
        vouchers={filteredVouchers}
        loading={isLoading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={(v: any) => setVoucherToDelete(v)}
        onApprove={handleApprove}
      />

      <AccountingVoucherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedVoucher}
        mode={modalMode}
      />

      <CustomDeleteDialog
        isOpen={!!voucherToDelete}
        onClose={() => setVoucherToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Voucher?"
        description={`Are you sure you want to delete this voucher for ${voucherToDelete?.particulars}? This cannot be undone.`}
      />
    </Box>
  );
};

export default Accounting;
