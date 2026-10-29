import { Sale } from "@/types/sales";

export const transformSalesData = (sales: Sale[]) => {
  const excelData: any[] = [];

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      excelData.push({
        "Invoice Number": sale.invoiceNumber,
        "Customer Name": sale.customerName,
        "Customer Email": sale.customerEmail,
        "Customer Mobile": sale.customerMobile,
        "Sale Date": sale.saleDate,
        "GST Type": sale.gstType,
        Subtotal: sale.subtotal,
        "Total GST Amount": sale.totalGstAmount,
        Discount: sale.discount,
        "Total Amount": sale.totalAmount,
        "Amount Paid": sale.amountPaid,
        Balance: sale.balance,
        "Payment Status": sale.paymentStatus,
        "Reference ID": sale.referenceId ?? "",
        "Product Name": item.name,
        hsn: item.hsn,
        Quantity: item.qty,
        Price: item.price,
        CGST: item.cgst,
        SGST: item.sgst,
        IGST: item.igst,
        "GST Amount": item.gstAmount,
        "Price After GST": item.priceAfterGst,
      });
    });
  });

  return excelData;
};
