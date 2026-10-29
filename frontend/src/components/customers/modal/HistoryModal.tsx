import {
  Box,
  Stack,
  Text,
  Grid,
  Icon,
  HStack,
  Heading,
  Table,
  Badge,
} from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { Button } from "@/components/ui/button";
import { MdPhone, MdEmail, MdLocationOn, MdReceipt, MdOutlineDownload } from "react-icons/md";
import { HistoryModalProps } from "@/types/customer";
import { formatDate } from "@/utils/dateUtils";
import { handleExport } from "@/utils/export";
import { useMemo } from "react";

export const HistoryModal = ({
  isOpen,
  onClose,
  customer,
  sales = [],
  customerVouchers = [],
  returns = [],
}: HistoryModalProps) => {
  if (!customer) return null;

  const openingBalance = Number(customer.openingBalance || 0);

  const ledgerTransactions = useMemo(() => {
    const combined: any[] = [];
    sales.forEach((sale: any) => {
      combined.push({
        id: sale.id,
        date: sale.saleDate,
        type: 'SALE',
        ref: sale.invoiceNumber,
        baseAmount: Number(sale.totalAmount) || 0,
        adjustments: Number(sale.discount) || 0,
        paid: Number(sale.amountPaid) || 0,
      });
    });
    
    (customerVouchers || []).forEach((voucher: any) => {
      combined.push({
        id: voucher.id,
        date: voucher.voucherDate,
        type: voucher.voucherType,
        ref: voucher.referenceNo || voucher.particulars,
        baseAmount: voucher.transactionSide === "DEBIT" ? Number(voucher.amount) : 0,
        adjustments: 0,
        paid: voucher.transactionSide === "CREDIT" ? Number(voucher.amount) : 0,
      });
    });

    (returns || []).forEach((ret: any) => {
      combined.push({
        id: ret.id,
        date: ret.returnDate || ret.createdAt,
        type: 'RETURN',
        ref: ret.returnNumber || "Sales Return",
        baseAmount: 0,
        adjustments: 0,
        paid: Number(ret.totalAmount) || 0,
      });
    });

    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, customerVouchers, returns]);

  const totalBaseAmount = ledgerTransactions.reduce(
    (sum, t) => sum + t.baseAmount,
    0,
  );

  const totalAdjustments = ledgerTransactions.reduce(
    (sum, t) => sum + t.adjustments,
    0,
  );

  const totalPaid = ledgerTransactions.reduce(
    (sum, t) => sum + t.paid,
    0,
  );

  // The 'Amount' column as requested by the user
  const totalAmountColumn = Math.round((totalBaseAmount - totalAdjustments) * 100) / 100;
  // The 'Balance' column as requested by the user (amount + adjustments - paid) + opening balance
  const totalBalance = Math.round((openingBalance + totalAmountColumn + totalAdjustments - totalPaid) * 100) / 100;

  const columns = [
    { label: "Date", align: "start" as const },
    { label: "Type / Ref", align: "start" as const },
    { label: "Amount", align: "start" as const },
    { label: "Adjustments", align: "start" as const },
    { label: "Paid", align: "start" as const },
    { label: "Balance", align: "start" as const },
  ];

  return (
    <CustomModal
      title="Customer History & Ledger"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      mode="view"
    >
      <Stack gap={6}>
        <Box
          p={5}
          borderRadius="xl"
          bg="brand.50"
          borderWidth="1px"
          borderColor="brand.100"
        >
          <Grid templateColumns="1fr 1fr" gap={6}>
            <Stack gap={1}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.600"
                textTransform="uppercase"
              >
                Contact Info
              </Text>
              <Heading size="md" textTransform="capitalize">
                {customer.name}
              </Heading>
              <HStack color="fg.muted" fontSize="sm">
                <Icon as={MdPhone} />
                <Text>{customer.mobile}</Text>
              </HStack>
              {customer.email && (
                <HStack color="fg.muted" fontSize="sm">
                  <Icon as={MdEmail} />
                  <Text>{customer.email}</Text>
                </HStack>
              )}
              <HStack color="fg.muted" fontSize="sm" align="flex-start">
                <Icon as={MdLocationOn} mt={1} />
                <Text>{customer.address || "N/A"}</Text>
              </HStack>
            </Stack>

            <Grid templateColumns="1fr 1fr" gap={3}>
              <Box
                p={3}
                bg="white"
                borderRadius="lg"
                shadow="sm"
                textAlign="center"
              >
                <Text fontSize="xs" color="fg.muted">
                  Transactions
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {ledgerTransactions.length}
                </Text>
              </Box>
              <Box
                p={3}
                bg="white"
                borderRadius="lg"
                shadow="sm"
                textAlign="center"
              >
                <Text fontSize="xs" color="fg.muted">
                  Total Amount
                </Text>
                <Text fontWeight="bold" fontSize="lg" color="brand.600">
                  ₹{totalAmountColumn}
                </Text>
              </Box>
              <Box
                p={3}
                bg="white"
                borderRadius="lg"
                shadow="sm"
                textAlign="center"
                gridColumn="span 2"
              >
                <Text fontSize="xs" color="fg.muted">
                  Current Balance
                </Text>
                <Text
                  fontWeight="bold"
                  fontSize="xl"
                  color={totalBalance > 0 ? "red.600" : "green.600"}
                >
                  ₹{totalBalance}
                </Text>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Stack gap={3}>
          <HStack justify="space-between">
            <HStack>
              <Icon as={MdReceipt} color="brand.500" />
              <Text fontWeight="bold" fontSize="lg">
                Sales Ledger
              </Text>
            </HStack>
            {sales.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                colorPalette="brand"
                onClick={() => {
                  const exportData = [];
                  if (openingBalance > 0) {
                    exportData.push({
                      Date: "Initial",
                      "Invoice No.": "Opening Balance",
                      "Amount": openingBalance,
                      Adjustments: 0,
                      Paid: 0,
                      Balance: openingBalance,
                    });
                  }
                  
                  let runningBalance = openingBalance;
                  ledgerTransactions.forEach((t: any) => {
                    const amountCol = Math.round((t.baseAmount - t.adjustments) * 100) / 100;
                    runningBalance = Math.round((runningBalance + amountCol + t.adjustments - t.paid) * 100) / 100;
                    
                    exportData.push({
                      Date: formatDate(t.date),
                      "Type / Ref": t.type === 'SALE' ? `Sale (${t.ref})` : t.type === 'RETURN' ? `Return (${t.ref})` : `Voucher (${t.ref})`,
                      "Amount": amountCol,
                      Adjustments: t.adjustments,
                      Paid: t.paid,
                      Balance: runningBalance > 0 ? runningBalance : 0,
                    });
                  });
                  exportData.push({
                    Date: "",
                    "Type / Ref": "GRAND TOTAL",
                    "Amount": totalAmountColumn + openingBalance,
                    Adjustments: totalAdjustments,
                    Paid: totalPaid,
                    Balance: totalBalance > 0 ? totalBalance : 0,
                  });
                  handleExport(exportData, "xlsx", `${customer.name}_Ledger`);
                }}
              >
                <MdOutlineDownload /> Export
              </Button>
            )}
          </HStack>

          <Box
            maxH="350px"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="lg"
            borderColor="border.subtle"
          >
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  {columns.map((col, i) => (
                    <Table.ColumnHeader key={i} textAlign={col.align}>
                      {col.label}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {openingBalance > 0 && (
                  <Table.Row bg="orange.50">
                    <Table.Cell>Initial</Table.Cell>
                    <Table.Cell fontWeight="bold">Opening Balance</Table.Cell>
                    <Table.Cell>{`₹${openingBalance}`}</Table.Cell>
                    <Table.Cell color="orange.600">₹0</Table.Cell>
                    <Table.Cell color="green.600">₹0</Table.Cell>
                    <Table.Cell color="red.600" fontWeight="bold">
                      {`₹${openingBalance}`}
                    </Table.Cell>
                  </Table.Row>
                )}
                {(() => {
                  let uiRunningBalance = openingBalance;
                  return ledgerTransactions.map((t) => {
                    const amountCol = Math.round((t.baseAmount - t.adjustments) * 100) / 100;
                    uiRunningBalance = Math.round((uiRunningBalance + amountCol + t.adjustments - t.paid) * 100) / 100;

                    return (
                      <Table.Row key={t.id} _hover={{ bg: "brand.50" }}>
                        <Table.Cell>{formatDate(t.date)}</Table.Cell>
                        <Table.Cell fontWeight="medium">
                          {t.type === 'SALE' ? `Sale (${t.ref})` : t.type === 'RETURN' ? <Badge colorPalette="red" size="sm">Return: {t.ref}</Badge> : <Badge colorPalette="purple" size="sm">Voucher: {t.ref}</Badge>}
                        </Table.Cell>
                        <Table.Cell>{`₹${amountCol}`}</Table.Cell>
                        <Table.Cell color="orange.600">{`₹${t.adjustments}`}</Table.Cell>
                        <Table.Cell color="green.600">{`₹${t.paid}`}</Table.Cell>
                        <Table.Cell color="red.600" fontWeight="bold">
                          {`₹${uiRunningBalance > 0 ? uiRunningBalance : 0}`}
                        </Table.Cell>
                      </Table.Row>
                    );
                  });
                })()}
              </Table.Body>
              {ledgerTransactions.length > 0 && (
                <Table.Footer bg="brand.50">
                  <Table.Row>
                    <Table.Cell colSpan={2} fontWeight="bold" textAlign="right">
                      Grand Total:
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">{`₹${totalAmountColumn + openingBalance}`}</Table.Cell>
                    <Table.Cell fontWeight="bold" color="orange.600">{`₹${totalAdjustments}`}</Table.Cell>
                    <Table.Cell fontWeight="bold" color="green.600">{`₹${totalPaid}`}</Table.Cell>
                    <Table.Cell fontWeight="bold" color="red.600">{`₹${totalBalance > 0 ? totalBalance : 0}`}</Table.Cell>
                  </Table.Row>
                </Table.Footer>
              )}
            </Table.Root>
          </Box>
        </Stack>
      </Stack>
    </CustomModal>
  );
};
