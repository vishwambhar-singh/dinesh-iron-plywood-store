import { Box, HStack, Stack, Table, IconButton, Text, Badge } from "@chakra-ui/react";
import { CustomTable } from "../ui/CustomTable";
import { MdEdit, MdDelete, MdVisibility, MdCheckCircle, MdCancel } from "react-icons/md";
import { formatDate } from "@/utils/dateUtils";
import { CustomSpinner } from "../ui/CustomSpinner";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  vouchers: any[];
  onEdit: (voucher: any) => void;
  onDelete: (id: string) => void;
  onView: (voucher: any) => void;
  onApprove?: (id: string, status: string) => void;
  loading: boolean;
}

export const VoucherList = ({
  vouchers,
  onEdit,
  onDelete,
  onView,
  onApprove,
  loading,
}: Props) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const columns = [
    { label: "S.No", align: "start" as const },
    { label: "Date", align: "start" as const },
    { label: "Type", align: "start" as const },
    { label: "Particulars & Narration", align: "start" as const },
    { label: "Mode", align: "center" as const },
    { label: "Amount", align: "end" as const },
    { label: "Status", align: "center" as const },
    { label: "Actions", align: "center" as const },
  ];

  const getVoucherBadge = (type: string) => {
    switch (type) {
      case "SALES_RECEIPT":
        return (
          <Badge colorPalette="green" variant="solid">
            Receipt
          </Badge>
        );
      case "PURCHASE_PAYMENT":
        return (
          <Badge colorPalette="red" variant="solid">
            Payment
          </Badge>
        );
      case "CONTRA":
        return (
          <Badge colorPalette="purple" variant="solid">
            Contra
          </Badge>
        );
      case "EXPENSE":
        return (
          <Badge colorPalette="orange" variant="solid">
            Expense
          </Badge>
        );
      default:
        return <Badge colorPalette="gray">General</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge colorPalette="green">Approved</Badge>;
      case "REJECTED":
        return <Badge colorPalette="red">Rejected</Badge>;
      default:
        return <Badge colorPalette="yellow">Pending</Badge>;
    }
  };

  if (loading) return <CustomSpinner message="Fetching Vouchers..." />;

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
        data={vouchers}
        renderRow={(voucher: any, index: number) => (
          <Table.Row key={voucher.id || index} _hover={{ bg: "brand.50" }}>
            <Table.Cell py={4} px={4}>
              <Text fontSize="sm">{index + 1}</Text>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <Text fontSize="sm">{formatDate(voucher.voucherDate)}</Text>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <Stack gap={1}>
                {getVoucherBadge(voucher.voucherType)}
                {voucher.relatedEntityType !== 'NONE' && voucher.relatedEntityType && (
                   <Text fontSize="xs" color="gray.500" fontWeight="bold">Ref: {voucher.relatedEntityType}</Text>
                )}
              </Stack>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  {voucher.particulars}
                </Text>
                <Text fontSize="xs" color="gray.500" truncate maxW="250px">
                  {voucher.narration || "No narration provided"}
                </Text>
              </Box>
            </Table.Cell>

            <Table.Cell py={4} px={4} textAlign="center">
              <Badge variant="outline" size="sm" colorPalette="blue">
                {voucher.paymentMode?.replace("_", " ")}
              </Badge>
              {voucher.referenceNo && (
                <Text fontSize="xs" fontFamily="mono" color="gray.500" mt={1}>
                  {voucher.referenceNo}
                </Text>
              )}
            </Table.Cell>

            <Table.Cell py={4} px={4} textAlign="right">
              <Text
                fontWeight="bold"
                fontSize="sm"
                color={
                  voucher.transactionSide === "CREDIT" ? "green.600" : "red.600"
                }
              >
                ₹
                {Number(voucher.amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </Table.Cell>

            <Table.Cell py={4} px={4} textAlign="center">
              <Stack gap={2} align="center">
                {getStatusBadge(voucher.status)}
                {voucher.status === "PENDING" && isSuperAdmin && onApprove && (
                   <HStack gap={1}>
                     <IconButton size="xs" colorPalette="green" variant="ghost" onClick={() => onApprove(voucher.id, "APPROVED")}>
                       <MdCheckCircle />
                     </IconButton>
                     <IconButton size="xs" colorPalette="red" variant="ghost" onClick={() => onApprove(voucher.id, "REJECTED")}>
                       <MdCancel />
                     </IconButton>
                   </HStack>
                )}
              </Stack>
            </Table.Cell>

            <Table.Cell py={4} px={4}>
              <HStack gap={1} justify="center">
                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="brand"
                  onClick={() => onView(voucher)}
                >
                  <MdVisibility />
                </IconButton>

                <IconButton
                  variant="ghost"
                  size="sm"
                  colorPalette="blue"
                  onClick={() => onEdit(voucher)}
                >
                  <MdEdit />
                </IconButton>
                {(isSuperAdmin || isAdmin) && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    colorPalette="red"
                    onClick={() => onDelete(voucher)}
                  >
                    <MdDelete />
                  </IconButton>
                )}
              </HStack>
            </Table.Cell>
          </Table.Row>
        )}
      />
    </Box>
  );
};
