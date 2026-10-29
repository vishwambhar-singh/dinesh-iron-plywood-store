import { useState, useEffect } from 'react';
import { Box, Heading, Text, Tabs, Flex, Badge, Button, Input } from '@chakra-ui/react';
import { Eye, Receipt, Truck, Edit2, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import SaleDetailModal from '../components/SaleDetailModal';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import OrderHistoryModal from '../components/OrderHistoryModal';
import ReturnModal from '../components/ReturnModal';
import DataTable from '../components/DataTable';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { formatToDDMMYY, formatToYYYYMMDD } from '../utils/date';

const PakkaInvoices = () => {
  const { user } = useAuthStore();
  const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  
  if (!isFormalUser) {
    return <Navigate to="/" replace />;
  }

  const [activeTab, setActiveTab] = useState(0);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [returnsOnly, setReturnsOnly] = useState(false);

  const [viewingSale, setViewingSale] = useState<any>(null);
  const [viewingPO, setViewingPO] = useState<any>(null);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [processingReturn, setProcessingReturn] = useState<{ type: 'sale' | 'purchase', data: any } | null>(null);

  useEffect(() => {
    fetchPakkaSales();
    fetchPakkaPurchases();
  }, []);

  const fetchPakkaSales = async () => {
    setSalesLoading(true);
    try {
      const res = await api.get('/billing/sales/pakka');
      setSales(res.data);
    } catch (err) {
      console.error('Failed to fetch formal sales:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchPakkaPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const res = await api.get('/billing/purchases/pakka');
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to fetch formal purchases:', err);
    } finally {
      setPurchasesLoading(false);
    }
  };



  const handleUpdateInvoiceNo = async (id: string, currentNo: string, type: 'SALE' | 'PURCHASE') => {
    const newNo = window.prompt(`Enter new ${type === 'SALE' ? 'Invoice' : 'Bill'} Number:`, currentNo);
    if (!newNo || newNo === currentNo) return;

    try {
      if (type === 'SALE') {
        await api.put(`/billing/sale/${id}/invoice-number`, { invoice_number: newNo });
        fetchPakkaSales();
      } else {
        await api.put(`/billing/purchase/${id}/bill-number`, { bill_number: newNo });
        fetchPakkaPurchases();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  const handleUpdateDate = async (id: string, currentDate: string, type: 'SALE' | 'PURCHASE') => {
    const isoDate = formatToYYYYMMDD(currentDate);
    const newDate = window.prompt(`Enter new ${type === 'SALE' ? 'Sale' : 'Purchase'} Date (YYYY-MM-DD):`, isoDate);
    if (!newDate || newDate === isoDate) return;

    try {
      if (type === 'SALE') {
        await api.put(`/billing/sale/${id}/date`, { sale_date: newDate });
        fetchPakkaSales();
      } else {
        await api.put(`/billing/purchase/${id}/date`, { bill_date: newDate });
        fetchPakkaPurchases();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id: string, type: 'SALE' | 'PURCHASE') => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}? This will also revert the inventory stock.`)) return;

    try {
      if (type === 'SALE') {
        await api.delete(`/billing/sale/${id}`);
        fetchPakkaSales();
      } else {
        await api.delete(`/billing/purchase/${id}`);
        fetchPakkaPurchases();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const salesColumns = [
    { 
      header: 'Invoice No', 
      accessor: 'invoice_number', 
      render: (v: string, row: any) => (
        <Flex align="center" gap={2}>
          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
          <Button size="xs" variant="ghost" p={0} onClick={() => handleUpdateInvoiceNo(row.id, v, 'SALE')}>
            <Edit2 size={12} color="var(--text-muted)" />
          </Button>
        </Flex>
      )
    },
    { header: 'Customer', accessor: 'customer_name_ref' },
    { 
      header: 'Date', 
      accessor: 'sale_date', 
      render: (v: string, row: any) => (
        <Flex align="center" gap={2}>
          <span>{formatToDDMMYY(v)}</span>
          <Button size="xs" variant="ghost" p={0} onClick={() => handleUpdateDate(row.id, v, 'SALE')}>
            <Edit2 size={12} color="var(--text-muted)" />
          </Button>
        </Flex>
      )
    },
    { header: 'Total Value', accessor: 'total_amount', render: (v: number) => <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{Number(v || 0).toFixed(2)}</span> },
    {
      header: 'Manage Registry',
      accessor: 'id',
      render: (_id: string, row: any) => (
        <Flex gap={3}>
          <Button 
            size="md" 
            variant="solid" 
            bg="var(--accent-primary)" 
            color="#fff" 
            onClick={() => setViewingSale(row)}
            px={6}
            fontWeight="bold"
          >
            <Eye size={18} style={{ marginRight: '8px' }} /> View Invoice
          </Button>
          <Button 
            size="md" 
            variant="solid" 
            bg="#ef4444" 
            color="#fff" 
            onClick={() => setProcessingReturn({ type: 'sale', data: row })}
            px={4}
            fontWeight="bold"
          >
            Return
          </Button>
          <Button 
            size="md" 
            variant="ghost" 
            colorPalette="red" 
            onClick={() => handleDelete(row.id, 'SALE')}
            px={4}
          >
            <Trash2 size={18} />
          </Button>
        </Flex>
      )
    }
  ];

  const purchaseColumns = [
    { 
      header: 'Bill No', 
      accessor: 'bill_number', 
      render: (v: string, row: any) => (
        <Flex align="center" gap={2}>
          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
          <Button size="xs" variant="ghost" p={0} onClick={() => handleUpdateInvoiceNo(row.id, v, 'PURCHASE')}>
            <Edit2 size={12} color="var(--text-muted)" />
          </Button>
        </Flex>
      )
    },
    { header: 'Supplier', accessor: 'supplier_name' },
    { 
      header: 'Date', 
      accessor: 'bill_date', 
      render: (v: string, row: any) => (
        <Flex align="center" gap={2}>
          <span>{formatToDDMMYY(v)}</span>
          <Button size="xs" variant="ghost" p={0} onClick={() => handleUpdateDate(row.id, v, 'PURCHASE')}>
            <Edit2 size={12} color="var(--text-muted)" />
          </Button>
        </Flex>
      )
    },
    { header: 'Total Value', accessor: 'total_amount', render: (v: number) => <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{Number(v || 0).toFixed(2)}</span> },
    {
      header: 'Manage Registry',
      accessor: 'id',
      render: (_id: string, row: any) => (
        <Flex gap={3}>
          <Button 
            size="md" 
            variant="solid" 
            bg="var(--accent-primary)" 
            color="#fff" 
            onClick={() => setViewingPO(row)}
            px={6}
            fontWeight="bold"
          >
            <Eye size={18} style={{ marginRight: '8px' }} /> View Bill
          </Button>
          <Button 
            size="md" 
            variant="solid" 
            bg="#ef4444" 
            color="#fff" 
            onClick={() => setProcessingReturn({ type: 'purchase', data: row })}
            px={4}
            fontWeight="bold"
          >
            Return
          </Button>
          <Button 
            size="md" 
            variant="ghost" 
            colorPalette="red" 
            onClick={() => handleDelete(row.id, 'PURCHASE')}
            px={4}
          >
            <Trash2 size={18} />
          </Button>
        </Flex>
      )
    }
  ];

  return (
    <Flex direction="column" gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="var(--text-primary)">Invoice Registry</Heading>
          <Text color="var(--text-muted)">Tracking tax-compliant sales and purchase records</Text>
        </Box>
        <Badge colorPalette="blue" size="lg" variant="subtle" p={2} borderRadius="md">TAX & COMPLIANCE MODE</Badge>
      </Flex>

      <Tabs.Root value={activeTab.toString()} onValueChange={(details) => setActiveTab(parseInt(details.value))}>
        <Tabs.List bg="rgba(0,0,0,0.02)" p={1} borderRadius="lg" flexWrap="wrap" gap={2}>
          <Tabs.Trigger value="0" p={4} fontSize="md" fontWeight="bold">
            <Receipt size={18} style={{ marginRight: '8px' }} />
            Sales History
            {salesLoading && <Loader2 size={15} className="animate-spin" style={{ marginLeft: '8px', color: 'var(--brand-maroon)' }} />}
          </Tabs.Trigger>
          <Tabs.Trigger value="1" p={4} fontSize="md" fontWeight="bold">
            <Truck size={18} style={{ marginRight: '8px' }} />
            Purchase History
            {purchasesLoading && <Loader2 size={15} className="animate-spin" style={{ marginLeft: '8px', color: 'var(--brand-maroon)' }} />}
          </Tabs.Trigger>
          <Flex ml="auto" align="center" gap={2} px={4} flexWrap="wrap">
            <Button
              size="sm"
              variant="outline"
              borderColor="var(--border-color)"
              bg="white"
              color="var(--text-secondary)"
              onClick={() => {
                if (activeTab === 0) fetchPakkaSales();
                else fetchPakkaPurchases();
              }}
              disabled={activeTab === 0 ? salesLoading : purchasesLoading}
              title="Refresh records"
            >
              <RefreshCw size={14} className={(activeTab === 0 ? salesLoading : purchasesLoading) ? "animate-spin" : ""} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              <input type="checkbox" checked={returnsOnly} onChange={e => setReturnsOnly(e.target.checked)} /> Returns Only
            </label>
            <Text fontSize="sm" fontWeight="bold">From:</Text>
            <Input type="date" size="sm" bg="white" value={startDate} onChange={e => setStartDate(e.target.value)} maxW="130px" />
            <Text fontSize="sm" fontWeight="bold">To:</Text>
            <Input type="date" size="sm" bg="white" value={endDate} onChange={e => setEndDate(e.target.value)} maxW="130px" />
          </Flex>
        </Tabs.List>

          <Tabs.Content value="0">
            <Flex direction="column" gap={6} pt={4}>
              <DataTable columns={salesColumns} data={sales.filter(s => {
                  const sDate = s.sale_date ? formatToYYYYMMDD(s.sale_date) : '';
                  const matchDate = (!startDate || sDate >= startDate) && (!endDate || sDate <= endDate);
                  const matchReturn = !returnsOnly || (s.invoice_number && s.invoice_number.startsWith('RET-'));
                  return matchDate && matchReturn;
              })} loading={salesLoading} emptyMessage="No formal sales invoices found." />
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="1">
            <Flex direction="column" gap={6} pt={4}>
              <DataTable columns={purchaseColumns} data={purchases.filter(p => {
                  const pDate = p.bill_date ? formatToYYYYMMDD(p.bill_date) : '';
                  const matchDate = (!startDate || pDate >= startDate) && (!endDate || pDate <= endDate);
                  const matchReturn = !returnsOnly || (p.bill_number && p.bill_number.startsWith('PRET-'));
                  return matchDate && matchReturn;
              })} loading={purchasesLoading} emptyMessage="No formal purchase bills found." />
            </Flex>
          </Tabs.Content>
      </Tabs.Root>

      <SaleDetailModal 
        isOpen={!!viewingSale} 
        onClose={() => setViewingSale(null)} 
        sale={viewingSale} 
        customerName={viewingSale?.customer_name_ref || viewingSale?.customer_name} 
        onRefresh={() => { fetchPakkaSales(); setViewingSale(null); }}
        onProcessReturn={(sale) => {
          setViewingSale(null);
          setProcessingReturn({ type: 'sale', data: sale });
        }}
      />
      <PurchaseDetailModal 
        isOpen={!!viewingPO} 
        onClose={() => setViewingPO(null)} 
        purchase={viewingPO} 
        supplierName={viewingPO?.supplier_name} 
        onRefresh={() => { fetchPakkaPurchases(); setViewingPO(null); }}
        onProcessReturn={(purchase) => {
          setViewingPO(null);
          setProcessingReturn({ type: 'purchase', data: purchase });
        }}
      />
      <OrderHistoryModal isOpen={!!viewingHistory} onClose={() => setViewingHistory(null)} order={viewingHistory} />

      {processingReturn && (
        <ReturnModal
          isOpen={true}
          onClose={() => {
            setProcessingReturn(null);
            fetchPakkaSales();
            fetchPakkaPurchases();
          }}
          sale={processingReturn.data}
          customerName={processingReturn.data.customer_name_ref || processingReturn.data.customer_name || processingReturn.data.supplier_name || ''}
          type={processingReturn.type}
        />
      )}
    </Flex>
  );
};

export default PakkaInvoices;
