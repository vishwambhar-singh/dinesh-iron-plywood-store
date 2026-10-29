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

interface POPDFProps {
  po: any;
  supplierName: string;
  isActual?: boolean;
}

export const PurchaseOrderPDF = ({ po, supplierName, isActual = false }: POPDFProps) => {
  const companyName = isActual ? 'PDS - Godown' : 'PLY DECORE SALES';
  const gstNumber = isActual ? '07AAAAA0000A1Z5' : '07BKXPS4512M1Z2';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ position: 'absolute', top: 200, left: 100, right: 100, bottom: 200, justifyContent: 'center', alignItems: 'center', zIndex: -1, opacity: 0.1 }}>
          <Image src={isActual ? pdsLogo : formalLogo} style={{ width: 400 }} />
        </View>
        <View>
          <Text style={styles.header}>{companyName}</Text>
          <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 2 }}>GSTIN: {gstNumber}</Text>
          <Text style={styles.subHeader}>{isActual ? 'Internal Procurement Note' : 'Formal Purchase Order'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>PO Number:</Text>
            <Text style={styles.value}>{po.bill_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Supplier:</Text>
            <Text style={styles.value}>{supplierName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatToDDMMYY(po.bill_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Voucher Ref:</Text>
            <Text style={styles.value}>{po.voucher_no || 'N/A'}</Text>
          </View>
          {po.supplier_gst && (
            <View style={styles.row}>
              <Text style={styles.label}>Supplier GSTIN:</Text>
              <Text style={styles.value}>{po.supplier_gst}</Text>
            </View>
          )}
          {po.destination && (
            <View style={styles.row}>
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.value}>{po.destination}</Text>
            </View>
          )}
          {po.billing_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Dispatched From:</Text>
              <Text style={styles.value}>{po.billing_address}</Text>
            </View>
          )}
          {po.dispatch_through && (
            <View style={styles.row}>
              <Text style={styles.label}>Dispatched Through:</Text>
              <Text style={styles.value}>{po.dispatch_through}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableColHeader, width: '45%' }}>Item Description (Shade)</Text>
            <Text style={{ ...styles.tableColHeader, width: '15%', textAlign: 'center' }}>Qty</Text>
            <Text style={{ ...styles.tableColHeader, width: '20%', textAlign: 'right' }}>Rate</Text>
            <Text style={{ ...styles.tableColHeader, width: '20%', textAlign: 'right' }}>Total</Text>
          </View>
          
          {(po.items || []).map((item: any, index: number) => {
            const price = isActual ? (item.actual_price || item.price) : item.price;
            const total = isActual ? (item.actual_line_total || (item.received_qty * price)) : item.price_after_gst;
            const shade = item.shade_label || item.shade_id_label || '';
            
            return (
              <View style={styles.tableRow} key={index}>
                <Text style={{ ...styles.tableCol, width: '45%' }}>{item.name} {shade ? `(${shade})` : ''}</Text>
                <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'center' }}>{item.received_qty}</Text>
                <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(price).toFixed(2)}</Text>
                <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(total).toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={{ ...styles.tableRow, borderTop: '1px solid #1a365d', borderBottom: 'none', backgroundColor: '#f1f5f9' }}>
            <Text style={{ ...styles.tableCol, width: '45%', fontWeight: 'bold' }}>TOTALS</Text>
            <Text style={{ ...styles.tableCol, width: '15%', textAlign: 'center', fontWeight: 'bold' }}>
              {(po.items || []).reduce((sum: number, item: any) => sum + (Number(item.received_qty) || 0), 0)}
            </Text>
            <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>-</Text>
            <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right', fontWeight: 'bold' }}>
              {(po.items || []).reduce((sum: number, item: any) => {
                const price = isActual ? (Number(item.actual_price) || Number(item.price) || 0) : (Number(item.price) || 0);
                return sum + (isActual ? (Number(item.actual_line_total) || ((Number(item.received_qty) || 0) * price)) : Number(item.price_after_gst));
              }, 0).toFixed(2)}
            </Text>
          </View>


          <View style={{ ...styles.tableRow, borderBottom: 'none', paddingVertical: 2 }}>
            <Text style={{ ...styles.tableCol, width: '40%' }}></Text>
            {isActual && parseFloat(po.extra_charges) > 0 && (
                <>
                    <Text style={{ ...styles.tableCol, width: '40%' }}>{po.extra_charge_name || 'Extra Charges'}</Text>
                    <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(po.extra_charges).toFixed(2)}</Text>
                </>
            )}
          </View>
          <View style={{ ...styles.tableRow, borderBottom: 'none', paddingVertical: 2 }}>
            <Text style={{ ...styles.tableCol, width: '40%' }}></Text>
            {parseFloat(po.insurance_amount) > 0 && (
                <>
                    <Text style={{ ...styles.tableCol, width: '40%' }}>{po.insurance_name || 'Insurance'}</Text>
                    <Text style={{ ...styles.tableCol, width: '20%', textAlign: 'right' }}>{parseFloat(po.insurance_amount).toFixed(2)}</Text>
                </>
            )}
          </View>
        </View>

        {!isActual && po.gst_type && (
          <View style={{ marginTop: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 4 }}>
             <Text style={styles.label}>Tax Summary ({po.gst_type}):</Text>
             <View style={{ flexDirection: 'row', marginTop: 5 }}>
                 {po.gst_type === 'LOCAL' ? (
                     <>
                        <Text style={{ ...styles.value, marginRight: 20 }}>CGST: {(po.items || []).reduce((s:number, i:any) => s + (Number(i.cgst) || 0), 0).toFixed(2)}</Text>
                        <Text style={styles.value}>SGST: {(po.items || []).reduce((s:number, i:any) => s + (Number(i.sgst) || 0), 0).toFixed(2)}</Text>
                     </>
                 ) : (
                        <Text style={styles.value}>IGST: {(po.items || []).reduce((s:number, i:any) => s + (Number(i.igst) || 0), 0).toFixed(2)}</Text>
                 )}
             </View>
          </View>
        )}

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 }}>
          <View style={styles.row}>
            <Text style={{ ...styles.label, fontSize: 12 }}>Grand Total:</Text>
            <Text style={{ ...styles.value, fontSize: 12, fontWeight: 'bold' }}>
              Rs {parseFloat(isActual ? (po.actual_total || po.net_godown_total) : po.total_amount).toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {isActual 
            ? 'PDS Internal Document - ERP Synchronized' 
            : 'Computer Generated Purchase Order. ERP Powered.'}
        </Text>
      </Page>
    </Document>
  );
};
