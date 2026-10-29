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
  MdLocalShipping,
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

export const CustomerLedgerModal = ({
  isOpen,
  onClose,
  mode,
  record,
  entityDetails,
}: any) => {
  const navigate = useNavigate();
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
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

  const handleNavigateToInvoice = () => {
    navigate(`/billings?viewSale=${record.billId}`);
    onClose();
  };

  const handleSubmitPayment = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) return;
    try {
      await addPayment({
        ledgerId: record.id,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber,
      }).unwrap();
      setShowAddForm(false);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePayment({ paymentId: paymentToDelete, ledgerId: record.id }).unwrap();
      setPaymentToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
  };

  if (!record) return null;

  return (
    <CustomModal
      title={mode === "view" ? "Customer Ledger Details" : "Record Payment"}
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      mode={mode}
    >
      <VStack align="stretch" gap={5}>
        <Box
          p={5}
          borderRadius="xl"
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.200"
        >
          <Grid templateColumns="repeat(2, 1fr)" gap={8}>
            <VStack align="start" gap={3}>
              <Badge colorPalette="blue" variant="solid" size="sm">
                Billing Details
              </Badge>
              <Heading size="md" color="blue.800">
                {entityDetails?.customerName || record.name}
              </Heading>
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Icon as={MdPhone} color="blue.500" />
                  <Text fontSize="sm">
                    {entityDetails?.customerMobile || "N/A"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdEmail} color="blue.500" />
                  <Text fontSize="sm" truncate>
                    {entityDetails?.customerEmail || "N/A"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdLocationOn} color="blue.500" />
                  <Text fontSize="sm">
                    {entityDetails?.customerAddress || "N/A"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdFingerprint} color="blue.500" />
                  <Text fontSize="sm" fontWeight="bold">
                    GST: {entityDetails?.gstNumber || "N/A"}
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <VStack align="start" gap={3}>
              <Badge colorPalette="cyan" variant="solid" size="sm">
                Shipping Details
              </Badge>
              <Heading size="md" color="cyan.800">
                {entityDetails?.shippingName || "Same as Billing"}
              </Heading>
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Icon as={MdPhone} color="cyan.500" />
                  <Text fontSize="sm">
                    {entityDetails?.shippingMobile || "-"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdEmail} color="cyan.500" />
                  <Text fontSize="sm">
                    {entityDetails?.shippingEmail || "-"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdLocalShipping} color="cyan.500" />
                  <Text fontSize="sm">
                    {entityDetails?.shippingAddress || "-"}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Icon as={MdFingerprint} color="cyan.500" />
                  <Text fontSize="sm">
                    {" "}
                    GST: {entityDetails?.shippingGst || "N/A"}
                  </Text>
                </HStack>
                <Box
                  mt={2}
                  p={3}
                  bg="white"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="blue.100"
                  width="full"
                >
                  <Text fontSize="xs" fontWeight="bold" color="gray.500">
                    PENDING BALANCE
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="black"
                    color={balance > 0 ? "red.600" : "green.600"}
                  >
                    ₹{balance.toLocaleString("en-IN")}
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </Grid>
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
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Amount
                </Text>
                <Input
                  type="number"
                  bg="white"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </Stack>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Date
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
                  onValueChange={(e) =>
                    e.value[0] &&
                    setFormData({ ...formData, paymentMode: e.value[0] })
                  }
                >
                  <SelectTrigger bg="white">
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectContent>
                    <Grid templateColumns="1fr" gap={1}>
                      {paymentModes.items.map((i) => (
                        <SelectItem item={i} key={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </Grid>
                  </SelectContent>
                </SelectRoot>
              </Stack>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold">
                  Ref No.
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
              Submit Settlement
            </Button>
          </Box>
        )}

        <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
          <HStack justify="space-between" mb={2}>
            <HStack color="gray.600">
              <Icon as={MdReceipt} />
              <Text fontWeight="bold" fontSize="sm">
                Invoice: {entityDetails?.invoiceNumber}
              </Text>
            </HStack>
            <IconButton
              variant="outline"
              size="xs"
              onClick={handleNavigateToInvoice}
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
                {formatDate(entityDetails?.saleDate)}
              </Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.500">
                TOTAL BILL AMOUNT
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                ₹{Number(entityDetails?.totalAmount).toLocaleString("en-IN")}
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
                    const customerName = entityDetails?.customerName || record.name || "Customer";
                    exportData.push({
                      Date: "",
                      Mode: "",
                      "Reference No.": "TOTAL PAID",
                      Amount: Number(record.amountPaid || 0),
                    });
                    handleExport(exportData, "xlsx", `${customerName}_Ledger`);
                  }}
                >
                  <MdOutlineDownload /> Export
                </Button>
              )}
              {mode === "edit" && balance > 0 && !showAddForm && (
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                >
                  <MdPayment /> Add Entry
                </Button>
              )}
            </HStack>
          </HStack>
          <Box
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.200"
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
              renderRow={(p: any) => (
                <Table.Row key={p.id}>
                  <Table.Cell py={2}>{formatDate(p.paymentDate)}</Table.Cell>
                  <Table.Cell py={2}>
                    <Badge variant="subtle" size="sm">
                      {p.paymentMode}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell py={3} px={4} textAlign="center">
                    {p.referenceNumber || "-"}
                  </Table.Cell>
                  <Table.Cell py={2} textAlign="right" fontWeight="bold">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </Table.Cell>
                  {mode === "edit" && (
                    <Table.Cell py={2} textAlign="center">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        colorPalette="red"
                        loading={isDeleting}
                        onClick={() => setPaymentToDelete(p.id)}
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
