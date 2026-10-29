import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SaleDetailModal from '../components/SaleDetailModal';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import ReturnModal from '../components/ReturnModal';
import api from '../utils/api';
import { Download, FileText, UserPlus, Filter, Trash2, Edit, Loader2 } from 'lucide-react';
import { DownloadStatementBtn } from '../components/StatementPDF';
import { useAuthStore } from '../store/useAuthStore';
import { Badge } from '@chakra-ui/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { formatToDDMMYY } from '../utils/date';
import BillChangeDiffModal from '../components/BillChangeDiffModal';

const Customers = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
    const actualPaths = ['/actual', '/actual-billing', '/actual-cashbook', '/mappings'];
    const isActualMode = actualPaths.some(p => location.pathname.startsWith(p)) || user?.role === 'GODOWN';

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [suppliersList, setSuppliersList] = useState<any[]>([]);
    
    // Form State
    const defaultForm = { 
        name: '', email: '', mobile: '', gst_number: '', address: '', state: '', country: 'India', 
        registration_type: 'Regular', pan: '', opening_balance_pakka: '0', opening_balance_actual: '0', 
        closing_balance: '0', is_active: true,
        is_also_supplier: false, link_supplier_id: '', 
        supplier_opening_balance_pakka: '0', supplier_opening_balance_actual: '0'
    };
    const [formData, setFormData] = useState({...defaultForm});
    const [dualMode, setDualMode] = useState<'NEW' | 'EXISTING'>('NEW');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Sale & Dual History
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyCustomer, setHistoryCustomer] = useState<any>(null);
    const [historyViewMode, setHistoryViewMode] = useState<'CUSTOMER' | 'COMBINED'>('CUSTOMER');
    const [historySales, setHistorySales] = useState<any[]>([]);
    const [historyBills, setHistoryBills] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loadingCustomerId, setLoadingCustomerId] = useState<string | null>(null);
    const [historyTab, setHistoryTab] = useState<'PAKKA' | 'ACTUAL' | 'LEDGER'>('PAKKA');
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [viewingSale, setViewingSale] = useState<any>(null);
    const [viewingPurchase, setViewingPurchase] = useState<any>(null);
    const [processingReturn, setProcessingReturn] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isPurchaseEditMode, setIsPurchaseEditMode] = useState(false);
    const [returnType, setReturnType] = useState<'sale' | 'purchase'>('sale');
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [returnsOnly, setReturnsOnly] = useState(false);

    // State for pending changes diff modal in customer page
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
            await Promise.all([refreshCustomerHistory(), fetchPendingChanges()]);
            setViewingDiff(null);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refreshCustomerHistory(), fetchPendingChanges()]);
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
            await Promise.all([refreshCustomerHistory(), fetchPendingChanges()]);
            setViewingDiff(null);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refreshCustomerHistory(), fetchPendingChanges()]);
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

    const exportCustomers = async () => {
        try {
            const res = await api.get('/customers');
            const allCustomers = res.data;
            const rows = [['Customer Name', 'Email', 'Mobile', 'GST Number', 'Joined Date']];
            allCustomers.forEach((c: any) => {
                rows.push([c.name, c.email, c.mobile, c.gst_number, formatToDDMMYY(c.created_at)]);
            });
            const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "PlyDecore_Customers.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export failed', err);
        }
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

    useEffect(() => {
        api.get('/suppliers').then(res => setSuppliersList(res.data || [])).catch(() => {});
    }, [refreshTrigger]);

    const switchHistoryView = async (targetView: 'CUSTOMER' | 'COMBINED', custOverride?: any) => {
        const cust = custOverride || historyCustomer;
        if (!cust) return;
        setHistoryViewMode(targetView);
        setHistoryLoading(true);
        try {
            if (targetView === 'COMBINED') {
                let dualUrl = `/billing/ledger/dual/${cust.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) dualUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) dualUrl += `&endDate=${historyEndDate}`;

                const promises: Promise<any>[] = [
                    api.get(dualUrl),
                    api.get(`/billing/sales/customer/${cust.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`)
                ];
                if (cust.linked_supplier_id) {
                    promises.push(api.get(`/billing/purchases/supplier/${cust.linked_supplier_id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`));
                }

                const [ledgerRes, salesRes, billsRes] = await Promise.all(promises);
                setLedgerData(ledgerRes.data || []);
                setHistorySales(salesRes.data || []);
                setHistoryBills(billsRes ? billsRes.data || [] : []);
            } else {
                let ledgerUrl = `/billing/ledger/customer/${cust.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) ledgerUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) ledgerUrl += `&endDate=${historyEndDate}`;

                const [salesRes, ledgerRes] = await Promise.all([
                    api.get(`/billing/sales/customer/${cust.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                    api.get(ledgerUrl)
                ]);
                setLedgerData(ledgerRes.data || []);
                setHistorySales(salesRes.data || []);
                setHistoryBills([]);
            }
        } catch (e) {
            console.error('Failed to switch history view:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchLedgerWithDates = async (start: string, end: string) => {
        if (!historyCustomer) return;
        setHistoryLoading(true);
        try {
            if (historyViewMode === 'COMBINED') {
                let url = `/billing/ledger/dual/${historyCustomer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (start) url += `&startDate=${start}`;
                if (end) url += `&endDate=${end}`;
                const ledgerRes = await api.get(url);
                setLedgerData(ledgerRes.data || []);
            } else {
                let url = `/billing/ledger/customer/${historyCustomer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (start) url += `&startDate=${start}`;
                if (end) url += `&endDate=${end}`;
                const ledgerRes = await api.get(url);
                setLedgerData(ledgerRes.data || []);
            }
        } catch { setLedgerData([]); }
        setHistoryLoading(false);
    };

    const refreshCustomerHistory = async () => {
        if (!historyCustomer) return;
        setHistoryLoading(true);
        try {
            if (historyViewMode === 'COMBINED') {
                await switchHistoryView('COMBINED');
            } else {
                let ledgerUrl = `/billing/ledger/customer/${historyCustomer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`;
                if (historyStartDate) ledgerUrl += `&startDate=${historyStartDate}`;
                if (historyEndDate) ledgerUrl += `&endDate=${historyEndDate}`;

                const [salesRes, ledgerRes] = await Promise.all([
                    api.get(`/billing/sales/customer/${historyCustomer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                    api.get(ledgerUrl),
                    fetchPendingChanges()
                ]);
                setHistorySales(salesRes.data);
                setLedgerData(ledgerRes.data);
            }
        } catch {
            setHistorySales([]);
            setLedgerData([]);
        }
        setHistoryLoading(false);
    };

    const refreshCustomerData = async () => {
        setRefreshTrigger(prev => prev + 1);
        await refreshCustomerHistory();
    };

    const handleDeleteCustomer = async (id: string, name: string) => {
        if (!window.confirm(`Delete customer "${name}"?\n\nThis will permanently remove the customer and all associated ledger records. This action cannot be undone.`)) return;
        try {
            await api.delete(`/customers/${id}`);
            setRefreshTrigger(prev => prev + 1);
            if (historyCustomer?.id === id) setHistoryOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete customer. They may have linked transactions.');
        }
    };

    const handleOpenHistory = async (customer: any) => {
        setLoadingCustomerId(customer.id);
        setHistoryCustomer(customer);
        setHistoryViewMode('CUSTOMER');
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryTab('PAKKA');
        try {
            const [salesRes, fullLedgerRes] = await Promise.all([
                api.get(`/billing/sales/customer/${customer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                api.get(`/billing/ledger/customer/${customer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}`),
                fetchPendingChanges()
            ]);

            const allLedger = fullLedgerRes.data || [];
            const monthRange = getMonthRangeForLatestTx(allLedger);
            setHistoryStartDate(monthRange.start);
            setHistoryEndDate(monthRange.end);

            let filteredLedger = allLedger;
            if (monthRange.start && monthRange.end) {
                const monthLedgerRes = await api.get(`/billing/ledger/customer/${customer.id}?mode=${isActualMode ? 'ACTUAL' : 'PAKKA'}&startDate=${monthRange.start}&endDate=${monthRange.end}`);
                filteredLedger = monthLedgerRes.data || [];
            }

            setHistorySales(salesRes.data || []);
            setHistoryBills([]);
            setLedgerData(filteredLedger);
        } catch { 
            setHistorySales([]); 
            setHistoryBills([]);
            setLedgerData([]); 
        } finally {
            setHistoryLoading(false);
            setLoadingCustomerId(null);
        }
    };

    const columns = [
        { header: 'Customer Firm', accessor: 'name', render: (v: string, row: any) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{v}</span>
                {row.is_active === 0 && <Badge colorScheme="red" variant="subtle" fontSize="0.7rem">INACTIVE</Badge>}
                {row.linked_supplier_id && (
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
                        Both (Supplier: {row.linked_supplier_name || 'Vendor'})
                    </span>
                )}
            </div>
        ) },
        { header: 'State', accessor: 'state' },
        { header: 'GSTIN / PAN', accessor: 'id', render: (_: any, row: any) => (
            <div style={{ fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 600 }}>{row.gstNumber || row.gst_number || 'N/A'}</div>
                <div style={{ color: 'var(--text-muted)' }}>{row.pan || 'N/A'}</div>
            </div>
        )},
        { header: 'Onboarded', accessor: 'created_at', render: (val: string) => formatToDDMMYY(val) },
        { header: 'Manage Account', accessor: 'id', render: (val: string, row: any) => (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                    disabled={loadingCustomerId === row.id}
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '0 12px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        background: loadingCustomerId === row.id ? 'rgba(59, 130, 246, 0.08)' : 'white', 
                        color: loadingCustomerId === row.id ? '#3b82f6' : 'var(--text-secondary)', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: loadingCustomerId === row.id ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease'
                    }} 
                    onClick={() => handleOpenHistory(row)}
                    onMouseEnter={(e) => { 
                        if (loadingCustomerId !== row.id) {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; 
                            e.currentTarget.style.color = '#3b82f6';
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => { 
                        if (loadingCustomerId !== row.id) {
                            e.currentTarget.style.background = 'white'; 
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                        }
                    }}
                >
                    {loadingCustomerId === row.id ? (
                        <>
                            <Loader2 size={13} className="animate-spin" /> Loading...
                        </>
                    ) : (
                        <>
                            <FileText size={13} /> History
                        </>
                    )}
                </button>
                <DownloadStatementBtn entityId={val} entityType="CUSTOMER" isActualMode={isActualMode} isTable={true} />
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
                    onClick={() => {
                        setFormData({
                            name: row.name,
                            email: row.email || '',
                            mobile: row.mobile || '',
                            gst_number: row.gst_number || row.gstNumber || '',
                            address: row.address || '',
                            state: row.state || '',
                            country: row.country || 'India',
                            registration_type: row.registration_type || 'Regular',
                            pan: row.pan || '',
                            opening_balance_pakka: row.opening_balance_pakka?.toString() || '0',
                            opening_balance_actual: row.opening_balance_actual?.toString() || '0',
                            closing_balance: row.closing_balance?.toString() || '0',
                            is_active: row.is_active !== 0,
                            is_also_supplier: !!row.linked_supplier_id,
                            link_supplier_id: row.linked_supplier_id || '',
                            supplier_opening_balance_pakka: '0',
                            supplier_opening_balance_actual: '0'
                        });
                        setDualMode(row.linked_supplier_id ? 'EXISTING' : 'NEW');
                        setEditingId(row.id);
                        setIsAddOpen(true);
                    }}
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
                {(user?.role === 'ADMIN' || user?.role === 'GODOWN') && (
                    <button
                        onClick={() => handleDeleteCustomer(val, row.name)}
                        title="Delete customer"
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
                )}
            </div>
        )}
    ];

    const historyColumns = [
        { header: 'Date', accessor: 'date', render: (v: string) => formatToDDMMYY(v) },
        { header: 'Description', accessor: 'description', render: (v: string, row: any) => {
            const isPurchase = row.source_type === 'SUPPLIER';
            const saleObj = (!isPurchase && row.ref) ? historySales.find((s: any) => s.invoice_number === row.ref) : null;
            const pending = (isActualMode && saleObj) ? pendingChanges.find((c: any) => c.formal_id === saleObj.id && c.bill_type === 'SALE') : null;

            return (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                        {row.source_type === 'SUPPLIER' && (
                            <span style={{
                                padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)'
                            }}>PURCHASE</span>
                        )}
                        {row.source_type === 'CUSTOMER' && historyViewMode === 'COMBINED' && (
                            <span style={{
                                padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700,
                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)'
                            }}>SALE</span>
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
                                        <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>₹{parseFloat(isActualMode ? ((i.actual_price || i.price || 0) * i.qty) : (i.price_after_gst || ((i.price || 0) * i.qty))).toFixed(2)}</td>
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
                <span style={{ fontWeight: 800, color: isActualMode ? '#f59e0b' : 'var(--accent-primary)' }}>₹{v.toLocaleString('en-IN')}</span>
            )
        },
        { header: 'Actions', accessor: 'ref', render: (v: string, row: any) => {
             if (!v) return null;
             const isPurchase = row.source_type === 'SUPPLIER';
             const saleObj = (!isPurchase) ? historySales.find((s: any) => s.invoice_number === v) : null;
             const billObj = (isPurchase) ? historyBills.find((b: any) => b.bill_number === v) : null;

             if (isPurchase) {
                 if (!billObj) return null;
                 const isReturn = v.startsWith('PRET-');
                 return (
                     <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                         <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem' }} onClick={() => {
                             setViewingPurchase(billObj);
                             setIsPurchaseEditMode(false);
                         }}>View Bill</button>
                         <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--accent-secondary)' }} onClick={() => {
                             setViewingPurchase(billObj);
                             setIsPurchaseEditMode(true);
                         }}>Edit Bill</button>
                         {!isReturn && (
                             <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#ef4444' }} onClick={() => {
                                 setProcessingReturn(billObj);
                                 setReturnType('purchase');
                             }}>Return</button>
                         )}
                     </div>
                 );
             }

             if (!saleObj) return null;
             const pending = (isActualMode && saleObj) ? pendingChanges.find((c: any) => c.formal_id === saleObj.id && c.bill_type === 'SALE') : null;

             return (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {pending ? (
                        <>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem' }} onClick={() => {
                                setViewingSale(saleObj);
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
                                setViewingSale(saleObj);
                                setIsEditMode(false);
                            }}>View Bill</button>
                            <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--accent-secondary)' }} onClick={() => {
                                setViewingSale(saleObj);
                                setIsEditMode(true);
                            }}>Edit Bill</button>
                        </>
                    )}
                    {!v.startsWith('RET-') && !pending && (
                        <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: '#ef4444' }} onClick={() => {
                            setProcessingReturn(saleObj);
                            setReturnType('sale');
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Ply Decore Sales - CRM</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Centralized customer records and financial ledger matrix.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="primary-btn" onClick={exportCustomers} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', height: 'auto', padding: '12px 24px' }}>
                        <Download size={18} /> Export List
                    </button>
                    <button className="primary-btn" style={{ height: 'auto', padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }} onClick={() => { setIsAddOpen(true); setEditingId(null); setFormData({...defaultForm}); setDualMode('NEW'); }}>
                        <UserPlus size={20} style={{ marginRight: '8px' }} /> New Customer
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Party Ledger Registry</h2>
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
                            <option value="ALL">All Customers</option>
                        </select>
                    </div>
                </div>
                <DataTable apiEndpoint={`/customers?statusFilter=${statusFilter}`} refreshTrigger={refreshTrigger} columns={columns} emptyMessage="No customers found." />
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingId ? "Update Customer Profile" : "Register New Customer"}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitting(true); setError('');
                    api[editingId ? 'put' : 'post'](editingId ? `/customers/${editingId}` : '/customers', formData)
                    .then(() => { setIsAddOpen(false); setRefreshTrigger(prev => prev + 1); })
                    .catch(err => setError(err.response?.data?.error || 'Failed to process'))
                    .finally(() => setSubmitting(false));
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Firm Name / Customer Name</label>
                            <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        {!isActualMode ? (
                            <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '6px' }}>OPENING BALANCE (PAKKA)</label>
                                <input type="number" className="form-input" value={formData.opening_balance_pakka} onChange={e => setFormData({...formData, opening_balance_pakka: e.target.value})} />
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '6px' }}>OPENING BALANCE (GODOWN)</label>
                                <input type="number" className="form-input" value={formData.opening_balance_actual} onChange={e => setFormData({...formData, opening_balance_actual: e.target.value})} />
                            </div>
                        )}
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Address</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>

                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Mobile Number</label>
                            <input type="text" className="form-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>GSTIN</label>
                            <input type="text" className="form-input" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>PAN Number</label>
                            <input type="text" className="form-input" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} placeholder="ABCDE1234F" />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Full Address</label>
                            <input type="text" className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>

                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>State</label>
                            <input type="text" className="form-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Haryana" />
                        </div>
                        <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Registration Type</label>
                            <select className="form-input" value={formData.registration_type} onChange={e => setFormData({...formData, registration_type: e.target.value})}>
                                <option value="Regular">Regular</option>
                                <option value="Unregistered">Unregistered</option>
                                <option value="Composition">Composition</option>
                                <option value="Consumer">Consumer</option>
                            </select>
                        </div>

                        <div style={{ background: 'rgba(16,185,129,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.1)' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.7rem', color: '#10b981', display: 'block', marginBottom: '6px' }}>CLOSING BALANCE</label>
                            <input type="number" className="form-input" value={formData.closing_balance} onChange={e => setFormData({...formData, closing_balance: e.target.value})} />
                        </div>

                        <div style={{ gridColumn: 'span 2', padding: '16px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#7c3aed' }}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_also_supplier} 
                                    onChange={e => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            is_also_supplier: checked,
                                            link_supplier_id: checked && dualMode === 'EXISTING' ? prev.link_supplier_id : ''
                                        }));
                                    }} 
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                                />
                                This party is BOTH a Customer and a Supplier (Dual Entity)
                            </label>
                            {formData.is_also_supplier && (
                                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {/* Choice: New Party vs Link Existing */}
                                    <div style={{ display: 'flex', gap: '12px', background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDualMode('NEW');
                                                setFormData(prev => ({ ...prev, link_supplier_id: '' }));
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
                                            Link Existing Supplier
                                        </button>
                                    </div>

                                    {dualMode === 'NEW' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#6d28d9', background: 'rgba(124, 58, 237, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.15)', lineHeight: 1.4 }}>
                                                ✓ <strong>New Dual Party:</strong> A matching Supplier account for <strong>{formData.name || 'this party'}</strong> will automatically be created and linked with identical GSTIN, Mobile, and Address.
                                            </div>
                                            {!editingId && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                            Supplier Opening (Formal)
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            value={formData.supplier_opening_balance_pakka} 
                                                            onChange={e => setFormData({ ...formData, supplier_opening_balance_pakka: e.target.value })} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                                            Supplier Opening (Actual)
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            value={formData.supplier_opening_balance_actual} 
                                                            onChange={e => setFormData({ ...formData, supplier_opening_balance_actual: e.target.value })} 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                                Select Existing Supplier from Registry *
                                            </label>
                                            <select 
                                                className="form-input" 
                                                value={formData.link_supplier_id} 
                                                onChange={e => setFormData({ ...formData, link_supplier_id: e.target.value })}
                                                required={dualMode === 'EXISTING'}
                                            >
                                                <option value="">-- Choose Existing Supplier to Link --</option>
                                                {suppliersList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} {s.gstNumber ? `(GST: ${s.gstNumber})` : (s.mobile ? `(Ph: ${s.mobile})` : '')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {editingId && (
                            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.1)' }}>
                                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="is_active" style={{ fontWeight: 700, fontSize: '0.8rem', color: '#d97706', cursor: 'pointer' }}>CUSTOMER PROFILE ACTIVE (Uncheck to mark Inactive)</label>
                            </div>
                        )}
                    </div>

                    {error && <div style={{ color: 'red', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                    <button type="submit" className="primary-btn" style={{ height: '50px', fontSize: '1rem', fontWeight: 700, marginTop: '8px' }}>
                        {submitting ? 'Processing...' : (editingId ? 'Update Customer' : 'Register Customer')}
                    </button>
                </form>
            </Modal>

            <SaleDetailModal 
                isOpen={!!viewingSale} 
                onClose={() => { setViewingSale(null); setIsEditMode(false); }} 
                sale={viewingSale} 
                customerName={historyCustomer?.name || ''} 
                isActual={isActualMode}
                initialEditMode={isEditMode}
                onRefresh={refreshCustomerData}
            />

            <PurchaseDetailModal 
                isOpen={!!viewingPurchase} 
                onClose={() => { setViewingPurchase(null); setIsPurchaseEditMode(false); }} 
                purchase={viewingPurchase} 
                supplierName={historyCustomer?.linked_supplier_name || 'Linked Supplier'} 
                isActual={isActualMode}
                initialEditMode={isPurchaseEditMode}
                onRefresh={refreshCustomerData}
            />

            <ReturnModal
                isOpen={!!processingReturn}
                onClose={() => { setProcessingReturn(null); setReturnType('sale'); }}
                sale={processingReturn}
                customerName={historyCustomer?.name || ''}
                type={returnType}
            />

            <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={`Ply Decore Sales - Ledger: ${historyCustomer?.name || ''}`} maxWidth="1400px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {historyCustomer?.linked_supplier_id ? (
                            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid var(--border-color)' }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: '4px 14px', borderRadius: '6px', border: 'none',
                                        background: historyViewMode === 'CUSTOMER' ? 'var(--accent-primary)' : 'transparent',
                                        color: historyViewMode === 'CUSTOMER' ? '#fff' : 'var(--text-secondary)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => switchHistoryView('CUSTOMER')}
                                >
                                    Customer History
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
                        entityId={historyCustomer?.id} 
                        entityType={historyViewMode === 'COMBINED' ? 'DUAL' : 'CUSTOMER'} 
                        startDate={historyStartDate} 
                        endDate={historyEndDate} 
                        isActualMode={isActualMode} 
                        returnsOnly={returnsOnly} 
                    />
                </div>

                <DataTable 
                    columns={historyColumns} 
                    data={ledgerData.filter(d => !returnsOnly || (d.ref && (d.ref.startsWith('RET-') || d.ref.startsWith('PRET-') || (d.type && d.type.includes('RETURN')))))} 
                    loading={historyLoading}
                    emptyMessage="No transactions found for this party." 
                />
            </Modal>

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

export default Customers;
