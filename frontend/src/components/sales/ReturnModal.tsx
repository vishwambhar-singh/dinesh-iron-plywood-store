import {
  Input,
  Stack,
  Field,
  Table,
  Box,
  HStack,
  Text,
  Textarea,
  SimpleGrid,
  Separator,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { CustomTable } from "../ui/CustomTable";
import { useState, useEffect, useMemo } from "react";
import { ReturnModalProps } from "@/types/sales";
import { toast } from "@/utils/toast";
import { getISTDateString, formatDate } from "@/utils/dateUtils";

export const ReturnModal = ({
  isOpen,
  onClose,
  onSubmit,
  sale,
  existingReturn = [],
  loading,
}: ReturnModalProps) => {
  const [returnDate, setReturnDate] = useState(getISTDateString(new Date()));
  const [remarks, setRemarks] = useState("");
  const [returnItems, setReturnItems] = useState<any[]>([]);

  const previousReturnSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    existingReturn.forEach((ret: any) => {
      ret.items?.forEach((item: any) => {
        const id = item.productId || item.id;
        summary[id] =
          (summary[id] || 0) +
          (parseInt(item.return_qty || item.returnQty) || 0);
      });
    });
    return summary;
  }, [existingReturn]);

  useEffect(() => {
    if (sale && sale.items && isOpen) {
      setReturnItems(
        sale.items.map((item: any) => ({
          ...item,
          returnQty: "",
        })),
      );
      setRemarks("");
      setReturnDate(getISTDateString(new Date()));
    }
  }, [sale, isOpen]);

  const handleReturnQtyChange = (
    id: string,
    val: string,
    maxAvailable: number,
  ) => {
    if (val === "") {
      setReturnItems((prev) =>
        prev.map((item) =>
          item.productId === id ? { ...item, returnQty: "" } : item,
        ),
      );
      return;
    }

    const numVal = parseInt(val) || 0;
    if (numVal > maxAvailable) {
      toast.error(`Max returnable is ${maxAvailable}`);
      return;
    }
    if (numVal < 0) return;

    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === id ? { ...item, returnQty: val } : item,
      ),
    );
  };

  const hasItemsToReturn = useMemo(() => {
    return sale?.items?.some((item: any) => {
      const alreadyReturned = previousReturnSummary[item.productId] || 0;
      return item.qty > alreadyReturned;
    });
  }, [sale?.items, previousReturnSummary]);

  const totals = useMemo(() => {
    return returnItems.reduce(
      (acc, item) => {
        const qty = parseInt(item.returnQty) || 0;
        const taxable = qty * (Number(item.price) || 0);
        const cgstRate = Number(item.cgst) || 0;
        const sgstRate = Number(item.sgst) || 0;
        const igstRate = Number(item.igst) || 0;

        const gstAmount =
          sale?.gstType === "LOCAL"
            ? (taxable * (cgstRate + sgstRate)) / 100
            : (taxable * igstRate) / 100;

        return {
          taxable: acc.taxable + taxable,
          gst: acc.gst + gstAmount,
          total: acc.total + (taxable + gstAmount),
        };
      },
      { taxable: 0, gst: 0, total: 0 },
    );
  }, [returnItems, sale]);

  const columns = [
    { label: "Product", align: "start" as const },
    { label: "Sold Qty", align: "center" as const },
    { label: "Return Qty", width: "100px" },
    { label: "Rate" },
    { label: "Disc (%)", align: "center" as const },
    ...(sale?.gstType === "LOCAL"
      ? [{ label: "CGST (%)" }, { label: "SGST (%)" }]
      : [{ label: "IGST (%)" }]),
    { label: "Total", align: "end" as const },
  ];

  const handleConfirm = () => {
    const itemsWithQty = returnItems
      .filter((item) => (parseInt(item.returnQty) || 0) > 0)
      .map((item) => {
        const qty = parseInt(item.returnQty);
        const taxable = qty * Number(item.price);
        const rate =
          sale?.gstType === "LOCAL"
            ? Number(item.cgst) + Number(item.sgst)
            : Number(item.igst);
        const gstAmount = (taxable * rate) / 100;

        return {
          product_id: item.productId,
          name: item.name,
          hsn: item.hsn,
          sold_qty: item.qty,
          return_qty: qty,
          base_price: Number(item.basePrice),
          conversion_rate: Number(item.conversionRate),
          item_disc_percent: Number(item.itemDiscPercent),
          unit: item.unit,
          price: Number(item.price),
          cgst: Number(item.cgst),
          sgst: Number(item.sgst),
          igst: Number(item.igst),
          gst_amount: gstAmount.toFixed(2),
          price_after_gst: (taxable + gstAmount).toFixed(2),
        };
      });

    if (itemsWithQty.length === 0)
      return toast.error("Please select items to return");

    onSubmit({
      customer_name: sale?.customerName || "",
      customer_mobile: sale?.customerMobile || "",
      customer_email: sale?.customerEmail || "",
      customer_address: sale?.customerAddress || "",
      gst_number: sale?.gstNumber || "",
      sale_date: getISTDateString(sale?.saleDate),
      shipping_name: sale?.shippingName || "",
      shipping_mobile: sale?.shippingMobile || "",
      shipping_email: sale?.shippingEmail || "",
      shipping_address: sale?.shippingAddress || "",
      shipping_gst: sale?.shippingGst || "",
      po_number: sale?.poNumber || "",
      po_date: getISTDateString(sale?.poDate),
      vehicle_no: sale?.vehicleNo || "",
      gst_type: sale?.gstType,
      original_sale_id: sale?.id,
      sale_type: sale?.saleType || "PAKKA",
      return_date: returnDate,
      remarks,
      subtotal: totals.taxable.toFixed(2),
      total_gst_amount: totals.gst.toFixed(2),
      total_amount: totals.total.toFixed(2),
      original_discount: sale?.discount,
      original_sale_total: sale?.totalAmount,
      items: itemsWithQty,
    });
  };

  return (
    <CustomModal
      title="Create Return Note (Credit Note)"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      onConfirm={handleConfirm}
      confirmLabel="Complete Return"
      width="xl"
      disableConfirm={!hasItemsToReturn}
      loading={loading}
    >
      <Stack gap={6}>
        <Box
          p={4}
          bg="gray.50"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <VStack align="stretch" gap={4}>
            <SimpleGrid columns={2} gap={10}>
              <VStack align="start" gap={2}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="brand.600"
                  borderBottom="1px solid"
                  borderColor="brand.100"
                  w="full"
                >
                  BILLING DETAILS
                </Text>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="bold">
                    {sale?.customerName}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.customerMobile}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.customerEmail || "N/A"}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.customerAddress || "No billing address provided"}
                  </Text>

                  <Badge
                    mt={1}
                    colorPalette="blue"
                    variant="subtle"
                    fontSize="2xs"
                  >
                    GST: {sale?.gstNumber || "N/A"}
                  </Badge>
                </VStack>
              </VStack>

              <VStack align="start" gap={2}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="brand.600"
                  borderBottom="1px solid"
                  borderColor="brand.100"
                  w="full"
                >
                  SHIPPING DETAILS
                </Text>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="bold">
                    {sale?.shippingName || "N/A"}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.shippingMobile || "N/A"}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.shippingEmail || "N/A"}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {sale?.shippingAddress || "No shipping address provided"}
                  </Text>
                  <Badge
                    mt={1}
                    colorPalette="blue"
                    variant="subtle"
                    fontSize="2xs"
                  >
                    GST: {sale?.shippingGst || "N/A"}
                  </Badge>
                </VStack>
              </VStack>
            </SimpleGrid>

            <Separator />

            <SimpleGrid columns={3} gap={4}>
              <VStack align="start" gap={0}>
                <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                  PO Number
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  {sale?.poNumber || "N/A"}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                  PO DATE
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  {sale?.poDate ? formatDate(sale.poDate) : "N/A"}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                  Vehicle Number
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  {sale?.vehicleNo || "N/A"}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                  ORIGINAL SALE DATE
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  {formatDate(sale?.saleDate)}
                </Text>
              </VStack>

              <Field.Root>
                <Field.Label fontSize="2xs" fontWeight="bold">
                  RETURN DATE
                </Field.Label>
                <Input
                  type="date"
                  size="sm"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={!hasItemsToReturn}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="2xs" fontWeight="bold">
                  TAX TYPE
                </Field.Label>
                <Input
                  type="text"
                  size="sm"
                  value={sale?.gstType || ""}
                  disabled
                />
              </Field.Root>
            </SimpleGrid>
          </VStack>
        </Box>
        {Object.keys(previousReturnSummary).length > 0 && (
          <Box
            p={3}
            bg="orange.50"
            borderRadius="lg"
            border="1px dashed"
            borderColor="orange.300"
          >
            <Text fontSize="xs" fontWeight="bold" color="orange.800" mb={2}>
              RETURN STATUS SUMMARY
            </Text>
            <SimpleGrid columns={2} gap={2}>
              {sale?.items.map((item: any) => {
                const ret = previousReturnSummary[item.productId] || 0;
                return (
                  <HStack
                    key={item.productId}
                    justify="space-between"
                    bg="white"
                    p={1}
                    px={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="orange.100"
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      truncate
                      maxW="150px"
                    >
                      {item.name}
                    </Text>
                    <Text fontSize="2xs" color="orange.700">
                      Ret: {ret} / {item.qty}
                    </Text>
                  </HStack>
                );
              })}
            </SimpleGrid>
          </Box>
        )}
        <CustomTable
          columns={columns}
          data={returnItems}
          renderRow={(item) => {
            const alreadyReturned = previousReturnSummary[item.productId] || 0;
            const maxAvailable = item.qty - alreadyReturned;
            const currentQty = parseInt(item.returnQty) || 0;
            const rate =
              sale?.gstType === "LOCAL"
                ? Number(item.cgst) + Number(item.sgst)
                : Number(item.igst);
            const lineTotal =
              currentQty * Number(item.price) * (1 + rate / 100);

            return (
              <Table.Row key={item.productId}>
                <Table.Cell>
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold" fontSize="sm">
                      {item.name}
                    </Text>
                    <Text fontSize="2xs" color="gray.500">
                      HSN: {item.hsn}
                    </Text>
                  </VStack>
                </Table.Cell>
                <Table.Cell textAlign="center">{item.qty}</Table.Cell>
                <Table.Cell>
                  <Input
                    type="number"
                    size="xs"
                    value={item.returnQty}
                    placeholder={`Max ${maxAvailable}`}
                    onChange={(e) =>
                      handleReturnQtyChange(
                        item.productId,
                        e.target.value,
                        maxAvailable,
                      )
                    }
                    disabled={maxAvailable <= 0}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                    }
                  />
                </Table.Cell>
                <Table.Cell>
                  ₹{item.price}
                  <Text fontSize="2xs" color="gray.500">
                    ₹{Number(item.basePrice).toFixed(2)} / {item.unit}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  {item.itemDiscPercent}
                </Table.Cell>
                {sale?.gstType === "LOCAL" ? (
                  <>
                    <Table.Cell>{item.cgst}%</Table.Cell>
                    <Table.Cell>{item.sgst}%</Table.Cell>
                  </>
                ) : (
                  <Table.Cell>{item.igst}%</Table.Cell>
                )}
                <Table.Cell textAlign="end" fontWeight="bold">
                  ₹{lineTotal.toFixed(2)}
                </Table.Cell>
              </Table.Row>
            );
          }}
        />
        {hasItemsToReturn && (
          <Field.Root>
            <Field.Label fontSize="xs" fontWeight="bold">
              RETURN REMARKS
            </Field.Label>
            <Textarea
              size="sm"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason for return..."
            />
          </Field.Root>
        )}
        {hasItemsToReturn ? (
          <VStack
            align="stretch"
            gap={2}
            p={4}
            bg="red.50"
            borderRadius="md"
            border="1px solid"
            borderColor="red.100"
          >
            <HStack justify="space-between" fontSize="sm">
              <Text color="gray.600">Taxable Subtotal:</Text>
              <Text fontWeight="semibold">₹{totals.taxable.toFixed(2)}</Text>
            </HStack>
            <HStack justify="space-between" fontSize="sm">
              <Text color="gray.600">GST Amount:</Text>
              <Text fontWeight="semibold">₹{totals.gst.toFixed(2)}</Text>
            </HStack>
            <Separator borderColor="red.200" />
            <HStack justify="space-between">
              <Text fontWeight="bold" color="red.800">
                Refund Amount:
              </Text>
              <Text fontWeight="black" fontSize="xl" color="red.700">
                ₹{totals.total.toFixed(2)}
              </Text>
            </HStack>
          </VStack>
        ) : (
          existingReturn.map((r: any) => (
            <Box
              key={r.id}
              mx={4}
              mb={4}
              p={4}
              bg="orange.50"
              border="1px solid"
              borderColor="orange.200"
              borderRadius="lg"
            >
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <HStack>
                    <Badge colorPalette="orange" variant="solid">
                      RETURNED
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold" color="orange.800">
                      Note: {r.returnNo || r.returnNumber}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="orange.600" fontWeight="medium">
                    {formatDate(r.returnDate)}
                  </Text>
                </HStack>

                <Box
                  borderRadius="md"
                  border="1px solid"
                  borderColor="orange.100"
                  bg="white/50"
                  overflow="hidden"
                >
                  <Table.Root size="sm">
                    <Table.Header bg="orange.100/50">
                      <Table.Row>
                        <Table.ColumnHeader fontSize="2xs" color="orange.800">
                          ITEM
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          fontSize="2xs"
                          color="orange.800"
                          textAlign="end"
                        >
                          RET QTY
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          fontSize="2xs"
                          color="orange.800"
                          textAlign="end"
                        >
                          REFUND
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {r.items?.map((item: any, idx: number) => (
                        <Table.Row key={idx}>
                          <Table.Cell fontSize="2xs" fontWeight="bold">
                            {item.itemName || item.name}
                          </Table.Cell>
                          <Table.Cell fontSize="2xs" textAlign="end">
                            {item.returnQty}
                          </Table.Cell>
                          <Table.Cell
                            fontSize="2xs"
                            textAlign="end"
                            fontWeight="bold"
                          >
                            ₹{Number(item.priceAfterGst).toFixed(2)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>

                <Separator borderColor="orange.200" />

                <HStack justify="space-between">
                  <Text fontSize="xs" color="orange.700" fontWeight="bold">
                    CREDIT TOTAL:
                  </Text>
                  <Text fontSize="md" fontWeight="black" color="orange.600">
                    ₹{Number(r.totalAmount).toFixed(2)}
                  </Text>
                </HStack>

                {r.remarks && (
                  <Text fontSize="2xs" fontStyle="italic" color="orange.500">
                    * {r.remarks}
                  </Text>
                )}
              </VStack>
            </Box>
          ))
        )}{" "}
      </Stack>
    </CustomModal>
  );
};
