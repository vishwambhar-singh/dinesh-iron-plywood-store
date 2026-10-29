import {
  Box,
  Stack,
  Flex,
  Heading,
  Text,
  Table,
  HStack,
  IconButton,
  Grid,
  Badge,
  Tabs,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/ui/CustomModal";
import { CustomTable } from "@/components/ui/CustomTable";
import {
  MdVisibility,
  MdAdd,
  MdEdit,
  MdReceipt,
  MdDelete,
  MdPictureAsPdf,
  MdOutlineDownload,
} from "react-icons/md";
import { useMemo } from "react";
import { handleExport } from "@/utils/export";
import { Supplier } from "@/types/supplier";
import { formatDate } from "@/utils/dateUtils";
import { Tooltip } from "@/components/ui/tooltip";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onOrderAction: (mode: "view" | "edit" | "bill", o?: any) => void;
  onAddNewOrder: () => void;
  onOrderDelete: (o: any) => void;
  onViewBill: (mode: "view", bill?: any) => void;
  onDownloadPO: (o: any) => void;
  supplierVouchers?: any[];
}

export const SupplierHistoryModal = ({
  isOpen,
  onClose,
  supplier,
  onOrderAction,
  onAddNewOrder,
  onOrderDelete,
  onViewBill,
  onDownloadPO,
  supplierVouchers = [],
}: Props) => {
  if (!supplier) return null;

  const openingBalance = Number(supplier.openingBalance || 0);

  const ledgerTransactions = useMemo(() => {
    const combined: any[] = [];
    (supplier.bills || []).forEach((bill: any) => {
      combined.push({
        id: bill.id,
        date: bill.billDate || bill.createdAt,
        type: 'BILL',
        ref: bill.billNumber || "Purchase Bill",
        amount: Number(bill.totalAmount) || 0,
        paid: Number(bill.amountPaid) || 0,
      });
    });
    
    (supplierVouchers || []).forEach((voucher: any) => {
      combined.push({
        id: voucher.id,
        date: voucher.voucherDate,
        type: voucher.voucherType,
        ref: voucher.referenceNo || voucher.particulars,
        amount: voucher.transactionSide === "CREDIT" ? Number(voucher.amount) : 0,
        paid: voucher.transactionSide === "DEBIT" ? Number(voucher.amount) : 0,
      });
    });

    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [supplier.bills, supplierVouchers]);

  const totalAmountColumn = ledgerTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = ledgerTransactions.reduce((sum, t) => sum + t.paid, 0);
  const totalBalance = Math.round((openingBalance + totalAmountColumn - totalPaid) * 100) / 100;

  const ledgerColumns = [
    { label: "Date", align: "start" as const },
    { label: "Type / Ref", align: "start" as const },
    { label: "Amount", align: "start" as const },
    { label: "Paid", align: "start" as const },
    { label: "Balance", align: "start" as const },
  ];

  const columns = [
    { label: "PO Number", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Total Amount", align: "end" as const },
    { label: "Status", align: "center" as const },
    { label: "Actions", align: "center" as const },
  ];

  const voucherColumns = [
    { label: "Voucher / Ref", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Amount", align: "end" as const },
    { label: "Type", align: "center" as const },
  ];

  return (
    <CustomModal
      title="Supplier Purchase History"
      open={isOpen}
      onOpenChange={onClose}
      width="65%"
    >
      <Stack gap={6}>
        <Box
          p={5}
          bg="brand.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="brand.200"
          shadow="sm"
        >
          <HStack justify="space-between" mb={4}>
            <Box>
              <Heading size="md" textTransform="capitalize" color="brand.900">
                {supplier.name}
              </Heading>
              <Text fontSize="sm" color="brand.700" fontWeight="medium">
                Supplier Profile
              </Text>
            </Box>
            <Badge colorPalette="brand" variant="solid" size="lg">
              {supplier.orders?.length || 0} Orders
            </Badge>
          </HStack>

          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.600"
                textTransform="uppercase"
              >
                Mobile
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {supplier.mobile}
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.600"
                textTransform="uppercase"
              >
                Email
              </Text>
              <Text fontSize="sm" fontWeight="bold" truncate>
                {supplier.email || "N/A"}
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.600"
                textTransform="uppercase"
              >
                GSTIN
              </Text>
              <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                {supplier.gstNumber || "N/A"}
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="brand.600"
                textTransform="uppercase"
              >
                Address
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {supplier.address || "N/A"}
              </Text>
            </Box>
          </Grid>
        </Box>

        <Tabs.Root defaultValue="orders">
          <Tabs.List mb={4}>
            <Tabs.Trigger value="orders">Purchase Orders</Tabs.Trigger>
            <Tabs.Trigger value="vouchers">Voucher History</Tabs.Trigger>
            <Tabs.Trigger value="ledger">Supplier Ledger</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="orders">
            <Box borderRadius="md" borderWidth="1px" overflow="hidden">
              <CustomTable
                columns={columns}
                data={supplier.orders || []}
                maxRows={8}
                renderRow={(o) => {
                  const isBilled = o.isBilled || o.is_billed === 1;
                  const relatedBill = supplier.bills?.find(
                    (b: any) => b.poId === o.id,
                  );

                  return (
                    <Table.Row key={o.id}>
                      <Table.Cell fontSize="sm" fontWeight="bold" color="brand.600">
                        {o.orderNumber}
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {formatDate(o.orderDate)}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" fontWeight="bold" textAlign="end">
                        ₹{Number(o.totalAmount || 0).toFixed(2)}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge
                          colorPalette={isBilled ? "orange" : "green"}
                          variant="solid"
                        >
                          {isBilled ? "BILLED" : "OPEN"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex justify="center" gap={2}>
                          <Tooltip content="View Purchase Order">
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="brand"
                              onClick={() => onOrderAction("view", o)}
                            >
                              <MdVisibility />
                            </IconButton>
                          </Tooltip>

                          {!isBilled && (
                            <>
                              {" "}
                              <Tooltip content="Edit Purchase Order">
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="brand"
                                  onClick={() => onOrderAction("edit", o)}
                                >
                                  <MdEdit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Delete Purchase Order">
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={() => onOrderDelete(o)}
                                  aria-label="Delete Order"
                                >
                                  <MdDelete />
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Create Purchase Bill">
                                <IconButton
                                  size="xs"
                                  variant="solid"
                                  colorPalette="green"
                                  onClick={() => onOrderAction("bill", o)}
                                >
                                  <MdReceipt />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip content="Download Purchase Order">
                            <IconButton
                              size="xs"
                              colorPalette="red"
                              onClick={() => onDownloadPO(o)}
                            >
                              <MdPictureAsPdf />
                            </IconButton>
                          </Tooltip>

                          {isBilled && (
                            <Tooltip content="View Purchase Bill">
                              <IconButton
                                size="xs"
                                variant="solid"
                                colorPalette="green"
                                onClick={() => onViewBill("view", relatedBill)}
                              >
                                <MdReceipt />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              />
            </Box>
            <Button width="full" mt={4} colorPalette="brand" onClick={onAddNewOrder}>
              <MdAdd /> Create New Order
            </Button>
          </Tabs.Content>

          <Tabs.Content value="vouchers">
            <Box borderRadius="md" borderWidth="1px" overflow="hidden">
              <CustomTable
                columns={voucherColumns}
                data={supplierVouchers}
                maxRows={8}
                renderRow={(v) => (
                  <Table.Row key={v.id}>
                    <Table.Cell fontSize="sm" fontWeight="bold" color="brand.600">
                      {v.voucherType} - {v.referenceNo || "N/A"}
                    </Table.Cell>
                    <Table.Cell fontSize="sm">
                      {formatDate(v.voucherDate)}
                    </Table.Cell>
                    <Table.Cell fontSize="sm" fontWeight="bold" textAlign="end">
                      ₹{Number(v.amount || 0).toFixed(2)}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Badge
                        colorPalette={v.transactionSide === "DEBIT" ? "orange" : "green"}
                        variant="solid"
                      >
                        {v.transactionSide}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                )}
              />
            </Box>
          </Tabs.Content>

          <Tabs.Content value="ledger">
            <Stack gap={3}>
              <HStack justify="space-between">
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">
                    Account Ledger
                  </Text>
                </HStack>
                {(ledgerTransactions.length > 0 || openingBalance > 0) && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="brand"
                    onClick={() => {
                      const exportData: any[] = [];
                      if (openingBalance > 0) {
                        exportData.push({
                          Date: "Initial",
                          "Type / Ref": "Opening Balance",
                          "Amount": openingBalance,
                          Paid: 0,
                          Balance: openingBalance,
                        });
                      }
                      
                      let runningBalance = openingBalance;
                      ledgerTransactions.forEach((t: any) => {
                        const amountCol = Math.round(t.amount * 100) / 100;
                        runningBalance = Math.round((runningBalance + amountCol - t.paid) * 100) / 100;
                        
                        exportData.push({
                          Date: formatDate(t.date),
                          "Type / Ref": t.type === 'BILL' ? `Bill (${t.ref})` : `Voucher (${t.ref})`,
                          "Amount": amountCol,
                          Paid: t.paid,
                          Balance: runningBalance > 0 ? runningBalance : 0,
                        });
                      });
                      exportData.push({
                        Date: "",
                        "Type / Ref": "GRAND TOTAL",
                        "Amount": totalAmountColumn + openingBalance,
                        Paid: totalPaid,
                        Balance: totalBalance > 0 ? totalBalance : 0,
                      });
                      handleExport(exportData, "xlsx", `${supplier.name}_Ledger`);
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
                      {ledgerColumns.map((col, i) => (
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
                        <Table.Cell color="green.600">₹0</Table.Cell>
                        <Table.Cell color="red.600" fontWeight="bold">
                          {`₹${openingBalance}`}
                        </Table.Cell>
                      </Table.Row>
                    )}
                    {(() => {
                      let uiRunningBalance = openingBalance;
                      return ledgerTransactions.map((t) => {
                        const amountCol = Math.round(t.amount * 100) / 100;
                        uiRunningBalance = Math.round((uiRunningBalance + amountCol - t.paid) * 100) / 100;

                        return (
                          <Table.Row key={t.id} _hover={{ bg: "brand.50" }}>
                            <Table.Cell>{formatDate(t.date)}</Table.Cell>
                            <Table.Cell fontWeight="medium">
                              {t.type === 'BILL' ? `Bill (${t.ref})` : <Badge colorPalette="purple" size="sm">Voucher: {t.ref}</Badge>}
                            </Table.Cell>
                            <Table.Cell>{`₹${amountCol}`}</Table.Cell>
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
                        <Table.Cell fontWeight="bold" color="green.600">{`₹${totalPaid}`}</Table.Cell>
                        <Table.Cell fontWeight="bold" color="red.600">{`₹${totalBalance > 0 ? totalBalance : 0}`}</Table.Cell>
                      </Table.Row>
                    </Table.Footer>
                  )}
                </Table.Root>
              </Box>
            </Stack>
          </Tabs.Content>
        </Tabs.Root>
      </Stack>
    </CustomModal>
  );
};
