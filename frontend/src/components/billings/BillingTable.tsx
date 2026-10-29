import { Box, HStack, Table, IconButton, Text, Badge } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import {
  MdVisibility,
  MdEdit,
  MdHistory,
  MdPictureAsPdf,
  MdEmail,
} from "react-icons/md";
import { Sale } from "@/types/sales";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

interface Props {
  bills: Sale[];
  onView: (bill: Sale) => void;
  onEdit: (bill: Sale) => void;
  onHistory: (bill: Sale) => void;
  onDownloadPdf: (bill: Sale) => void;
  onSendEmail: (bill: Sale) => void;
  loading: boolean;
  activeTab?: string;
}

export const BillingTable = ({
  bills,
  onView,
  onEdit,
  onHistory,
  onDownloadPdf,
  onSendEmail,
  loading,
  activeTab,
}: Props) => {
  const { isSuperAdmin } = useAuth();

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const getBillNum = (invoice?: string) => {
        if (!invoice) return null;
        const match = invoice.trim().match(/\/(\d+)$/);
        return match && match[1] ? parseInt(match[1], 10) : null;
      };

      const numA = getBillNum(a.invoiceNumber);
      const numB = getBillNum(b.invoiceNumber);

      if (numA !== null && numB !== null) {
        return numB - numA;
      }

      if (numA !== null) return -1;
      if (numB !== null) return 1;

      const dateA = new Date((a as any).createdAt || a.saleDate || 0).getTime();
      const dateB = new Date((b as any).createdAt || b.saleDate || 0).getTime();
      return dateB - dateA;
    });
  }, [bills]);

  const columns = [
    { label: "S.No", align: "start" as const },
    { label: "Customer Name", align: "start" as const },
    { label: "Bill No", align: "start" as const },
    ...(isSuperAdmin && activeTab === "all"
      ? [{ label: "Type", align: "start" as const }]
      : []),
    { label: "Total Bill", align: "end" as const },
    { label: "Status & Balance", align: "end" as const },
    { label: "Action", align: "center" as const },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PAID":
        return "green";
      case "PARTIALLY_PAID":
        return "orange";
      case "PENDING":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) return <CustomSpinner message="Fetching Bills" />;

  return (
    <Box
      bg="bg.panel"
      p={6}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="brand.200"
    >
      <CustomTable
        columns={columns}
        data={sortedBills}
        renderRow={(bill, index) => (
          <Table.Row key={bill.id} _hover={{ bg: "brand.50" }}>
            <Table.Cell py={4} px={4}>
              <Text fontSize="sm">{index + 1}</Text>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <Text fontWeight="bold">{bill.customerName}</Text>
            </Table.Cell>
            <Table.Cell py={4} px={4}>
              <Text fontSize="sm">{bill.invoiceNumber}</Text>
            </Table.Cell>
            {isSuperAdmin && activeTab === "all" && (
              <Table.Cell py={4} fontWeight="bold">
                {bill.saleType}
              </Table.Cell>
            )}

            <Table.Cell py={4} px={4} textAlign="right">
              <Text fontWeight="medium">
                ₹{Number(bill?.totalAmount)?.toLocaleString()}
              </Text>
            </Table.Cell>

            <Table.Cell py={4} px={4} textAlign="right">
              <Box>
                {Number(bill?.balance) > 0 && (
                  <Badge
                    colorPalette={getStatusColor(bill?.paymentStatus)}
                    variant="solid"
                    size="sm"
                    mb={1}
                  >
                    {bill.paymentStatus?.replace("_", " ")}
                  </Badge>
                )}

                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={
                    Number(bill?.balance) > 0
                      ? "red.600"
                      : Number(bill?.balance) < 0
                        ? "green.600"
                        : "gray.500"
                  }
                >
                  {Number(bill?.balance) < 0 ? "Refund: " : ""}₹
                  {Math.abs(bill?.balance).toLocaleString()}
                </Text>

                {Number(bill?.balance) === 0 && (
                  <Text fontSize="xs" color="gray.400">
                    Settled
                  </Text>
                )}
              </Box>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <HStack gap={1} justify="center">
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onView(bill)}
                >
                  <MdVisibility />
                </IconButton>

                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="blue"
                  onClick={() => onEdit(bill)}
                >
                  <MdEdit />
                </IconButton>

                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="red"
                  onClick={() => onDownloadPdf(bill)}
                >
                  <MdPictureAsPdf />
                </IconButton>

                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="red"
                  onClick={() => onSendEmail(bill)}
                >
                  <MdEmail />
                </IconButton>

                <IconButton
                  variant="subtle"
                  size="sm"
                  colorPalette="purple"
                  onClick={() => onHistory(bill)}
                >
                  <MdHistory />
                </IconButton>
              </HStack>
            </Table.Cell>
          </Table.Row>
        )}
      />
    </Box>
  );
};
