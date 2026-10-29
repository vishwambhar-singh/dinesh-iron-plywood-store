import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import InvoiceTemplate from "@/pdf";
import { SupplierPDFDocument } from "@/pdf/SupplierPDFDocument";

export const getInvoiceBlob = async (
  sale: any,
  companyData: any,
  returns: any[] = [],
  legal?: string,
  template?: string,
) => {
  const invoiceReturns = returns.filter(
    (r: any) => r.originalSaleId === sale.id,
  );

  const doc = (
    <InvoiceTemplate
      data={sale}
      companyData={companyData}
      gstType={sale.gstType}
      returns={invoiceReturns}
      legal={legal}
      template={template}
    />
  );

  return await pdf(doc).toBlob();
};

export const generateInvoicePDF = async (
  sale: any,
  companyData: any,
  returns: any[] = [],
  legal?: string,
  template?: string,
) => {
  try {
    const blob = await getInvoiceBlob(
      sale,
      companyData,
      returns,
      legal,
      template,
    );
    const fileName = `${sale.invoiceNumber || "Invoice"}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error("PDF Download Error:", error);
  }
};

export const sendInvoiceEmail = async (
  sendMailMutation: any,
  sale: any,
  companyData: any,
  returns: any[] = [],
  legal?: string,
  template?: string,
) => {
  try {
    const blob = await getInvoiceBlob(
      sale,
      companyData,
      returns,
      legal,
      template,
    );

    const subject = `Invoice for your purchase: ${sale.invoiceNumber || "Order"}`;
    const bodyMessage = `Hello ${sale.customerName || "Customer"},\n\nThank you for shopping with us! You have purchased items worth ₹${sale.totalAmount}.\n\nPlease find your attached invoice for more details.\n\nThank you,\nTeam ${companyData.name}`;

    const formData = new FormData();
    const emailList = [];
    if (sale.customerEmail?.trim()) {
      emailList.push(sale.customerEmail.trim());
    }
    if (companyData?.email?.trim()) {
      emailList.push(companyData.email.trim());
    }

    if (emailList.length === 0) {
      throw new Error("No recipient email address found for the customer or company.");
    }

    formData.append("invoice", blob, `${sale.invoiceNumber || "Invoice"}.pdf`);
    formData.append("email", emailList.join(","));
    formData.append("subject", subject);
    formData.append("message", bodyMessage);

    await sendMailMutation(formData).unwrap();
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const generateSupplierPDF = async (
  data: any,
  supplier: any,
  type: "PO" | "BILL" = "PO",
  orderData?: any,
) => {
  try {
    const doc = (
      <SupplierPDFDocument
        data={data}
        supplier={supplier}
        type={type}
        orderData={orderData}
      />
    );

    const blob = await pdf(doc).toBlob();

    const prefix = type === "BILL" ? "BILL" : "PO";
    const number = type === "BILL" ? data.billNumber : data.orderNumber;
    const fileName = `${prefix}_${number || Date.now()}.pdf`;

    saveAs(blob, fileName);
  } catch (error) {
    console.error("Supplier PDF Error:", error);
  }
};
