import { formatDate } from "@/utils/dateUtils";

export const transformAccountingData = (vouchers: any[]) => {
  return vouchers.map((v) => {
    const isCredit = v.transactionSide === "CREDIT";

    return {
      "Bank Name": v.bankName || "N/A",
      Date: v.voucherDate ? formatDate(v.voucherDate) : "N/A",
      "Voucher Type": v.voucherType?.replace("_", " ") || "N/A",
      Particulars: v.particulars?.trim() || "N/A",
      "Reference No": v.referenceNo || "N/A",
      "Payment Mode": v.paymentMode?.replace("_", " ") || "N/A",
      "Deposit (In)": isCredit ? Number(v.amount) : 0,
      "Withdrawal (Out)": !isCredit ? Number(v.amount) : 0,
      Narration: v.narration || "N/A",
    };
  });
};
