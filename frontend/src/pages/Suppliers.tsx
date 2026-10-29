import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { PurchaseOrderPDF } from '../components/PurchaseOrderPDF';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import SaleDetailModal from '../components/SaleDetailModal';
import ReturnModal from '../components/ReturnModal';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../utils/api';
import { Download, Trash2, Edit, FileText } from 'lucide-react';
import { DownloadStatementBtn } from '../components/StatementPDF';
import { useAuthStore } from '../store/useAuthStore';
import { Badge } from '@chakra-ui/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { formatToDDMMYY } from '../utils/date';
import BillChangeDiffModal from '../components/BillChangeDiffModal';


const Suppliers = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
    const actualPaths = ['/actual', '/actual-billing', '/actual-cashbook', '/mappings'];
    const isActualMode = actualPaths.some(p => location.pathname.startsWith(p)) || user?.role === 'GODOWN';

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [customersList, setCustomersList] = useState<any[]>([]);
    
    // Form State
    const defaultForm = { 
        name: '', email: '', mobile: '', gst_number: '', pan: '', address: '', state: '', country: 'India', 
        registration_type: 'Regular', opening_balance_pakka: '0', opening_balance_actual: '0', closing_balance: '0', is_active: true,
        is_also_customer: false, link_customer_id: '', customer_opening_balance_pakka: '0', customer_opening_balance_actual: '0'
    };
    const [formData, setFormData] = useState({...defaultForm});
    const [dualMode, setDualMode] = useState<'NEW' | 'EXISTING'>('NEW');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // History Modal State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historySupplier, setHistorySupplier] = useState<any>(null);
    const [historyViewMode, setHistoryViewMode] = useState<'SUPPLIER' | 'COMBINED'>('SUPPLIER');
    const [historyPOs, setHistoryPOs] = useState<any[]>([]);
    const [historySales, setHistorySales] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyTab, setHistoryTab] = useState<'PAKKA' | 'ACTUAL' | 'LEDGER'>('PAKKA');
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [viewingPO, setViewingPO] = useState<any>(null);
    const [viewingSale, setViewingSale] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaleEditMode, setIsSaleEditMode] = useState(false);
    const [processingReturn, setProcessingReturn] = useState<any>(null);
    const [returnType, setReturnType] = useState<'purchase' | 'sale'>('purchase');
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [returnsOnly, setReturnsOnly] = useState(false);

    // State for pending changes diff modal in supplier page
    const [pendingChanges, setPendingChanges] = useState<any[]>([]);
    const [viewingDiff, setViewingDiff] = useState<any | null>(null);
    const [acceptRejectLoading, setAcceptRejectLoading] = useState(false);

    const fetchPendingChanges = async () => {
        if (!isActualMode) return;
        try {
            const res = await api.get('/billing/changes/pending');
            setPendingChanges(res.data);
        } catch (err) {
            console.error('Failed to fetch pending changes:', err);
        }
    };

    const handleAcceptChange = async (changeId: string) => {
        setAcceptRejectLoading(true);
        try {
            await api.post(`/billing/changes/${changeId}/accept`);
            await Promise.all([refreshSupplierHistory(), fetchPendingChanges()]);
            setViewingDiff(null);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refreshSupplierHistory(), fetchPendingChanges()]);
            } else {
                alert(err.response?.data?.error || 'Failed to accept change request');
            }
        } finally {
            setAcceptRejectLoading(false);
        }
    };

    const handleRejectChange = async (changeId: string) => {
        setAcceptRejectLoading(true);
        try {
            await api.post(`/billing/changes/${changeId}/reject`);
            await Promise.all([refreshSupplierHistory(), fetchPendingChanges()]);
            setViewingDiff(null);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refreshSupplierHistory(), fetchPendingChanges()]);
            } else {
                alert(err.response?.data?.error || 'Failed to reject change request');
            }
        } finally {
            setAcceptRejectLoading(false);
        }
    };

    useKeyboardShortcuts({
        'Alt+C': () => { setIsAddOpen(true); setEditingId(null); setFormData({...defaultForm}); setDualMode('NEW'); }
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/suppliers?statusFilter=${statusFilter}`);
            const sorted = res.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setSuppliers(sorted);
        } catch (err) { }
        setLoading(false);
    };

    useEffect(() => {
        fetchSuppliers();
    }, [statusFilter]);

    useEffect(() => {
        api.get('/customers').then(res => setCustomersList(res.data || [])).catch(() => {});
    }, []);

    const exportSuppliers = () => {
        const rows = [['Vendor Name', 'Email', 'Mobile', 'GST Number', 'Joined Date']];
        suppliers.forEach((c: any) => {
            rows.push([c.name, c.email, c.mobile, c.gst_number, formatToDDMMYY(c.created_at)]);
        });
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "suppliers_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setIsAddOpen(false);
            setFormData({...defaultForm});
            setEditingId(null);
            fetchSuppliers(); 
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to process supplier');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (row: any) => {
        setFormData({ 
            name: row.name, 
            email: row.email || '', 
            mobile: row.mobile || '', 
            gst_number: row.gst_number || row.gstNumber || '',
            pan: row.pan || '',
            address: row.address || '',
            state: row.state || '',
            country: row.country || 'India',
            registration_type: row.registration_type || 'Regular',
            opening_balance_pakka: row.opening_balance_pakka?.toString() || '0',
            opening_balance_actual: row.opening_balance_actual?.toString() || '0',
            closing_balance: row.closing_balance?.toString() || '0',
            is_active: row.is_active !== 0,
            is_also_customer: !!row.linked_customer_id,
            link_customer_id: row.linked_customer_id || '',
            customer_opening_balance_pakka: '0',
            customer_opening_balance_actual: '0'
        });
        setDualMode(row.linked_customer_id ? 'EXISTING' : 'NEW');
        setEditingId(row.id);
        setIsAddOpen(true);
    };

    const switchHistoryView = async (targetView: 'SUPPLIER' | 'COMBINED', supOverride?: any) => {
        const sup = supOverride || historySupplier;
        if (!sup) return;
        setHistoryViewMode(targetView);
        setHistoryLoading(true);
        try {
            if (targetView === 'COMBINED') {
                let dualUrl = `/billing/ledger/dual/${sup.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) dualUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) dualUrl += `&endDate=${historyEndDate}`;

                const promises: Promise<any>[] = [
                    api.get(dualUrl),
                    api.get(`/billing/purchases/supplier/${sup.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`)
                ];
                if (sup.linked_customer_id) {
                    promises.push(api.get(`/billing/sales/customer/${sup.linked_customer_id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`));
                }

                const [ledgerRes, poRes, salesRes] = await Promise.all(promises);
                setLedgerData(ledgerRes.data || []);
                setHistoryPOs(poRes.data || []);
                setHistorySales(salesRes ? salesRes.data || [] : []);
            } else {
                let ledgerUrl = `/billing/ledger/supplier/${sup.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) ledgerUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) ledgerUrl += `&endDate=${historyEndDate}`;

                const [poRes, ledgerRes] = await Promise.all([
                    api.get(`/billing/purchases/supplier/${sup.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                    api.get(ledgerUrl)
                ]);
                setLedgerData(ledgerRes.data || []);
                setHistoryPOs(poRes.data || []);
                setHistorySales([]);
            }
        } catch (e) {
            console.error('Failed to switch history view:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchLedgerWithDates = async (start: string, end: string) => {
        if (!historySupplier) return;
        setHistoryLoading(true);
        try {
            if (historyViewMode === 'COMBINED') {
                let url = `/billing/ledger/dual/${historySupplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (start) url += `&startDate=${start}`;
                if (end) url += `&endDate=${end}`;
                const ledgerRes = await api.get(url);
                setLedgerData(ledgerRes.data || []);
            } else {
                let url = `/billing/ledger/supplier/${historySupplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (start) url += `&startDate=${start}`;
                if (end) url += `&endDate=${end}`;
                const ledgerRes = await api.get(url);
                setLedgerData(ledgerRes.data || []);
            }
        } catch { setLedgerData([]); }
        setHistoryLoading(false);
    };

    const refreshSupplierHistory = async () => {
        if (!historySupplier) return;
        setHistoryLoading(true);
        try {
            if (historyViewMode === 'COMBINED') {
                await switchHistoryView('COMBINED');
            } else {
                let ledgerUrl = `/billing/ledger/supplier/${historySupplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) ledgerUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) ledgerUrl += `&endDate=${historyEndDate}`;

                const [poRes, ledgerRes] = await Promise.all([
                    api.get(`/billing/purchases/supplier/${historySupplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                    api.get(ledgerUrl),
                    fetchPendingChanges()
                ]);
                setHistoryPOs(poRes.data || []);
                setLedgerData(ledgerRes.data || []);
            }
        } catch {
            setHistoryPOs([]);
            setLedgerData([]);
        }
        setHistoryLoading(false);
    };

    const refreshSupplierData = async () => {
        fetchSuppliers();
        await refreshSupplierHistory();
    };


    const getMonthRangeForLatestTx = (transactions: any[]) => {
        let latestDate: Date | null = null;
        if (Array.isArray(transactions)) {
            transactions.forEach(t => {
                const rawDate = t.date || t.created_at || t.voucher_date;
                if (rawDate) {
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                        if (!latestDate || d > latestDate) {
                            latestDate = d;
                        }
                    }
                }
            });
        }
        const targetDate = latestDate || new Date();
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, targetDate.getMonth() + 1, 0).getDate();
        return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
    };

    const handleOpenHistory = async (supplier: any) => {
        setHistorySupplier(supplier);
        setHistoryViewMode('SUPPLIER');
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryTab('PAKKA');
        setReturnsOnly(false);
        try {
            const [poRes, fullLedgerRes] = await Promise.all([
                api.get(`/billing/purchases/supplier/${supplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                api.get(`/billing/ledger/supplier/${supplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                fetchPendingChanges()
            ]);

            const allLedger = fullLedgerRes.data || [];
            const monthRange = getMonthRangeForLatestTx(allLedger);
            setHistoryStartDate(monthRange.start);
            setHistoryEndDate(monthRange.end);

            let filteredLedger = allLedger;
            if (monthRange.start && monthRange.end) {
                const monthLedgerRes = await api.get(`/billing/ledger/supplier/${supplier.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}&startDate=${monthRange.start}&endDate=${monthRange.end}`);
                filteredLedger = monthLedgerRes.data || [];
            }

            setHistoryPOs(poRes.data || []);
            setHistorySales([]);
            setLedgerData(filteredLedger);
        } catch { setHistoryPOs([]); setHistorySales([]); setLedgerData([]); }
        setHistoryLoading(false);
    };

    const handleFulfillPO = async (billId: string) => {
        if (!window.confirm('Fulfill this PO? Stock will be updated and ledger committed.')) return;
        try {
            await api.put(`/billing/purchase/${billId}/fulfill`);
            await refreshSupplierData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Fulfillment failed');
        }
    };

    const handleDownloadPO = async (po: any) => {
        const blob = await pdf(<PurchaseOrderPDF po={po} supplierName={po.supplier_name || historySupplier?.name || 'Supplier'} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PO_${po.bill_number}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const columns = [
        { header: 'Vendor Entity', accessor: 'name', render: (v: string, row: any) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{v}</span>
                {row.is_active === 0 && <Badge colorScheme="red" variant="subtle" fontSize="0.7rem">INACTIVE</Badge>}
                {row.linked_customer_id && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(124, 58, 237, 0.1)',
                        color: '#7c3aed',
                        border: '1px solid rgba(124, 58, 237, 0.25)'
                    }}>
                        Both (Customer: {row.linked_customer_name || 'Customer'})
                    </span>
                )}
            </div>
        ) },
        { header: 'State', accessor: 'state' },
        { header: 'Type', accessor: 'registration_type' },
        { header: 'GSTIN', accessor: 'gstNumber' },
        { header: 'PAN', accessor: 'pan' },
        { header: 'Onboarded', accessor: 'created_at', render: (val: string) => formatToDDMMYY(val) },
        { header: 'Manage Account', accessor: 'id', render: (val: string, row: any) => (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        background: 'white', 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={() => handleEditClick(row)}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; 
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.2)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'white'; 
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Edit size={13} /> Edit
                </button>
                <button 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        background: 'white', 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={() => handleOpenHistory(row)}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; 
                        e.currentTarget.style.color = '#3b82f6';
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'white'; 
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <FileText size={13} /> Purchase History
                </button>
                <DownloadStatementBtn entityId={val} entityType="SUPPLIER" isActualMode={isActualMode} isTable={true} />
                <button 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(239,68,68,0.3)', 
                        background: 'rgba(239,68,68,0.02)', 
                        color: '#ef4444', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={async () => {
                        if (window.confirm('Delete this vendor? This will hide them from future transactions.')) {
                            await api.delete(`/suppliers/${val}`);
                            fetchSuppliers();
                        }
                    }}
                    onMouseEnter={(e) => { 
                        e.currentTarget.style.background = '#ef4444'; 
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'rgba(239,68,68,0.02)'; 
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Trash2 size={13} /> Delete
                </button>
            </div>
        )}
    ];



    const historyColumns = [
        { header: 'Date', accessor: 'bill_date', render: (v: string) => formatToDDMMYY(v) },
        { header: 'PO / Bill Number', accessor: 'bill_number', render: (v: string, row: any) => 
            <div>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
                {row.voucher_no && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ref: {row.voucher_no}</div>}
             </div>
        },
        { header: 'Status', accessor: 'status', render: (v: string) => (
            <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: v === 'FULFILLED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: v === 'FULFILLED' ? '#10b981' : '#f59e0b' }}>{v}</span>
        )},
        { header: historyTab === 'ACTUAL' ? 'Internal Cost' : 'Formal Cost', accessor: 'id', render: (_val: string, row: any) => {
             const pTotal = parseFloat(row.total_amount) || 0;
             const aTotal = row.actual_total || 0;
             if(historyTab === 'ACTUAL') {
                 return <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹{aTotal.toFixed(2)}</span>;
             }
             return <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{pTotal.toFixed(2)}</span>;
        }},
        { header: 'Actions', accessor: 'id', render: (_val: string, row: any) => (
            <div style={{ display: 'flex', gap: '6px' }}>
                <button className="primary-btn" style={{ padding: '6px 14px', fontSize: '0.75rem' }} onClick={() => setViewingPO(row)}>View Bill</button>
                {row.status === 'PENDING' && (
                    <button className="primary-btn" style={{ padding: '6px 14px', fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981' }} onClick={() => handleFulfillPO(row.id)}>Fulfill</button>
                )}
                {row.status === 'FULFILLED' && (
                    <button className="primary-btn" style={{ padding: '6px 14px', fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#2563eb', border: '1px solid #3b82f6' }} onClick={() => handleDownloadPO(row)}>PDF</button>
                )}
            </div>
        )}
    ];

    const ledgerColumns = [
        { header: 'Date', accessor: 'date', render: (v: string) => formatToDDMMYY(v) },
        { header: 'Description', accessor: 'description', render: (v: string, row: any) => {
            const isPurchase = row.source_type !== 'CUSTOMER';
            const poObj = isPurchase && row.ref ? historyPOs.find((p: any) => p.bill_number === row.ref) : null;
            const pending = (isActualMode && poObj) ? pendingChanges.find((c: any) => c.formal_id === poObj.id && c.bill_type === 'PURCHASE') : null;

            return (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                        {row.source_type === 'CUSTOMER' && (
                            <span style={{
                                padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)'
                            }}>SALE</span>
                        )}
                        {row.source_type === 'SUPPLIER' && historyViewMode === 'COMBINED' && (
                            <span style={{
                                padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)'
                            }}>PURCHASE</span>
                        )}
                        {pending && (
                            <span style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800,
                                background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)'
                            }}>PENDING APPROVAL</span>
                        )}
                    </div>
                    {row.ref && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {row.ref}</div>}
                    {row.items && row.items.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Rate</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {row.items.map((i: any, idx: number) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '4px 0' }}>{i.name} {i.shade_label ? `(${i.shade_label})` : (i.shade_id_label ? `(${i.shade_id_label})` : '')}</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>{parseFloat(i.qty)}</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>₹{parseFloat(isActualMode ? (i.actual_price || i.price || 0) : (i.price || 0)).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>₹{parseFloat(isActualMode ? ((i.actual_price || i.price || 0) * i.qty) : (i.price_after_gst || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {isActualMode && parseFloat(row.extra_charges || 0) > 0 && (
                                    <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 600 }}>{row.extra_charge_name || 'Extra Charges'}</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>-</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>-</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>₹{parseFloat(row.extra_charges).toFixed(2)}</td>
                                    </tr>
                                )}
                                {parseFloat(row.insurance_amount || 0) > 0 && (
                                    <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 600 }}>{row.insurance_name || 'Insurance'}</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>-</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0' }}>-</td>
                                        <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>₹{parseFloat(row.insurance_amount).toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            );
        }},
        { 
            header: isActualMode ? 'Debit (Actual)' : 'Debit (+)', 
            accessor: isActualMode ? 'actual_dr' : 'pakka_dr', 
            render: (v: number) => v > 0 ? <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{v.toLocaleString('en-IN')}</span> : '-' 
        },
        { 
            header: isActualMode ? 'Credit (Actual)' : 'Credit (-)', 
            accessor: isActualMode ? 'actual_cr' : 'pakka_cr', 
            render: (v: number) => v > 0 ? <span style={{ color: '#10b981', fontWeight: 700 }}>₹{v.toLocaleString('en-IN')}</span> : '-' 
        },
        { 
            header: 'Running Balance', 
            accessor: isActualMode ? 'actual_bal' : 'pakka_bal', 
            render: (v: number) => (
                <span style={{ fontWeight: 800, color: isActualMode ? '#f59e0b' : 'var(--accent-primary)' }}>₹{(v || 0).toLocaleString('en-IN')}</span>
            )
        },
        { header: 'Actions', accessor: 'ref', render: (v: string, row: any) => {
             if (!v) return null;
             const isCustomerTx = row.source_type === 'CUSTOMER';
             const saleObj = isCustomerTx ? historySales.find((s: any) => s.invoice_number === v) : null;
             const poObj = !isCustomerTx ? historyPOs.find((p: any) => p.bill_number === v) : null;

             if (isCustomerTx) {
                 if (!saleObj) return null;
                 const isReturn = v.startsWith('RET-');
                 return (
                     <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                         <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem' }} onClick={() => {
                             setViewingSale(saleObj);
                             setIsSaleEditMode(false);
                         }}>View Bill</button>
                         <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--accent-secondary)' }} onClick={() => {
                             setViewingSale(saleObj);
                             setIsSaleEditMode(true);
                         }}>Edit Bill</button>
                         {!isReturn && (
                             <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#ef4444' }} onClick={() => {
                                 setProcessingReturn(saleObj);
                                 setReturnType('sale');
                             }}>Return</button>
                         )}
                     </div>
                 );
             }

             if (!poObj) return null;
             const pending = (isActualMode && poObj) ? pendingChanges.find((c: any) => c.formal_id === poObj.id && c.bill_type === 'PURCHASE') : null;
             const isReturn = v.startsWith('PRET-');

             return (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {pending ? (
                        <>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem' }} onClick={() => {
                                setViewingPO(poObj);
                                setIsEditMode(false);
                            }}>View Bill</button>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#fbbf24', color: '#000', border: 'none' }} onClick={() => {
                                setViewingDiff(pending);
                            }}>View Changes</button>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--brand-green)', color: '#fff', border: 'none' }} onClick={() => {
                                handleAcceptChange(pending.id);
                            }} disabled={acceptRejectLoading}>{acceptRejectLoading ? '...' : 'Accept'}</button>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => {
                                handleRejectChange(pending.id);
                            }} disabled={acceptRejectLoading}>{acceptRejectLoading ? '...' : 'Reject'}</button>
                        </>
                    ) : (
                        <>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem' }} onClick={() => {
                                setViewingPO(poObj);
                                setIsEditMode(false);
                            }}>View Bill</button>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--accent-secondary)' }} onClick={() => {
                                setViewingPO(poObj);
                                setIsEditMode(true);
                            }}>Edit Bill</button>
                        </>
                    )}
                    {!isReturn && !pending && (
                        <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#ef4444' }} onClick={() => {
                            setProcessingReturn(poObj);
                            setReturnType('purchase');
                        }}>Return</button>
                    )}
                </div>
             );
        }}
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem' }}>Vendor & Supplier Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage raw material vendors and view detailed procurement history.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="primary-btn" onClick={exportSuppliers} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        <Download size={16} /> Export List
                    </button>
                    <button className="primary-btn" onClick={() => { setIsAddOpen(true); setEditingId(null); setFormData({...defaultForm}); setDualMode('NEW'); }}>+ New Vendor</button>
                </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {statusFilter === 'ACTIVE' && "Active Suppliers"}
                    {statusFilter === 'INACTIVE' && "Inactive Suppliers"}
                    {statusFilter === 'ALL' && "All Suppliers (Including Inactive)"}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
                        <option value="ALL">All Vendors</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <DataTable columns={columns} data={suppliers} loading={loading} emptyMessage="No vendors found." />
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingId ? "Update Vendor Profile" : "Register New Supplier"}>
                {error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Company / Vendor Name</label>
                        <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="XYZ Plywoods Ltd" />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Email Address</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Contact Mobile</label>
                            <input type="text" className="form-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>GSTIN</label>
                            <input type="text" className="form-input" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Registration Category</label>
                            <select className="form-input" value={formData.registration_type} onChange={e => setFormData({...formData, registration_type: e.target.value})}>
                                <option value="Regular">Regular</option>
                                <option value="Unregistered/Consumer">Unregistered/Consumer</option>
                                <option value="Composition">Composition</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>PAN Number</label>
                        <input type="text" className="form-input" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Physical Address</label>
                        <textarea className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} style={{ resize: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>State</label>
                            <input type="text" className="form-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Country</label>
                            <input type="text" className="form-input" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', background: 'rgba(59,130,246,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                        {!isActualMode ? (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>OPENING BALANCE (PAKKA)</label>
                                <input type="number" className="form-input" value={formData.opening_balance_pakka} onChange={e => setFormData({...formData, opening_balance_pakka: e.target.value})} />
                            </div>
                        ) : (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>OPENING BALANCE (GODOWN)</label>
                                <input type="number" className="form-input" value={formData.opening_balance_actual} onChange={e => setFormData({...formData, opening_balance_actual: e.target.value})} />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>CLOSING BALANCE</label>
                            <input type="number" className="form-input" value={formData.closing_balance} onChange={e => setFormData({...formData, closing_balance: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#7c3aed' }}>
                            <input 
                                type="checkbox" 
                                checked={formData.is_also_customer} 
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        is_also_customer: checked,
                                        link_customer_id: checked && dualMode === 'EXISTING' ? prev.link_customer_id : ''
                                    }));
                                }} 
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                            />
                            This party is BOTH a Supplier and a Customer (Dual Entity)
                        </label>
                        {formData.is_also_customer && (
                            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Choice: New Party vs Link Existing */}
                                <div style={{ display: 'flex', gap: '12px', background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDualMode('NEW');
                                            setFormData(prev => ({ ...prev, link_customer_id: '' }));
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: dualMode === 'NEW' ? '#7c3aed' : 'transparent',
                                            color: dualMode === 'NEW' ? '#ffffff' : 'var(--text-secondary)',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        New Party (Register Both)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDualMode('EXISTING')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: dualMode === 'EXISTING' ? '#7c3aed' : 'transparent',
                                            color: dualMode === 'EXISTING' ? '#ffffff' : 'var(--text-secondary)',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Link Existing Customer
                                    </button>
                                </div>

                                {dualMode === 'NEW' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#6d28d9', background: 'rgba(124, 58, 237, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.15)', lineHeight: 1.4 }}>
                                            ✓ <strong>New Dual Party:</strong> A matching Customer account for <strong>{formData.name || 'this party'}</strong> will automatically be created and linked with identical GSTIN, Mobile, and Address.
                                        </div>
                                        {!editingId && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                        Customer Opening (Formal)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="form-input" 
                                                        value={formData.customer_opening_balance_pakka} 
                                                        onChange={e => setFormData({ ...formData, customer_opening_balance_pakka: e.target.value })} 
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                        Customer Opening (Actual)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="form-input" 
                                                        value={formData.customer_opening_balance_actual} 
                                                        onChange={e => setFormData({ ...formData, customer_opening_balance_actual: e.target.value })} 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                            Select Existing Customer from Registry *
                                        </label>
                                        <select 
                                            className="form-input" 
                                            value={formData.link_customer_id} 
                                            onChange={e => setFormData({ ...formData, link_customer_id: e.target.value })}
                                            required={dualMode === 'EXISTING'}
                                        >
                                            <option value="">-- Choose Existing Customer to Link --</option>
                                            {customersList.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} {c.gstNumber || c.gst_number ? `(GST: ${c.gstNumber || c.gst_number})` : (c.mobile ? `(Ph: ${c.mobile})` : '')}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {editingId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="is_active" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#d97706', cursor: 'pointer' }}>VENDOR PROFILE ACTIVE (Uncheck to mark Inactive)</label>
                        </div>
                    )}

                    <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '16px' }}>
                        {submitting ? 'Processing...' : (editingId ? 'Update Record' : 'Register Vendor')}
                    </button>
                </form>
            </Modal>

            <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={`Ply Decore Purchases - Ledger: ${historySupplier?.name || ''}`} maxWidth="1400px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {historySupplier?.linked_customer_id ? (
                            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid var(--border-color)' }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: '4px 14px', borderRadius: '6px', border: 'none',
                                        background: historyViewMode === 'SUPPLIER' ? 'var(--accent-primary)' : 'transparent',
                                        color: historyViewMode === 'SUPPLIER' ? '#fff' : 'var(--text-secondary)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => switchHistoryView('SUPPLIER')}
                                >
                                    Supplier History
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '4px 14px', borderRadius: '6px', border: 'none',
                                        background: historyViewMode === 'COMBINED' ? '#7c3aed' : 'transparent',
                                        color: historyViewMode === 'COMBINED' ? '#fff' : 'var(--text-secondary)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => switchHistoryView('COMBINED')}
                                >
                                    Combined History (Dual)
                                </button>
                            </div>
                        ) : (
                            <Badge colorPalette="blue" size="lg" p={3}>Detailed Account Statement</Badge>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={returnsOnly} onChange={e => setReturnsOnly(e.target.checked)} /> Returns Only
                        </label>
                        <input 
                            type="date" 
                            style={{ width: '150px', height: '38px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                            value={historyStartDate} 
                            onChange={(e) => {
                                setHistoryStartDate(e.target.value);
                                fetchLedgerWithDates(e.target.value, historyEndDate);
                            }} 
                        />
                        <span style={{ color: 'var(--text-muted)' }}>to</span>
                        <input 
                            type="date" 
                            style={{ width: '150px', height: '38px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
                            value={historyEndDate} 
                            onChange={(e) => {
                                setHistoryEndDate(e.target.value);
                                fetchLedgerWithDates(historyStartDate, e.target.value);
                            }} 
                        />
                    </div>
                    <DownloadStatementBtn 
                        entityId={historySupplier?.id} 
                        entityType={historyViewMode === 'COMBINED' ? 'DUAL' : 'SUPPLIER'} 
                        startDate={historyStartDate} 
                        endDate={historyEndDate} 
                        isActualMode={isActualMode} 
                        returnsOnly={returnsOnly} 
                    />
                </div>

                <DataTable 
                    columns={ledgerColumns} 
                    data={ledgerData.filter(d => !returnsOnly || (d.ref && (d.ref.startsWith('RET-') || d.ref.startsWith('PRET-'))))} 
                    loading={historyLoading}
                    emptyMessage="No transactions found for this party." 
                />
            </Modal>

            <PurchaseDetailModal 
                isOpen={!!viewingPO} 
                onClose={() => { setViewingPO(null); setIsEditMode(false); }} 
                purchase={viewingPO} 
                supplierName={viewingPO?.supplier_name || historySupplier?.name || ''} 
                isActual={isActualMode}
                initialEditMode={isEditMode}
                onRefresh={refreshSupplierData}
            />

            <SaleDetailModal 
                isOpen={!!viewingSale} 
                onClose={() => { setViewingSale(null); setIsSaleEditMode(false); }} 
                sale={viewingSale} 
                customerName={historySupplier?.linked_customer_name || 'Linked Customer'} 
                isActual={isActualMode}
                initialEditMode={isSaleEditMode}
                onRefresh={refreshSupplierData}
            />

            <ReturnModal
                isOpen={!!processingReturn}
                onClose={() => { setProcessingReturn(null); setReturnType('purchase'); }}
                sale={processingReturn}
                customerName={historySupplier?.name || ''}
                type={returnType}
            />

            {viewingDiff && (
                <BillChangeDiffModal
                    isOpen={!!viewingDiff}
                    onClose={() => setViewingDiff(null)}
                    changeRequest={viewingDiff}
                    onAccept={() => handleAcceptChange(viewingDiff.id)}
                    onReject={() => handleRejectChange(viewingDiff.id)}
                />
            )}
        </div>
    );
};

export default Suppliers;
