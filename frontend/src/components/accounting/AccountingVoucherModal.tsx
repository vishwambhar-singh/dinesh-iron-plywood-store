import {
  Box,
  Field,
  Grid,
  Input,
  Stack,
  Textarea,
  createListCollection,
  HStack,
  Flex,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useMemo, useEffect } from "react";
import { getISTDateString } from "@/utils/dateUtils";
import { toast } from "@/utils/toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useGetCustomersQuery, useGetSuppliersQuery } from "@/store/apiSlice";

interface FinancialVoucher {
  id?: string;
  bankName: string;
  date: string;
  voucherType: "SALES_RECEIPT" | "PURCHASE_PAYMENT" | "CONTRA" | "EXPENSE";
  transactionSide: "DEBIT" | "CREDIT";
  amount: string;
  paymentMode: "CASH" | "UPI" | "CHEQUE" | "BANK_TRANSFER";
  referenceNo: string;
  particulars: string;
  narration: string;
  relatedEntityType?: string;
  relatedEntityId?: string | null;
}

export const AccountingVoucherModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode: initialMode = "add",
}: any) => {
  const { bankList } = useSystemSettings();

  const [formData, setFormData] = useState<FinancialVoucher>({
    bankName: "",
    date: getISTDateString(new Date()),
    voucherType: "SALES_RECEIPT",
    transactionSide: "CREDIT",
    amount: "",
    paymentMode: "BANK_TRANSFER",
    referenceNo: "",
    particulars: "",
    narration: "",
    relatedEntityType: "NONE",
    relatedEntityId: null,
  });

  const [currentMode, setCurrentMode] = useState(initialMode);
  const [bankSearch, setBankSearch] = useState("");
  const isView = currentMode === "view";

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      if (initialData) {
        setFormData({
          ...initialData,
          amount: initialData.amount?.toString() || "",
          date: getISTDateString(initialData.voucherDate),
        });
      } else {
        setFormData({
          bankName: "",
          date: getISTDateString(new Date()),
          voucherType: "SALES_RECEIPT",
          transactionSide: "CREDIT",
          amount: "",
          paymentMode: "BANK_TRANSFER",
          referenceNo: "",
          particulars: "",
          narration: "",
          relatedEntityType: "NONE",
          relatedEntityId: null,
        });
      }
    }
  }, [isOpen, initialData, initialMode]);

  const bankCollection = useMemo(() => {
    const filtered = bankList.filter((b: string) =>
      b.toLowerCase().includes(bankSearch.toLowerCase()),
    );
    return createListCollection({
      items: filtered.map((b: string) => ({ label: b, value: b })),
    });
  }, [bankList, bankSearch]);

  const voucherTypes = useMemo(() => {
    const items =
      formData.transactionSide === "DEBIT"
        ? [
            { label: "Purchase Payment", value: "PURCHASE_PAYMENT" },
            { label: "Expense", value: "EXPENSE" },
            { label: "Contra Entry", value: "CONTRA" },
          ]
        : [
            { label: "Sales Receipt", value: "SALES_RECEIPT" },
            { label: "Contra Entry", value: "CONTRA" },
          ];
    return createListCollection({ items });
  }, [formData.transactionSide]);

  const paymentModes = createListCollection({
    items: [
      { label: "Cash", value: "CASH" },
      { label: "UPI", value: "UPI" },
      { label: "Cheque", value: "CHEQUE" },
      { label: "Bank Transfer", value: "BANK_TRANSFER" },
    ],
  });

  const validateVoucher = (data: FinancialVoucher) => {
    const errors: string[] = [];
    if (!data.bankName) errors.push("Bank Account selection is mandatory");
    if (!data.date) errors.push("Date is required");

    const amt = parseFloat(data.amount);
    if (!data.amount || isNaN(amt) || amt <= 0)
      errors.push("Valid Amount is required");

    if (data.paymentMode !== "CASH" && !data.referenceNo?.trim()) {
      errors.push(`Reference No / UTR is mandatory for ${data.paymentMode}`);
    }

    return { isValid: errors.length === 0, error: errors[0] || null };
  };

  const handleConfirm = () => {
    if (isView) {
      onClose();
      return;
    }
    const validation = validateVoucher(formData);
    if (!validation.isValid) {
      toast.error(validation.error || "Validation failed");
      return;
    }
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      referenceNo: formData.referenceNo?.trim() || "N/A",
    });
  };

  const handleSideChange = (side: "DEBIT" | "CREDIT") => {
    if (isView) return;
    const defaultType = side === "DEBIT" ? "PURCHASE_PAYMENT" : "SALES_RECEIPT";
    setFormData({
      ...formData,
      transactionSide: side,
      voucherType: defaultType,
    });
  };

  const { data: customers = [] } = useGetCustomersQuery(undefined, { skip: formData.relatedEntityType !== 'CUSTOMER' });
  const { data: suppliers = [] } = useGetSuppliersQuery(undefined, { skip: formData.relatedEntityType !== 'SUPPLIER' });

  const entityTypes = createListCollection({
    items: [
      { label: "None", value: "NONE" },
      { label: "Customer", value: "CUSTOMER" },
      { label: "Supplier", value: "SUPPLIER" },
    ]
  });

  const getEntityCollection = () => {
    if (formData.relatedEntityType === 'CUSTOMER') {
      return createListCollection({ items: customers.map((c: any) => ({ label: c.name, value: c.id })) as any[] });
    }
    if (formData.relatedEntityType === 'SUPPLIER') {
      return createListCollection({ items: suppliers.map((s: any) => ({ label: s.name, value: s.id })) as any[] });
    }
    return createListCollection({ items: [] as any[] });
  };

  return (
    <CustomModal
      title={
        isView
          ? "Voucher Details"
          : currentMode === "edit"
            ? "Edit Voucher"
            : "New Voucher Entry"
      }
      open={isOpen}
      onOpenChange={onClose}
      onConfirm={handleConfirm}
      confirmLabel={
        isView ? "Close" : currentMode === "edit" ? "Update Entry" : "Add Entry"
      }
      width="xl"
      mode={currentMode}
      onEditClick={() => setCurrentMode("edit")}
    >
      <Stack gap={6}>
        <Flex justify="center" p={1} bg="gray.100" borderRadius="lg">
          <HStack gap={0} width="full">
            {(["DEBIT", "CREDIT"] as const).map((side) => (
              <Box
                key={side}
                as="button"
                flex="1"
                py={2}
                borderRadius="md"
                fontSize="sm"
                fontWeight="bold"
                bg={
                  formData.transactionSide === side
                    ? side === "DEBIT"
                      ? "red.500"
                      : "green.500"
                    : "transparent"
                }
                color={formData.transactionSide === side ? "white" : "gray.600"}
                onClick={() => handleSideChange(side)}
                transition="all 0.2s"
                cursor={isView ? "default" : "pointer"}
              >
                {side} ({side === "DEBIT" ? "Dr" : "Cr"})
              </Box>
            ))}
          </HStack>
        </Flex>

        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Select Bank Account *
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={bankCollection}
              value={formData.bankName ? [formData.bankName] : []}
              onValueChange={(e) => {
                if (e.value[0]) {
                  setFormData({ ...formData, bankName: e.value[0] });
                }
              }}
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Choose Bank Account" />
              </SelectTrigger>
              <SelectContent portalled={false}>
                <Box p={2}>
                  <Input
                    placeholder="Search bank..."
                    size="xs"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </Box>
                {bankCollection.items.map((bank: any) => (
                  <SelectItem item={bank} key={bank.value}>
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Date *
            </Field.Label>
            <Input
              size="sm"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              readOnly={isView}
              variant={isView ? "subtle" : "outline"}
            />
          </Field.Root>
        </Grid>

        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Related Entity Type
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={entityTypes}
              value={[formData.relatedEntityType || "NONE"]}
              onValueChange={(e) => {
                setFormData({ ...formData, relatedEntityType: e.value[0], relatedEntityId: null });
              }}
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select Entity Type" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.items.map((t) => (
                  <SelectItem item={t} key={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          {formData.relatedEntityType !== "NONE" && (
            <Field.Root>
              <Field.Label fontSize="xs" fontWeight="bold">
                Select {formData.relatedEntityType === "CUSTOMER" ? "Customer" : "Supplier"}
              </Field.Label>
              <SelectRoot
                size="sm"
                collection={getEntityCollection()}
                value={formData.relatedEntityId ? [formData.relatedEntityId] : []}
                onValueChange={(e) => {
                  setFormData({ ...formData, relatedEntityId: e.value[0] });
                }}
                disabled={isView || getEntityCollection().items.length === 0}
              >
                <SelectTrigger>
                  <SelectValueText placeholder="Select Entity" />
                </SelectTrigger>
                <SelectContent portalled={false} maxH="200px">
                  {getEntityCollection().items.map((e: any) => (
                    <SelectItem item={e} key={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Field.Root>
          )}
        </Grid>

        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Voucher Type *
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={voucherTypes}
              value={[formData.voucherType]}
              onValueChange={(e) =>
                setFormData({ ...formData, voucherType: e.value[0] as any })
              }
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {voucherTypes.items.map((t) => (
                  <SelectItem item={t} key={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Payment Mode *
            </Field.Label>
            <SelectRoot
              size="sm"
              collection={paymentModes}
              value={[formData.paymentMode]}
              onValueChange={(e) =>
                setFormData({ ...formData, paymentMode: e.value[0] as any })
              }
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.items.map((m) => (
                  <SelectItem item={m} key={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        </Grid>

        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Amount (₹) *
            </Field.Label>
            <Input
              size="sm"
              type="number"
              value={formData.amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0)
                  setFormData({ ...formData, amount: val });
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              readOnly={isView}
              variant={isView ? "subtle" : "outline"}
              fontWeight="bold"
              color={
                formData.transactionSide === "CREDIT" ? "green.600" : "red.600"
              }
            />
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              Ref No / UTR / Slip No{" "}
              {formData.paymentMode !== "CASH" && !isView && "*"}
            </Field.Label>
            <Input
              size="sm"
              placeholder="Enter reference number"
              value={formData.referenceNo}
              onChange={(e) =>
                setFormData({ ...formData, referenceNo: e.target.value })
              }
              readOnly={isView}
              variant={isView ? "subtle" : "outline"}
            />
          </Field.Root>
        </Grid>

        <Field.Root>
          <Field.Label fontSize="xs" fontWeight="bold">
            Particulars
          </Field.Label>
          <Input
            size="sm"
            placeholder="e.g. Received from Client X"
            value={formData.particulars}
            onChange={(e) =>
              setFormData({ ...formData, particulars: e.target.value })
            }
            readOnly={isView}
            variant={isView ? "subtle" : "outline"}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label fontSize="xs" fontWeight="bold">
            Narration
          </Field.Label>
          <Textarea
            size="sm"
            rows={3}
            placeholder="Additional details..."
            value={formData.narration}
            onChange={(e) =>
              setFormData({ ...formData, narration: e.target.value })
            }
            readOnly={isView}
            variant={isView ? "subtle" : "outline"}
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
