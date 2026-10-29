import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Users, TrendingUp, TrendingDown, IndianRupee,
    BarChart2, DollarSign, Minus, Eye, Truck, GitCompare,
    Settings as SettingsIcon, Trash2, AlertTriangle, Activity, Bell
} from 'lucide-react';
import SaleDetailModal from '../components/SaleDetailModal';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import ReturnModal from '../components/ReturnModal';
import BillChangeDiffModal from '../components/BillChangeDiffModal';
import DataTable from '../components/DataTable';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { formatToDDMMYY, formatToYYYYMMDD } from '../utils/date';

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, color, subtext, trend, link }: any) => {
    const navigate = useNavigate();
    return (
        <div
            className="glass-panel"
            onClick={() => link && navigate(link)}
            style={{
                padding: '20px 24px', flex: '1 1 220px', display: 'flex', alignItems: 'center',
                gap: '16px', cursor: link ? 'pointer' : 'default', borderRadius: '14px',
                position: 'relative', overflow: 'hidden', transition: 'transform 0.15s ease',
                border: '1px solid rgba(245,158,11,0.15)',
            }}
            onMouseEnter={e => { if (link) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
            <div style={{ background: `rgba(${color}, 0.12)`, padding: '14px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: `rgb(${color})` }}>{icon}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                <h2 style={{
                    fontSize: '1.5rem', margin: 0, lineHeight: 1.2, fontWeight: 800,
                    color: trend === 'down' ? '#fca5a5' : trend === 'up' ? '#86efac' : 'var(--text-primary)'
                }}>{value}</h2>
                {subtext && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{subtext}</p>}
            </div>
        </div>
    );
};

// ─── Section Divider ─────────────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(245,158,11,0.3)' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(245,158,11,0.3)' }} />
    </div>
);

// ─── Internal (Actual) Dashboard ─────────────────────────────────────────────
const ActualAccounting = () => {
    const [financials, setFinancials] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [ledgers, setLedgers] = useState<{ receivables: any[]; payables: any[] } | null>(null);
    const [actualSales, setActualSales] = useState<any[]>([]);
    const [actualPurchases, setActualPurchases] = useState<any[]>([]);
    const [supplierMappings, setSupplierMappings] = useState<any[]>([]);
    const [customerMappings, setCustomerMappings] = useState<any[]>([]);
    const [stock, setStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'mappings' | 'stock'>('sales');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewingSale, setViewingSale] = useState<any>(null);
    const [viewingPO, setViewingPO] = useState<any>(null);
    const [processingReturn, setProcessingReturn] = useState<{ type: 'sale' | 'purchase'; data: any } | null>(null);
    const [pendingChanges, setPendingChanges] = useState<any[]>([]);
    const [viewingDiff, setViewingDiff] = useState<any>(null);
    const [changeLoading, setChangeLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const load = async () => {
            try {
                const [finRes, statRes, ledgerRes, salesRes, purchasesRes, suppMapRes, custMapRes, itemsRes] = await Promise.all([
                    api.get(`/dashboard/financials?mode=ACTUAL&startDate=${startDate}&endDate=${endDate}`),
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/ledgers?mode=ACTUAL'),
                    api.get('/billing/sales/actual'),
                    api.get('/billing/purchases/actual'),
                    api.get('/mappings/supplier'),
                    api.get('/mappings/customer'),
                    api.get('/items'),
                ]);
                setFinancials(finRes.data);
                setStats(statRes.data);
                setLedgers(ledgerRes.data);
                setActualSales(salesRes.data);
                setActualPurchases(purchasesRes.data);
                setSupplierMappings(suppMapRes.data);
                setCustomerMappings(custMapRes.data);
                setStock(itemsRes.data.flatMap((item: any) =>
                    item.shades.map((shade: any) => ({ ...shade, item_name: item.name }))
                ));
                // Also load pending change requests
                try {
                    const chRes = await api.get('/billing/changes/pending');
                    setPendingChanges(chRes.data);
                } catch (_) {}
            } catch (err) {
                console.error('Actual Dashboard load failed', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [startDate, endDate]);

    const refetchBilling = async () => {
        const [s, p] = await Promise.all([api.get('/billing/sales/actual'), api.get('/billing/purchases/actual')]);
        setActualSales(s.data);
        setActualPurchases(p.data);
    };

    const fetchPendingChanges = async () => {
        try {
            const res = await api.get('/billing/changes/pending');
            setPendingChanges(res.data);
        } catch (err) {
            // Non-critical: silently ignore if not available
        }
    };

    const handleAcceptChange = async (changeId: string) => {
        if (!window.confirm('Accept these formal changes? The actual portal will be updated now.')) return;
        try {
            setChangeLoading(true);
            await api.post(`/billing/changes/${changeId}/accept`);
            setViewingDiff(null);
            await Promise.all([refetchBilling(), fetchPendingChanges()]);
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refetchBilling(), fetchPendingChanges()]);
            } else {
                alert(err.response?.data?.error || 'Failed to accept changes');
            }
        } finally {
            setChangeLoading(false);
        }
    };

    const handleRejectChange = async (changeId: string) => {
        if (!window.confirm('Reject these formal changes? The actual portal data will remain unchanged.')) return;
        try {
            setChangeLoading(true);
            await api.post(`/billing/changes/${changeId}/reject`);
            setViewingDiff(null);
            await fetchPendingChanges();
        } catch (err: any) {
            if (err.response?.status === 404) {
                alert('This change request has been superseded by a newer edit or already resolved. Refreshing list...');
                setViewingDiff(null);
                await Promise.all([refetchBilling(), fetchPendingChanges()]);
            } else {
                alert(err.response?.data?.error || 'Failed to reject changes');
            }
        } finally {
            setChangeLoading(false);
        }
    };

    const handleDelete = async (id: string, type: 'SALE' | 'PURCHASE') => {
        if (!window.confirm(`Delete this ${type.toLowerCase()}? Inventory will be reverted.`)) return;
        try {
            if (type === 'SALE') await api.delete(`/billing/sale/${id}`);
            else await api.delete(`/billing/purchase/${id}`);
            refetchBilling();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Loading Internal Dashboard...</p>
        </div>
    );

    if (!financials || !stats) return (
        <div style={{ color: 'var(--danger)', padding: '20px' }}>Failed to load internal dashboard.</div>
    );

    const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const { revenue, cogs, grossProfit, opExpenses, netProfit, totalCollected, totalPaidOut, expenseBreakdown, actualReceivable, actualPayable } = financials;
    const { lowStock } = stats;

    const filterByDate = (rows: any[], dateKey: string) =>
        rows.filter(r => {
            const d = r[dateKey] ? formatToYYYYMMDD(r[dateKey]) : '';
            return (!startDate || d >= startDate) && (!endDate || d <= endDate);
        });

    const filteredSales = filterByDate(actualSales, 'sale_date');
    const filteredPurchases = filterByDate(actualPurchases, 'bill_date');

    const tabs = [
        { key: 'sales', label: 'Actual Sales', icon: <Eye size={14} /> },
        { key: 'purchases', label: 'Actual Purchases', icon: <Truck size={14} /> },
        { key: 'mappings', label: 'Price Mappings', icon: <GitCompare size={14} /> },
        { key: 'stock', label: 'Live Stock', icon: <Package size={14} /> },
    ];

    return (
        <div style={{ paddingBottom: '60px' }}>

            {/* ── Pending Change Request Notification Banner ── */}
            {pendingChanges.length > 0 && (
                <div                 style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.08))',
                    border: '1px solid rgba(245,158,11,0.5)',
                    borderRadius: '12px', padding: '14px 20px', marginBottom: '20px',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{ background: 'rgba(245,158,11,0.2)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                            <Bell size={18} color="#f59e0b" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#fbbf24' }}>
                                {pendingChanges.length} Formal Bill Change{pendingChanges.length > 1 ? 's' : ''} Pending Approval
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                The Formal (Pakka) portal has edited {pendingChanges.length === 1 ? 'a bill' : 'bills'} that affect the Actual portal. Review and accept or reject below.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {pendingChanges.map((ch: any) => (
                            <button
                                key={ch.id}
                                onClick={() => setViewingDiff(ch)}
                                style={{
                                    padding: '6px 14px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
                                    border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.15)',
                                    color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <AlertTriangle size={12} /> {ch.bill_ref || ch.bill_type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: '6px', height: '32px', background: '#f59e0b', borderRadius: '3px' }} />
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Internal Godown Dashboard</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginLeft: '18px', fontSize: '0.85rem' }}>Actual/internal accounting · Godown stock tracking · Real cost & revenue analytics</p>
                    <div style={{ marginLeft: '18px', marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => navigate('/mappings')} style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <GitCompare size={14} /> Rules & Mappings
                        </button>
                        <button onClick={() => navigate('/live-stock')} style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} /> Godown Stock
                        </button>
                    </div>
                </div>
                {/* Unified Date Range Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>From:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>To:</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'transparent', color: '#f59e0b', cursor: 'pointer', fontSize: '0.78rem' }}>Clear</button>
                    )}
                </div>
            </div>

            {/* ── Actual P&L KPIs ── */}
            <SectionLabel label="Profit & Loss — Internal (Actual / Godown)" />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <KpiCard title="Actual Revenue" value={fmt(revenue)} icon={<TrendingUp size={28} />} color="245, 158, 11" subtext="From ledger_internal_actual (customers)" trend="up" />
                <KpiCard title="Actual COGS" value={fmt(cogs)} icon={<TrendingDown size={28} />} color="239, 68, 68" subtext="From ledger_internal_actual (suppliers)" trend="down" />
                <KpiCard
                    title="Actual Gross Profit"
                    value={fmt(grossProfit)}
                    icon={<BarChart2 size={28} />}
                    color={grossProfit >= 0 ? "34, 197, 94" : "239, 68, 68"}
                    subtext={`Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%`}
                    trend={grossProfit >= 0 ? 'up' : 'down'}
                />
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <KpiCard title="Operating Expenses" value={fmt(opExpenses)} icon={<Minus size={28} />} color="239, 68, 68" subtext="Internal cashbook expenses" trend="down" />
                <KpiCard
                    title="Actual Net Profit"
                    value={fmt(netProfit)}
                    icon={<DollarSign size={28} />}
                    color={netProfit >= 0 ? "59, 130, 246" : "239, 68, 68"}
                    subtext={`After expenses | Margin: ${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%`}
                    trend={netProfit >= 0 ? 'up' : 'down'}
                />
                <KpiCard title="Total Collected" value={fmt(totalCollected)} icon={<IndianRupee size={28} />} color="139, 92, 246" subtext="All cashbook INCOME" />
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <KpiCard title="Actual Receivable" value={fmt(actualReceivable)} icon={<TrendingUp size={28} />} color="245, 158, 11" subtext="Net from customers (internal ledger)" />
                <KpiCard title="Actual Payable" value={fmt(actualPayable)} icon={<TrendingDown size={28} />} color="239, 68, 68" subtext="Net to suppliers (internal ledger)" />
                <KpiCard title="Total Paid Out" value={fmt(totalPaidOut)} icon={<TrendingDown size={28} />} color="245, 158, 11" subtext="All cashbook EXPENSE" />
            </div>

            {/* ── Internal Registry Tabs ── */}
            <SectionLabel label="Internal Transaction Registry" />

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '16px', width: 'fit-content', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        style={{
                            padding: '10px 20px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer',
                            background: activeTab === tab.key ? '#f59e0b' : 'transparent',
                            color: activeTab === tab.key ? '#000' : '#f59e0b',
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                        }}
                    >{tab.icon} {tab.label}</button>
                ))}
            </div>

            {/* Date Filter for sales/purchases tabs */}
            {(activeTab === 'sales' || activeTab === 'purchases') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {(startDate || endDate) && (
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                            Filtered: {startDate || 'Beginning'} to {endDate || 'Present'}
                        </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#f59e0b' }}>
                        {activeTab === 'sales' ? filteredSales.length : filteredPurchases.length} records
                    </span>
                </div>
            )}

            {/* Tab: Actual Sales */}
            {activeTab === 'sales' && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(245,158,11,0.2)', flexWrap: 'wrap' }}>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Actual Revenue</span><br /><strong style={{ color: '#fbbf24' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.actual_total || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Collected</span><br /><strong style={{ color: 'var(--success)' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.actual_paid || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Balance</span><br /><strong style={{ color: 'var(--danger)' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.actual_balance || 0), 0))}</strong></div>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Invoice', accessor: 'invoice_number', render: (v: string, row: any) => {
                                const pending = pendingChanges.find((c: any) => c.formal_id === row.sale_id && c.bill_type === 'SALE');
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#fbbf24' }}>{v}</span>
                                        {pending && (
                                            <span style={{
                                                fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                                                background: 'rgba(245,158,11,0.25)', color: '#f59e0b',
                                                border: '1px solid rgba(245,158,11,0.5)', animation: 'pulse 2s infinite'
                                            }}>PENDING</span>
                                        )}
                                    </div>
                                );
                            }},
                            { header: 'Customer', accessor: 'customer_name' },
                            { header: 'Date', accessor: 'sale_date', render: (v: string) => formatToDDMMYY(v) },
                            { header: 'Actual Total', accessor: 'actual_total', render: (v: any) => <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Collected', accessor: 'actual_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Balance', accessor: 'actual_balance', render: (v: any) => <span style={{ fontWeight: 700, color: parseFloat(v) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            {
                                header: 'Actions', accessor: 'sale_id',
                                render: (id: string, row: any) => {
                                    const pending = pendingChanges.find((c: any) => c.formal_id === row.sale_id && c.bill_type === 'SALE');
                                    return (
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            <button onClick={() => { const s = actualSales.find((x: any) => x.sale_id === id); if (s) setViewingSale({ ...s, id: s.sale_id }); }} style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer', fontSize: '0.75rem' }}>View</button>
                                            {pending && (
                                                <>
                                                    <button
                                                        onClick={() => setViewingDiff(pending)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >View Changes</button>
                                                    <button
                                                        onClick={() => handleAcceptChange(pending.id)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#86efac', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >Accept</button>
                                                    <button
                                                        onClick={() => handleRejectChange(pending.id)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >Reject</button>
                                                </>
                                            )}
                                            {isAdmin && <button onClick={() => handleDelete(row.sale_id, 'SALE')} style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={13} /></button>}
                                        </div>
                                    );
                                }
                            },
                        ]}
                        data={filteredSales}
                        pageSize={8}
                        emptyMessage="No actual sales for this period."
                    />
                </div>
            )}

            {/* Tab: Actual Purchases */}
            {activeTab === 'purchases' && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(245,158,11,0.2)', flexWrap: 'wrap' }}>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Actual Cost</span><br /><strong style={{ color: 'var(--danger)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.actual_total || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid</span><br /><strong style={{ color: 'var(--success)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.actual_paid || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Balance</span><br /><strong style={{ color: 'var(--danger)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.actual_balance || 0), 0))}</strong></div>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Bill No', accessor: 'bill_number', render: (v: string, row: any) => {
                                const pending = pendingChanges.find((c: any) => c.formal_id === row.bill_id && c.bill_type === 'PURCHASE');
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#fb923c' }}>{v}</span>
                                        {pending && (
                                            <span style={{
                                                fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                                                background: 'rgba(245,158,11,0.25)', color: '#f59e0b',
                                                border: '1px solid rgba(245,158,11,0.5)'
                                            }}>PENDING</span>
                                        )}
                                    </div>
                                );
                            }},
                            { header: 'Supplier', accessor: 'supplier_name' },
                            { header: 'Date', accessor: 'bill_date', render: (v: string) => formatToDDMMYY(v) },
                            { header: 'Actual Cost', accessor: 'actual_total', render: (v: any) => <span style={{ fontWeight: 700, color: '#fb923c' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Paid', accessor: 'actual_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Balance', accessor: 'actual_balance', render: (v: any) => <span style={{ fontWeight: 700, color: parseFloat(v) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            {
                                header: 'Actions', accessor: 'bill_id',
                                render: (id: string, row: any) => {
                                    const pending = pendingChanges.find((c: any) => c.formal_id === row.bill_id && c.bill_type === 'PURCHASE');
                                    return (
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            <button onClick={() => { const p = actualPurchases.find((x: any) => x.bill_id === id); if (p) setViewingPO({ ...p, id: p.bill_id }); }} style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer', fontSize: '0.75rem' }}>View</button>
                                            {pending && (
                                                <>
                                                    <button
                                                        onClick={() => setViewingDiff(pending)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >View Changes</button>
                                                    <button
                                                        onClick={() => handleAcceptChange(pending.id)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#86efac', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >Accept</button>
                                                    <button
                                                        onClick={() => handleRejectChange(pending.id)}
                                                        style={{ padding: '4px 9px', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                                                    >Reject</button>
                                                </>
                                            )}
                                            {isAdmin && <button onClick={() => handleDelete(row.bill_id, 'PURCHASE')} style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={13} /></button>}
                                        </div>
                                    );
                                }
                            },
                        ]}
                        data={filteredPurchases}
                        pageSize={8}
                        emptyMessage="No actual purchases for this period."
                    />
                </div>
            )}

            {/* Tab: Mappings */}
            {activeTab === 'mappings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {(user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                            <button onClick={() => navigate('/mappings')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <SettingsIcon size={14} /> Edit Mappings
                            </button>
                        )}
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h4 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Supplier Active Rules</h4>
                        <DataTable columns={[
                            { header: 'Supplier', accessor: 'supplier_name' },
                            { header: 'Item', accessor: 'item_name' },
                            { header: 'Pakka Rate', accessor: 'pakka_buying_rate', render: (v: any) => `₹${Number(v || 0).toFixed(2)}` },
                            { header: 'Deduction', accessor: 'kaccha_deduction_commission', render: (v: any) => <span style={{ color: '#f59e0b', fontWeight: 700 }}>₹{Number(v || 0).toFixed(2)}</span> },
                        ]} data={supplierMappings} pageSize={8} emptyMessage="No supplier mappings." />
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h4 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer Active Rules</h4>
                        <DataTable columns={[
                            { header: 'Customer', accessor: 'customer_name' },
                            { header: 'Item', accessor: 'item_name' },
                            { header: 'Actual Selling Price', accessor: 'actual_selling_price', render: (v: any) => <span style={{ color: '#fbbf24', fontWeight: 700 }}>₹{Number(v || 0).toFixed(2)}</span> },
                        ]} data={customerMappings} pageSize={8} emptyMessage="No customer mappings." />
                    </div>
                </div>
            )}

            {/* Tab: Live Stock */}
            {activeTab === 'stock' && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <DataTable columns={[
                        { header: 'Item', accessor: 'item_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
                        { header: 'Shade Code', accessor: 'shade_id_label', render: (v: string) => <span style={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>{v}</span> },
                        { header: 'Available Qty', accessor: 'available_qty', render: (v: any) => {
                            const qty = parseFloat(v || 0);
                            return <span style={{ padding: '3px 10px', borderRadius: '5px', fontWeight: 700, fontSize: '0.82rem', background: qty <= 0 ? 'rgba(239,68,68,0.1)' : qty < 10 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: qty <= 0 ? 'var(--danger)' : qty < 10 ? '#f59e0b' : 'var(--success)' }}>{qty}</span>;
                        }},
                        { header: 'Base Pakka Rate', accessor: 'base_pakka_selling_rate', render: (v: any) => `₹${Number(v || 0).toFixed(2)}` },
                    ]} data={stock} pageSize={10} emptyMessage="No stock items found." />
                </div>
            )}

            {/* ── Expense Breakdown ── */}
            {expenseBreakdown && expenseBreakdown.length > 0 && (
                <>
                    <SectionLabel label="Expense Breakdown by Category" />
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#f59e0b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Category</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Amount</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseBreakdown.map((row: any, i: number) => {
                                    const pct = opExpenses > 0 ? ((parseFloat(row.total) / opExpenses) * 100).toFixed(1) : '0';
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>{row.category}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>₹{parseFloat(row.total).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <div style={{ width: '80px', height: '6px', background: 'rgba(245,158,11,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Internal Ledger Tables ── */}
            {ledgers && (
                <>
                    <SectionLabel label="Actual Ledger Summary" />
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 12px', color: '#f59e0b', fontSize: '0.95rem', fontWeight: 700 }}>Customer Actual Receivables</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <DataTable
                                    columns={[
                                        { header: 'Customer', accessor: 'entity_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
                                        { header: 'Total (Actual)', accessor: 'actual_total', render: (v: any) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}` },
                                        { header: 'Paid', accessor: 'actual_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: 'Pending', accessor: 'actual_pending', render: (v: any) => <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: '', accessor: 'entity_id', render: () => <button onClick={() => navigate('/customers')} style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer' }}>Ledger</button> },
                                    ]}
                                    data={ledgers.receivables}
                                    pageSize={8}
                                    emptyMessage="No receivables found."
                                />
                            </div>
                        </div>
                        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 12px', color: '#fb923c', fontSize: '0.95rem', fontWeight: 700 }}>Supplier Actual Payables</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <DataTable
                                    columns={[
                                        { header: 'Supplier', accessor: 'entity_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
                                        { header: 'Total (Actual)', accessor: 'actual_total', render: (v: any) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}` },
                                        { header: 'Paid', accessor: 'actual_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: 'Pending', accessor: 'actual_pending', render: (v: any) => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: '', accessor: 'entity_id', render: () => <button onClick={() => navigate('/suppliers')} style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer' }}>Ledger</button> },
                                    ]}
                                    data={ledgers.payables}
                                    pageSize={8}
                                    emptyMessage="No payables found."
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Low Stock Alert ── */}
            {lowStock && lowStock.length > 0 && (
                <>
                    <SectionLabel label="Critical Stock Warnings" />
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <AlertTriangle size={18} color="var(--danger)" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{lowStock.length} shades below threshold</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                                <th style={{ padding: '8px', color: '#f59e0b', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Shade</th>
                                <th style={{ padding: '8px', color: '#f59e0b', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Item</th>
                                <th style={{ padding: '8px', color: '#f59e0b', fontSize: '0.72rem', textAlign: 'right', textTransform: 'uppercase' }}>Qty</th>
                            </tr></thead>
                            <tbody>{lowStock.map((s: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                                    <td style={{ padding: '10px 8px', fontWeight: 700, fontFamily: 'monospace', color: '#fbbf24' }}>{s.shade_id_label}</td>
                                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{s.item_name}</td>
                                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: s.available_qty <= 0 ? 'var(--danger)' : '#f59e0b' }}>{s.available_qty}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modals */}
            {viewingSale && (
                <SaleDetailModal isOpen={true} onClose={() => setViewingSale(null)} sale={viewingSale} customerName={viewingSale.customer_name || ''} isActual={true}
                    onRefresh={() => { refetchBilling(); setViewingSale(null); }}
                    onProcessReturn={(sale: any) => { setViewingSale(null); setProcessingReturn({ type: 'sale', data: sale }); }}
                />
            )}
            {viewingPO && (
                <PurchaseDetailModal isOpen={true} onClose={() => setViewingPO(null)} purchase={viewingPO} supplierName={viewingPO.supplier_name || ''} isActual={true}
                    onRefresh={() => { refetchBilling(); setViewingPO(null); }}
                    onProcessReturn={(purchase: any) => { setViewingPO(null); setProcessingReturn({ type: 'purchase', data: purchase }); }}
                />
            )}
            {processingReturn && (
                <ReturnModal isOpen={true}
                    onClose={() => { setProcessingReturn(null); refetchBilling(); }}
                    sale={processingReturn.data}
                    customerName={processingReturn.data.customer_name || processingReturn.data.supplier_name || ''}
                    type={processingReturn.type}
                />
            )}
            {/* Bill Change Diff Modal */}
            <BillChangeDiffModal
                isOpen={!!viewingDiff}
                onClose={() => setViewingDiff(null)}
                changeRequest={viewingDiff}
                loading={changeLoading}
                onAccept={() => viewingDiff && handleAcceptChange(viewingDiff.id)}
                onReject={() => viewingDiff && handleRejectChange(viewingDiff.id)}
            />
        </div>
    );
};

export default ActualAccounting;
