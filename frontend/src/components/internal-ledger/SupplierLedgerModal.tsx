import { useState, useMemo } from "react";
import {
  VStack,
  HStack,
  Text,
  Box,
  Heading,
  Badge,
  Grid,
  Table,
  Icon,
  Flex,
  IconButton,
  Input,
  Stack,
  createListCollection,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { CustomModal } from "@/components/ui/CustomModal";
import { CustomDeleteDialog } from "@/components/ui/CustomDeleteDialog";
import {
  MdReceipt,
  MdHistory,
  MdPayment,
  MdFingerprint,
  MdLocationOn,
  MdEmail,
  MdPhone,
  MdVisibility,
  MdClose,
  MdDelete,
  MdOutlineDownload,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { formatDate, getISTDateString } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { CustomTable } from "../ui/CustomTable";
import { toast } from "@/utils/toast";
import {
  useAddInternalLedgerPaymentMutation,
  useDeleteInternalLedgerPaymentMutation,
} from "@/store/apiSlice";
import { handleExport } from "@/utils/export";

const paymentModes = createListCollection({
  items: [
    { label: "Cash", value: "CASH" },
    { label: "Online", value: "ONLINE" },
    { label: "Cheque", value: "CHEQUE" },
    { label: "Bank Transfer", value: "BANK_TRANSFER" },
  ],
});

export const SupplierLedgerModal = ({
  isOpen,
  onClose,
  mode,
  record,
  entityDetails,
}: any) => {
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const [addPayment, { isLoading: isSubmitting }] =
    useAddInternalLedgerPaymentMutation();

  const [deletePayment, { isLoading: isDeleting }] =
    useDeleteInternalLedgerPaymentMutation();

  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: getISTDateString(new Date()),
    paymentMode: "CASH",
    referenceNumber: "",
  });

  const balance = useMemo(
    () => Number(record?.amount || 0) - Number(record?.amountPaid || 0),
    [record],
  );

  const specificBill = useMemo(() => {
    const bills = entityDetails?.bills || [];
    return bills.find((b: any) => b.id === record?.billId);
  }, [entityDetails, record?.billId]);

  const handleAmountChange = (val: string) => {
    const numVal = parseFloat(val);
    if (val === "") return setFormData({ ...formData, amount: "" });
    if (numVal < 0) return;
    if (numVal > balance) {
      toast.warning(`Amount cannot exceed pending balance of ₹${balance}`);
      setFormData({ ...formData, amount: balance.toString() });
      return;
    }
    setFormData({ ...formData, amount: val });
  };

  const handleNavigateToBill = () => {
    const params = new URLSearchParams();
    params.set("openHistory", record.entityId);
    params.set("billId", record.billId);
    navigate(`/suppliers?${params.toString()}`);
    onClose();
  };

  const handleSubmitPayment = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const payload = {
        ledgerId: record.id,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber,
      };

      await addPayment(payload).unwrap();

      toast.success("Payment recorded successfully");
      setShowAddForm(false);
      setFormData({
        amount: "",
        paymentDate: getISTDateString(new Date()),
        paymentMode: "CASH",
        referenceNumber: "",
      });

      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to record payment");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePayment({ paymentId: paymentToDelete, ledgerId: record.id }).unwrap();
      toast.success("Payment deleted successfully");
      setPaymentToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete payment");
    }
  };

  if (!record) return null;

  return (
    <CustomModal
      title={mode === "view" ? "Supplier Ledger Details" : "Record Payment"}
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          setShowAddForm(false);
          onClose();
        }
      }}
      mode={mode}
    >
      <VStack align="stretch" gap={6}>
        <Box
          p={5}
          borderRadius="xl"
          bg="brand.50"
          borderWidth="1px"
          borderColor="brand.200"
          shadow="sm"
        >
          <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
            <VStack align="start" gap={3} flex="1">
              <VStack align="start" gap={0}>
                <Badge colorPalette="brand" variant="solid" size="sm" mb={1}>
                  Supplier Profile
                </Badge>
                <Heading size="lg" color="brand.800" textTransform="capitalize">
                  {entityDetails?.name || record.name}
                </Heading>
              </VStack>
              <Grid
                templateColumns="repeat(2, 1fr)"
                gapX={8}
                gapY={2}
                width="full"
              >
                <HStack gap={2}>
                  <Icon as={MdPhone} color="brand.500" />
                  <Text fontSize="sm">{entityDetails?.mobile || "N/A"}</Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdEmail} color="brand.500" />
                  <Text fontSize="sm" truncate maxW="150px">
                    {entityDetails?.email || "N/A"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdLocationOn} color="brand.500" />
                  <Text fontSize="sm">{entityDetails?.address || "N/A"}</Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdFingerprint} color="brand.500" />
                  <Text fontSize="sm" fontWeight="bold">
                    GST: {entityDetails?.gstNumber || "N/A"}
                  </Text>
                </HStack>
              </Grid>
            </VStack>
            <Box
              p={4}
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="brand.200"
              textAlign="right"
              minW="160px"
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                PENDING BALANCE
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="black"
                color={balance > 0 ? "red.600" : "green.600"}
              >
                ₹{balance.toLocaleString("en-IN")}
              </Text>
            </Box>
          </Flex>
        </Box>

        {showAddForm && (
          <Box
            p={5}
            bg="blue.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="blue.200"
            position="relative"
          >
            <IconButton
              size="xs"
              variant="ghost"
              position="absolute"
              top={2}
              right={2}
              onClick={() => setShowAddForm(false)}
            >
              <MdClose />
            </IconButton>
            <Heading size="xs" mb={4} color="blue.700">
              New Payment Entry
            </Heading>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Amount (Max: ₹{balance})
                </Text>
                <Input
                  type="number"
                  bg="white"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Payment Date
                </Text>
                <Input
                  type="date"
                  bg="white"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Mode
                </Text>
                <SelectRoot
                  collection={paymentModes}
                  value={[formData.paymentMode]}
                  onValueChange={(e) => {
                    if (e.value[0]) {
                      setFormData({ ...formData, paymentMode: e.value[0] });
                    }
                  }}
                >
                  <SelectTrigger bg="white">
                    <SelectValueText placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <Grid templateColumns="1fr" gap={1}>
                      {paymentModes.items.map((item) => (
                        <SelectItem item={item} key={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </Grid>
                  </SelectContent>
                </SelectRoot>
              </Stack>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Reference No.
                </Text>
                <Input
                  bg="white"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referenceNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. TXN12345"
                />
              </Stack>
            </Grid>
            <Button
              mt={4}
              width="full"
              colorPalette="blue"
              size="sm"
              onClick={handleSubmitPayment}
              loading={isSubmitting}
            >
              Submit Payment
            </Button>
          </Box>
        )}

        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <HStack justify="space-between" mb={2}>
            <HStack color="gray.600">
              <Icon as={MdReceipt} />
              <Text fontWeight="bold" fontSize="sm">
                Bill Ref: {specificBill?.billNumber || "N/A"}
              </Text>
            </HStack>
            <IconButton
              variant="outline"
              size="xs"
              onClick={handleNavigateToBill}
            >
              <MdVisibility />
            </IconButton>
          </HStack>
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.500">
                DATE
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {specificBill?.billDate
                  ? formatDate(specificBill?.billDate)
                  : "N/A"}
              </Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.500">
                TOTAL BILL AMOUNT
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                ₹
                {Number(specificBill?.totalAmount || 0).toLocaleString("en-IN")}
              </Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.500">
                ADJUSTMENT (ADDITIONAL DISCOUNT)
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="red.600">
                ₹{Number(record.amount).toLocaleString("en-IN")}
              </Text>
            </VStack>
          </Grid>
        </Box>

        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={2} color="brand.600">
              <Icon as={MdHistory} />
              <Text fontWeight="bold" fontSize="sm">
                Payment History
              </Text>
            </HStack>
            <HStack gap={2}>
              {(record.payments || []).length > 0 && (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="brand"
                  onClick={() => {
                    const exportData = (record.payments || []).map((p: any) => ({
                      Date: formatDate(p.paymentDate),
                      Mode: p.paymentMode,
                      "Reference No.": p.referenceNumber || "-",
                      Amount: Number(p.amount),
                    }));
                    const supplierName = entityDetails?.name || record.name || "Supplier";
                    exportData.push({
                      Date: "",
                      Mode: "",
                      "Reference No.": "TOTAL PAID",
                      Amount: Number(record.amountPaid || 0),
                    });
                    handleExport(exportData, "xlsx", `${supplierName}_Ledger`);
                  }}
                >
                  <MdOutlineDownload /> Export
                </Button>
              )}
              {mode === "edit" && balance > 0 && !showAddForm && (
                <Button
                  size="xs"
                  colorPalette="brand"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                >
                  <Icon as={MdPayment} mr={1} /> Add Entry
                </Button>
              )}
            </HStack>
          </HStack>
          <Box
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="brand.200"
            overflow="hidden"
          >
            <CustomTable
              columns={[
                { label: "Date", align: "start" },
                { label: "Mode", align: "start" },
                { label: "Reference Number", align: "center" },
                { label: "Amount", align: "end" },
                ...(mode === "edit"
                  ? [{ label: "Action", align: "center" as const }]
                  : []),
              ]}
              data={record.payments || []}
              renderRow={(p: any, index: number) => (
                <Table.Row key={p.id || index}>
                  <Table.Cell py={3} px={4}>
                    {formatDate(p.paymentDate)}
                  </Table.Cell>
                  <Table.Cell py={3} px={4}>
                    <Badge variant="outline" size="sm">
                      {p.paymentMode}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell py={3} px={4} textAlign="center">
                    {p.referenceNumber || "-"}
                  </Table.Cell>
                  <Table.Cell py={3} px={4} textAlign="right" fontWeight="bold">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </Table.Cell>
                  {mode === "edit" && (
                    <Table.Cell py={3} px={4} textAlign="center">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        colorPalette="red"
                        onClick={() => setPaymentToDelete(p.id)}
                        loading={isDeleting}
                      >
                        <MdDelete />
                      </IconButton>
                    </Table.Cell>
                  )}
                </Table.Row>
              )}
            />
          </Box>
        </VStack>
      </VStack>

      <CustomDeleteDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Delete Payment?"
        description="Are you sure you want to delete this payment record? This action cannot be undone."
      />
    </CustomModal>
  );
};
