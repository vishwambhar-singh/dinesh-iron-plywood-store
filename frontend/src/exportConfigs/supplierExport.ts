import { Supplier } from "@/types/supplier";

export const transformSupplierData = (suppliers: Supplier[]) => {
  const excelData: any[] = [];

  suppliers.forEach((supplier) => {
    const baseInfo = {
      "Supplier Name": supplier.name,
      "Supplier Mobile": supplier.mobile,
      "Supplier Email": supplier.email,
    };

    if (
      (!supplier.orders || supplier.orders.length === 0) &&
      (!supplier.bills || supplier.bills.length === 0)
    ) {
      excelData.push({
        ...baseInfo,
        "Order Number": "No Orders",
        "Order Date": "N/A",
        "Bill Number": "N/A",
        "Bill Date": "N/A",
        "Bill Total": 0,
        "Bill Paid": 0,
        "Bill Balance": 0,
        "Payment Date": "N/A",
        "Payment Amount": 0,
        "Payment Method": "N/A",
        "Ref No": "N/A",
      });
      return;
    }

    if (supplier.orders && supplier.orders.length > 0) {
      supplier.orders.forEach((order) => {
        const hasBill = supplier.bills?.some((b) => b.poId === order.id);

        if (!hasBill) {
          excelData.push({
            ...baseInfo,
            "Order Number": order.orderNumber,
            "Order Date": new Date(order.orderDate).toLocaleDateString(),
            "Bill Number": "Unbilled",
            "Bill Date": "N/A",
            "Bill Total": 0,
            "Bill Paid": 0,
            "Bill Balance": 0,
            "Payment Date": "N/A",
            "Payment Amount": 0,
            "Payment Method": "N/A",
            "Ref No": "N/A",
          });
        }
      });
    }

    if (supplier.bills && supplier.bills.length > 0) {
      supplier.bills.forEach((bill: any) => {
        const relatedOrder = supplier.orders?.find((o) => o.id === bill.poId);

        const billInfo = {
          ...baseInfo,
          "Order Number": relatedOrder
            ? relatedOrder.orderNumber
            : bill.poNumber || "Direct Bill",
          "Order Date": relatedOrder
            ? new Date(relatedOrder.orderDate).toLocaleDateString()
            : bill.poDate
              ? new Date(bill.poDate).toLocaleDateString()
              : "N/A",
          "Bill Number": bill.billNumber,
          "Bill Date": new Date(bill.billDate).toLocaleDateString(),
          "Bill Total": Number(bill.totalAmount),
          "Bill Paid": Number(bill.amountPaid),
          "Bill Balance": Number(bill.balanceAmount),
        };

        if (!bill.payments || bill.payments.length === 0) {
          excelData.push({
            ...billInfo,
            "Payment Date": "No Payments",
            "Payment Amount": 0,
            "Payment Method": "N/A",
            "Ref No": "N/A",
          });
          return;
        }

        bill.payments.forEach((payment: any) => {
          excelData.push({
            ...billInfo,
            "Payment Date": new Date(payment.paymentDate).toLocaleDateString(),
            "Payment Amount": Number(payment.amount),
            "Payment Method": payment.method,
            "Ref No": payment.referenceNumber || "N/A",
          });
        });
      });
    }
  });

  return excelData;
};
