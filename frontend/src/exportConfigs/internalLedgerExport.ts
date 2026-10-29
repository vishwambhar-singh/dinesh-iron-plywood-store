import { formatDate } from "@/utils/dateUtils";

export const transformLedgerData = (ledgers: any[]) => {
  return ledgers.map((l) => ({
    Date: new Date(l.date).toLocaleDateString(),
    Type: l.entityType,
    Name: l.name,
    "Total Amount": Number(l.amount),
    "Amount Paid": Number(l.amountPaid),
    Balance: Number(l.amount) - Number(l.amountPaid),
    "Payment Details": l.payments?.length
      ? l.payments
          .map(
            (p: any) =>
              `${p.paymentMode}: ₹${p.amount} (${formatDate(p.paymentDate)})${p.referenceNumber ? ` [Ref: ${p.referenceNumber}]` : ""}`,
          )
          .join(" | ")
      : "No payments",
  }));
};
