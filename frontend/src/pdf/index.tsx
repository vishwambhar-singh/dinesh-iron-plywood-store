import React from "react";
import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
import Header from "./Header";
import Body from "./Body";
import Footer from "./Footer";
import { Sale } from "@/types/sales";
import { CompanyDetails } from "@/types/settings";
import Body1 from "./Body1";

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
  },
});

interface InvoiceTemplateProps {
  data: Sale;
  companyData: CompanyDetails;
  gstType: "LOCAL" | "INTERSTATE" | "NONE";
  returns: any[];
  legal?: string;
  template?: string;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  data,
  companyData,
  gstType,
  returns,
  legal,
  template,
}) => {
  const totalReturnAmount = returns.reduce(
    (sum, r) => sum + Number(r.netRefund || 0),
    0,
  );
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Header
          companyData={companyData}
          customerData={{
            name: data.customerName,
            email: data.customerEmail,
            mobile: data.customerMobile,
            address: data.customerAddress,
            gstNumber: data.gstNumber,
            shippingName: data.shippingName,
            shippingEmail: data.shippingEmail,
            shippingMobile: data.shippingMobile,
            shippingAddress: data.shippingAddress,
            shippingGst: data.shippingGst,
            poNumber: data.poNumber,
            poDate: data.poDate,
            vehicleNo: data.vehicleNo,
          }}
          invoiceNo={data.invoiceNumber}
          date={data.saleDate}
        />
        {template === "box" ? (
          <Body1
            items={data.items || []}
            returns={returns || []}
            gstType={gstType}
            subtotal={data.subtotal || 0}
            discount={data.discount || 0}
            totalAmount={data.totalAmount || 0}
            amountPaid={data.amountPaid || 0}
            gstAmount={data.totalGstAmount || 0}
            balance={data.balance}
            totalReturned={totalReturnAmount || 0}
            payments={data.payments || []}
            freight={data.freightCharges}
          />
        ) : (
          <Body
            items={data.items || []}
            returns={returns || []}
            gstType={gstType}
            subtotal={data.subtotal || 0}
            discount={data.discount || 0}
            totalAmount={data.totalAmount || 0}
            amountPaid={data.amountPaid || 0}
            gstAmount={data.totalGstAmount || 0}
            balance={data.balance}
            totalReturned={totalReturnAmount || 0}
            payments={data.payments || []}
            freight={data.freightCharges}
          />
        )}

        <View
          fixed
          style={{ position: "absolute", bottom: 25, left: 35, right: 35 }}
        >
          <Footer terms={legal} />
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;
