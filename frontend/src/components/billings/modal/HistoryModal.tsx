import { Box, Grid, HStack, Stack, Text, IconButton } from "@chakra-ui/react";
import { CustomModal } from "@/components/ui/CustomModal";
import { CustomTable } from "@/components/ui/CustomTable";
import { MdPictureAsPdf, MdEdit, MdEmail, MdVisibility } from "react-icons/md";
import { Sale } from "@/types/sales";
import { formatDate } from "@/utils/dateUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: Sale;
  customerHistory: Sale[];
  onViewInvoice: (invoice: Sale) => void;
  onEditInvoice: (invoice: Sale) => void;
  onDownloadPdf: (invoice: Sale) => void;
  onSendEmail: (invoice: Sale) => void;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  bill,
  customerHistory,
  onViewInvoice,
  onEditInvoice,
  onDownloadPdf,
  onSendEmail,
}: Props) => {
  const columns = [
    { label: "Name", align: "start" as const },
    { label: "Invoice No", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Total Amount", align: "end" as const },
    { label: "Balance", align: "end" as const },
    { label: "Action", align: "center" as const },
  ];

  return (
    <CustomModal
      open={isOpen}
      onOpenChange={onClose}
      title="Customer Transaction History"
    >
      <Stack gap={6}>
        <Box p={4} borderRadius="lg" bg="bg.muted" borderWidth="1px">
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Box>
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                Customer Name
              </Text>
              <Text fontWeight="bold">{bill.customerName}</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                Contact
              </Text>
              <Text fontWeight="bold">{bill.customerEmail}</Text>
              <Text fontWeight="bold">{bill.customerMobile}</Text>
            </Box>
          </Grid>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
          <CustomTable
            columns={columns}
            data={customerHistory}
            renderRow={(inv: Sale) => (
              <tr key={inv.id}>
                <td style={{ padding: "12px" }}>
                  <Text fontWeight="medium">{inv.customerName}</Text>
                </td>
                <td style={{ padding: "12px" }}>
                  <Text fontWeight="medium">{inv.invoiceNumber}</Text>
                </td>
                <td style={{ padding: "12px" }}>
                  <Text fontSize="sm">{formatDate(inv.saleDate)}</Text>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <Text>₹{inv.totalAmount.toLocaleString()}</Text>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <Text
                    fontWeight="bold"
                    color={inv.balance > 0 ? "red.600" : "green.600"}
                  >
                    {Number(inv?.balance) < 0 ? "Refund: " : ""}₹
                    {Math.abs(inv?.balance).toLocaleString()}
                  </Text>
                </td>
                <td style={{ padding: "12px" }}>
                  <HStack gap={2} justify="center">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onDownloadPdf(inv)}
                    >
                      <MdPictureAsPdf />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onSendEmail(inv)}
                    >
                      <MdEmail />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="blue"
                      onClick={() => onEditInvoice(inv)}
                    >
                      <MdEdit />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      colorPalette="blue"
                      onClick={() => onViewInvoice(inv)}
                    >
                      <MdVisibility />
                    </IconButton>
                  </HStack>
                </td>
              </tr>
            )}
          />
        </Box>
      </Stack>
    </CustomModal>
  );
};
