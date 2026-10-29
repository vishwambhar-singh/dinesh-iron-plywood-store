import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import formalLogo from '../assets/LOGO.png';
import pdsLogo from '../assets/pds_logo.png';
import { formatToDDMMYY } from '../utils/date';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center', color: '#1a365d' },
  subHeader: { fontSize: 10, marginBottom: 20, textAlign: 'center', color: '#4a5568', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#4a5568' },
  value: { fontSize: 10, color: '#1a202c' },
  section: { marginVertical: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #1a365d', paddingBottom: 5, marginBottom: 5, backgroundColor: '#f8fafc' },
  tableColHeader: { width: '25%', fontSize: 9, fontWeight: 'bold', color: '#1a365d' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #edf2f7', paddingVertical: 5 },
  tableCol: { width: '25%', fontSize: 9, color: '#2d3748' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#a0aec0', borderTop: '1px solid #e2e8f0', paddingTop: 10 }
});

interface InvoiceProps {
  receipt: any;
  cart: any[];
  mode: 'SALE' | 'PURCHASE';
  entityName?: string;
  isActual?: boolean; // New prop to toggle branding
}

export const InvoiceDocument = ({ receipt, cart, mode, entityName, isActual = false }: InvoiceProps) => {
  const companyName = isActual ? 'PDS - Godown' : 'PLY DECORE SALES';
  const gstNumber = isActual ? '07AAAAA0000A1Z5' : '07BKXPS4512M1Z2'; // Fake GST for Actual

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ position: 'absolute', top: 200, left: 100, right: 100, bottom: 200, justifyContent: 'center', alignItems: 'center', zIndex: -1, opacity: 0.1 }}>
          <Image src={isActual ? pdsLogo : formalLogo} style={{ width: 400 }} />
        </View>
        <View>
          <Text style={styles.header}>{companyName}</Text>
          <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 2 }}>GSTIN: {gstNumber}</Text>
          <Text style={styles.subHeader}>{isActual ? 'Internal Delivery Note' : (mode === 'SALE' ? 'Tax Invoice' : 'Purchase Order')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{isActual ? 'Ref Number:' : 'Invoice Number:'}</Text>
            <Text style={styles.value}>{receipt.invoice_number || receipt.bill_number || receipt.voucher_no}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{mode === 'SALE' ? 'Customer:' : 'Supplier:'}</Text>
            <Text style={styles.value}>{entityName || 'Cash Client'}</Text>
          </View>
          {receipt.destination && (
              <View style={styles.row}>
                <Text style={styles.label}>Destination:</Text>
                <Text style={styles.value}>{receipt.destination}</Text>
              </View>
          )}
          {receipt.billing_address && (
              <View style={styles.row}>
                <Text style={styles.label}>Consignee (Ship To):</Text>
                <Text style={styles.value}>{receipt.billing_address}</Text>
              </View>
          )}
          {receipt.customer_gst && (
              <View style={styles.row}>
                <Text style={styles.label}>Customer GSTIN:</Text>
                <Text style={styles.value}>{receipt.customer_gst}</Text>
              </View>
          )}
          {receipt.dispatch_through && (
              <View style={styles.row}>
                <Text style={styles.label}>Dispatched Through:</Text>
                <Text style={styles.value}>{receipt.dispatch_through}</Text>
              </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatToDDMMYY(new Date())}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableColHeader, width: '40%' }}>Item Description</Text>
            <Text style={{ ...styles.tableColHeader, width: '10%', textAlign: 'center' }}>Qty</Text>
            <Text style={{ ...styles.tableColHeader, width: '15%', textAlign: 'right' }}>Rate</Text>
            <Text style={{ ...styles.tableColHeader, width: '15%', textAlign: 'right' }}>Tax</Text>
            <Text style={{ ...styles.tableColHeader, width: '20%', textAlign: 'right' }}>Total</Text>
          </View>
          
          {cart.map((item, index) => {
            const price = isActual ? (item.actual_price || item.price || item.pakka_price) : (item.price || item.pakka_price);
            const qty = item.qty || item.received_qty || 0;
            const subtotal = qty * price;
            const taxAmt = isActual ? 0 : (item.gst_amount || (subtotal * 0.18)); // Default 18% if not passed
            const total = isActual ? (item.actual_line_total || subtotal) : (item.price_after_gst || (subtotal + taxAmt));
            
            return (
              <View style={styles.tableRow} key={index}>
                <Text style={{ ...styles.tableCol, width: '40%' }}>{item.name || item.item_name} {item.shade_label ? `(${item.shade_label})` : ''}</Text>
                <Text style={{ ...styles.tableCol, width: '10%', textAlign: 'center' }}>{qty}</Text>
                <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>{parseFloat(price).toFixed(2)}</Text>
                <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>{!isActual ? parseFloat(taxAmt).toFixed(2) : '-'}</Text>
                <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(total).toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={{ ...styles.tableRow, borderTop: '1px solid #1a365d', borderBottom: 'none', backgroundColor: '#f1f5f9' }}>
            <Text style={{ ...styles.tableCol, width: '40%', fontWeight: 'bold' }}>TOTALS</Text>
            <Text style={{ ...styles.tableCol, width: '10%', textAlign: 'center', fontWeight: 'bold' }}>
              {cart.reduce((sum: number, item: any) => sum + (Number(item.qty) || Number(item.received_qty) || 0), 0)}
            </Text>
            <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>-</Text>
            <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right', fontWeight: 'bold' }}>
              {!isActual ? cart.reduce((sum: number, item: any) => {
                const price = Number(item.price) || Number(item.pakka_price) || 0;
                const qty = Number(item.qty) || Number(item.received_qty) || 0;
                return sum + (Number(item.gst_amount) || (qty * price * 0.18));
              }, 0).toFixed(2) : '-'}
            </Text>
            <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right', fontWeight: 'bold' }}>
              {cart.reduce((sum: number, item: any) => {
                const price = isActual ? (Number(item.actual_price) || Number(item.price) || Number(item.pakka_price) || 0) : (Number(item.price) || Number(item.pakka_price) || 0);
                const qty = Number(item.qty) || Number(item.received_qty) || 0;
                const subtotal = qty * price;
                const taxAmt = isActual ? 0 : (Number(item.gst_amount) || (subtotal * 0.18));
                return sum + (isActual ? (Number(item.actual_line_total) || subtotal) : (Number(item.price_after_gst) || (subtotal + taxAmt)));
              }, 0).toFixed(2)}
            </Text>
          </View>


          {isActual && parseFloat(receipt.extra_charges) > 0 && (
              <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableCol, width: '40%' }}>{receipt.extra_charge_name || 'Extra Charges'}</Text>
                  <Text style={{ ...styles.tableCol, width: '10%', textAlign: 'center' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(receipt.extra_charges).toFixed(2)}</Text>
              </View>
          )}
          {parseFloat(receipt.insurance_amount) > 0 && (
              <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableCol, width: '40%' }}>{receipt.insurance_name || 'Insurance'}</Text>
                  <Text style={{ ...styles.tableCol, width: '10%', textAlign: 'center' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'right' }}>-</Text>
                  <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(receipt.insurance_amount).toFixed(2)}</Text>
              </View>
          )}
        </View>

        {!isActual && receipt.gst_type && (
          <View style={{ marginTop: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 4 }}>
             <Text style={styles.label}>Tax Summary ({receipt.gst_type}):</Text>
             <View style={{ flexDirection: 'row', marginTop: 5 }}>
                 {receipt.gst_type === 'LOCAL' ? (
                     <>
                        <Text style={{ ...styles.value, marginRight: 20 }}>CGST: {cart.reduce((s,i) => s + ((i.gst_amount || (i.qty * i.pakka_price * 0.18)) / 2), 0).toFixed(2)}</Text>
                        <Text style={styles.value}>SGST: {cart.reduce((s,i) => s + ((i.gst_amount || (i.qty * i.pakka_price * 0.18)) / 2), 0).toFixed(2)}</Text>
                     </>
                 ) : (
                        <Text style={styles.value}>IGST: {cart.reduce((s,i) => s + (i.gst_amount || (i.qty * i.pakka_price * 0.18)), 0).toFixed(2)}</Text>
                 )}
             </View>
          </View>
        )}

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 }}>
          {(() => {
            const fallbackSubtotal = cart.reduce((sum: number, c: any) => sum + ((c.price || c.pakka_price || 0) * (c.qty || c.received_qty || 0)), 0);
            const fallbackGst = isActual ? 0 : cart.reduce((sum: number, c: any) => sum + (c.gst_amount || (((c.price || c.pakka_price || 0) * (c.qty || c.received_qty || 0)) * 0.18)), 0);
            const exactTotal = fallbackSubtotal + fallbackGst;
            const roundedTotal = Math.round(exactTotal);
            const roundOff = roundedTotal - exactTotal;
            const finalTotal = isActual ? fallbackSubtotal : roundedTotal;
            
            return (
              <>
                {!isActual && (
                  <>
                    <View style={styles.row}>
                      <Text style={{ ...styles.label, fontSize: 10 }}>Subtotal:</Text>
                      <Text style={{ ...styles.value, fontSize: 10 }}>Rs {exactTotal.toFixed(2)}</Text>
                    </View>
                    {Math.abs(roundOff) > 0 && (
                      <View style={styles.row}>
                        <Text style={{ ...styles.label, fontSize: 10 }}>Round Off:</Text>
                        <Text style={{ ...styles.value, fontSize: 10 }}>Rs {(roundOff > 0 ? '+' : '') + roundOff.toFixed(2)}</Text>
                      </View>
                    )}
                  </>
                )}
                <View style={{ ...styles.row, marginTop: 5, borderTop: '1px solid #e2e8f0', paddingTop: 5 }}>
                  <Text style={{ ...styles.label, fontSize: 12 }}>Grand Total:</Text>
                  <Text style={{ ...styles.value, fontSize: 12, fontWeight: 'bold' }}>
                    Rs {finalTotal.toFixed(2)}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>

        <Text style={styles.footer}>
          {isActual 
            ? 'PDS Internal Document - Not for Legal/Tax Purposes' 
            : 'This is a computer generated Tax Invoice. All disputes subject to local jurisdiction.'}
        </Text>
      </Page>
    </Document>
  );
};
