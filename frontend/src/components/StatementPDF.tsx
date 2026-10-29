import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import formalLogo from '../assets/LOGO.png';
import pdsLogo from '../assets/pds_logo.png';
import { formatToDDMMYY } from '../utils/date';
import { FileText, Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 7, color: '#333' },
  headerSection: { marginBottom: 10, borderBottom: '1px solid #A02B2B', paddingBottom: 8 },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#A02B2B', marginBottom: 3 },
  subHeader: { fontSize: 8, color: '#666', marginBottom: 3 },
  title: { fontSize: 11, fontWeight: 'bold', textAlign: 'right', marginTop: -25, textTransform: 'uppercase' },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, background: '#f8fafc', padding: 8, borderRadius: 4 },
  infoLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 9, fontWeight: 'bold' },

  table: { width: '100%', marginTop: 5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #cbd5e1', padding: 4 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9', padding: 4, alignItems: 'center' },
  
  colDate: { width: '15%' },
  colRef: { width: '25%' },
  colDesc: { width: '20%' },
  colDebit: { width: '15%', textAlign: 'right' },
  colCredit: { width: '15%', textAlign: 'right' },
  colBal: { width: '10%', textAlign: 'right' },

  summaryBox: { marginTop: 15, alignSelf: 'flex-end', width: '200pt', padding: 8, background: '#f8fafc', borderRadius: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  grandTotal: { borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 4, fontSize: 10, fontWeight: 'bold', color: '#A02B2B' },
  
  footer: { position: 'absolute', bottom: 20, left: 20, right: 20, textAlign: 'center', fontSize: 7, color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 6 }
});

export const StatementDocument = ({ data, isActualMode = false }: { data: any, isActualMode?: boolean }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={isActualMode ? { fontSize: 16, fontWeight: 'bold', color: '#1a365d', textAlign: 'center', marginBottom: 3 } : styles.companyName}>
          {isActualMode ? 'PDS - Godown' : 'Ply Decore Sales'}
        </Text>
        {isActualMode ? (
          <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 3 }}>
            {data.entity_name}
          </Text>
        ) : (
          <Text style={styles.subHeader}>High-Quality Plywood & Hardware Solutions</Text>
        )}
        <Text style={isActualMode ? { fontSize: 10, textAlign: 'center', marginBottom: 8 } : styles.title}>
          {isActualMode ? 'Ledger Account' : 'Account Statement'}
        </Text>
        {(() => {
          let sDate = data.startDate;
          let eDate = data.endDate;
          if ((!sDate || !eDate) && data.transactions && data.transactions.length > 0) {
            if (!sDate) sDate = data.transactions[0].date;
            if (!eDate) eDate = data.transactions[data.transactions.length - 1].date;
          }
          if (sDate || eDate) {
            return (
              <Text style={{ fontSize: 9, textAlign: 'center', marginTop: isActualMode ? 0 : 3 }}>
                {sDate ? new Date(sDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: '2-digit'}) : 'Start'} to {eDate ? new Date(eDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: '2-digit'}) : 'End'}
              </Text>
            );
          }
          return null;
        })()}
      </View>

      {/* Info Grid */}
      {!isActualMode ? (
        <View style={styles.infoGrid}>
          <View>
            <Text style={styles.infoLabel}>Statement For</Text>
            <Text style={styles.infoValue}>{data.entity_name}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.infoLabel}>Opening Balance</Text>
            <Text style={styles.infoValue}>₹{parseFloat(data.opening_balance || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ) : (
        <View style={{ marginBottom: 15, textAlign: 'right' }}>
           <Text style={styles.infoLabel}>Opening Balance</Text>
           <Text style={styles.infoValue}>₹{parseFloat(data.opening_balance || 0).toLocaleString('en-IN')}</Text>
        </View>
      )}

      {/* Table Header */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.colDate, fontWeight: 'bold' }}>Date</Text>
          <Text style={{ ...styles.colRef, fontWeight: 'bold' }}>Voucher / Invoice</Text>
          <Text style={{ ...styles.colDesc, fontWeight: 'bold' }}>Description</Text>
          <Text style={{ ...styles.colDebit, fontWeight: 'bold' }}>Debit (+)</Text>
          <Text style={{ ...styles.colCredit, fontWeight: 'bold' }}>Credit (-)</Text>
          <Text style={{ ...styles.colBal, fontWeight: 'bold' }}>Balance</Text>
        </View>
        
        {/* OPENING BALANCE ROW */}
        <View style={styles.tableRow}>
            <Text style={styles.colDate}>-</Text>
            <Text style={styles.colRef}>OPENING_BAL</Text>
            <Text style={styles.colDesc}>Opening Balance</Text>
            <Text style={styles.colDebit}>{parseFloat(data.opening_balance || 0) > 0 ? parseFloat(data.opening_balance).toLocaleString('en-IN') : '-'}</Text>
            <Text style={styles.colCredit}>{parseFloat(data.opening_balance || 0) < 0 ? Math.abs(parseFloat(data.opening_balance)).toLocaleString('en-IN') : '-'}</Text>
            <Text style={{ ...styles.colBal, fontWeight: 'bold' }}>{parseFloat(data.opening_balance || 0).toLocaleString('en-IN')}</Text>
        </View>
        
        {(data.returnsOnly ? data.transactions?.filter((t: any) => t.ref && t.ref.startsWith('RET-')) : data.transactions)?.map((t: any, i: number) => (
          <View key={i}>
            <View style={styles.tableRow}>
              <Text style={styles.colDate}>{t.date ? formatToDDMMYY(t.date) : '-'}</Text>
              <Text style={styles.colRef}>{t.ref || 'N/A'}</Text>
              <Text style={styles.colDesc}>{t.description || '-'}</Text>
              <Text style={styles.colDebit}>{parseFloat(t.debit || 0) !== 0 ? parseFloat(t.debit).toLocaleString('en-IN') : '-'}</Text>
              <Text style={styles.colCredit}>{parseFloat(t.credit || 0) !== 0 ? parseFloat(t.credit).toLocaleString('en-IN') : '-'}</Text>
              <Text style={{ ...styles.colBal, fontWeight: 'bold' }}>{parseFloat(t.running_balance || 0).toLocaleString('en-IN')}</Text>
            </View>
            {t.items && t.items.length > 0 && (
              <View style={{ paddingLeft: '15%', paddingRight: '25%', paddingBottom: 4, backgroundColor: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                <View style={{ flexDirection: 'row', borderBottom: '1px solid #e2e8f0', paddingBottom: 2, marginBottom: 2 }}>
                    <Text style={{ fontSize: 6, color: '#64748b', flex: 2 }}>Item Name</Text>
                    <Text style={{ fontSize: 6, color: '#64748b', flex: 1, textAlign: 'right' }}>Qty</Text>
                    <Text style={{ fontSize: 6, color: '#64748b', flex: 1, textAlign: 'right' }}>Rate</Text>
                    <Text style={{ fontSize: 6, color: '#64748b', flex: 1, textAlign: 'right' }}>Amount</Text>
                </View>
                {t.items.map((item: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', paddingVertical: 1 }}>
                    <Text style={{ fontSize: 7, flex: 2 }}>{item.name} {item.shade_label ? `(${item.shade_label})` : (item.shade_id_label ? `(${item.shade_id_label})` : '')}</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>{parseFloat(item.qty)}</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>₹{parseFloat(isActualMode ? (item.actual_price || 0) : item.price).toFixed(2)}</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>₹{parseFloat(isActualMode ? ((item.actual_price || 0) * item.qty) : (item.price_after_gst || item.price * item.qty)).toFixed(2)}</Text>
                  </View>
                ))}

                {isActualMode && parseFloat(t.extra_charges || 0) > 0 && (
                  <View style={{ flexDirection: 'row', paddingVertical: 1 }}>
                    <Text style={{ fontSize: 7, flex: 2, fontWeight: 'bold' }}>{t.extra_charge_name || 'Extra Charges'}</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>-</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>-</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right', fontWeight: 'bold' }}>₹{parseFloat(t.extra_charges).toFixed(2)}</Text>
                  </View>
                )}
                {parseFloat(t.insurance_amount || 0) > 0 && (
                  <View style={{ flexDirection: 'row', paddingVertical: 1 }}>
                    <Text style={{ fontSize: 7, flex: 2, fontWeight: 'bold' }}>{t.insurance_name || 'Insurance'}</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>-</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right' }}>-</Text>
                    <Text style={{ fontSize: 7, flex: 1, textAlign: 'right', fontWeight: 'bold' }}>₹{parseFloat(t.insurance_amount).toFixed(2)}</Text>
                  </View>
                )}

              </View>
            )}
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text>Total Billed (Dr):</Text>
          <Text>₹{data.transactions?.reduce((acc: number, t: any) => acc + parseFloat(t.debit || 0), 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Total Paid (Cr):</Text>
          <Text>₹{data.transactions?.reduce((acc: number, t: any) => acc + parseFloat(t.credit || 0), 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text>Net Closing Balance:</Text>
          <Text>₹{parseFloat(data.closing_balance || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Text style={styles.footer}>Ply Decore Sales - Professional Inventory Ledger System. This is a computer generated document.</Text>
    </Page>
  </Document>
);

export const DownloadStatementBtn = ({ entityId, entityType, startDate, endDate, isActualMode = false, returnsOnly = false, isTable = false }: { entityId: string, entityType: 'CUSTOMER' | 'SUPPLIER' | 'DUAL', startDate?: string, endDate?: string, isActualMode?: boolean, returnsOnly?: boolean, isTable?: boolean }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setData(null);
  }, [startDate, endDate, returnsOnly, isActualMode]);
  
  const fetchAndReady = async () => {
    setLoading(true);
    try {
      const api = (await import('../utils/api')).default;
      let url = `/dashboard/statement?entityId=${entityId}&entityType=${entityType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (isActualMode) url += `&isActual=true`;
      const res = await api.get(url);
      setData({ ...res.data, startDate, endDate, returnsOnly });
    } catch (e) {
      setError(true);
    }
    setLoading(false);
  };

  if (error) return <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Error loading data</span>;

  if (!data) {
    return (
      <button 
        onClick={fetchAndReady} 
        disabled={loading}
        className={isTable ? "" : "primary-btn"}
        style={isTable ? { 
          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 12px', 
          background: 'rgba(59,130,246,0.05)', color: '#3b82f6', border: '1px solid #3b82f6',
          fontSize: '0.75rem', fontWeight: 600, height: '32px', borderRadius: '6px', cursor: 'pointer',
          transition: 'all 0.2s ease'
        } : { 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
          background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid #3b82f6',
          fontSize: '0.85rem', fontWeight: 600, height: 'auto'
        }}
        onMouseEnter={(e) => {
          if (isTable) {
            e.currentTarget.style.background = '#3b82f6';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (isTable) {
            e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
            e.currentTarget.style.color = '#3b82f6';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <FileText size={isTable ? 13 : 16} /> {loading ? 'Fetching...' : 'Prepare Statement'}
      </button>
    );
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <PDFDownloadLink 
        document={<StatementDocument data={data} isActualMode={isActualMode} />} 
        fileName={`Statement_${data?.entity_name || 'Party'}.pdf`}
        style={{ textDecoration: 'none' }}
      >
        {({ loading: pdfLoading }) => (
          <button 
            className={isTable ? "" : "primary-btn"} 
            style={isTable ? { 
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 12px', 
              background: '#10b981', color: '#ffffff', border: 'none', 
              fontSize: '0.75rem', fontWeight: 600, height: '32px', borderRadius: '6px', cursor: 'pointer',
              transition: 'all 0.2s ease'
            } : { 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', 
              background: '#10b981', color: '#ffffff', border: 'none', 
              fontSize: '0.9rem', fontWeight: 700, height: 'auto',
              boxShadow: '0 4px 6px rgba(16,185,129,0.2)'
            }}
            onMouseEnter={(e) => {
              if (isTable) {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (isTable) {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <Download size={isTable ? 13 : 18} /> {pdfLoading ? 'Building...' : 'Download Statement'}
          </button>
        )}
      </PDFDownloadLink>
    </div>
  );
};
