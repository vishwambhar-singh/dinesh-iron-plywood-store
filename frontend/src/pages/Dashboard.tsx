import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Users, GitCompare, IndianRupee,
    TrendingUp, TrendingDown, AlertTriangle, Activity,
    Receipt, Truck, BarChart2, DollarSign, Minus
} from 'lucide-react';
import DataTable from '../components/DataTable';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { formatToDDMMYY, formatToYYYYMMDD } from '../utils/date';

// ─── Reusable KPI Card ────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, color, subtext, trend, link, onClick }: any) => {
    const navigate = useNavigate();
    const handleClick = () => { if (link) navigate(link); if (onClick) onClick(); };
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';
    return (
        <div
            className="glass-panel"
            onClick={handleClick}
            style={{
                padding: '20px 24px',
                flex: '1 1 220px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: link ? 'pointer' : 'default',
                borderRadius: '14px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => { if (link) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.06, transform: 'translate(20%, -20%)' }}>
                <div style={{ fontSize: '7rem', color: `rgb(${color})` }}>{icon}</div>
            </div>
            <div style={{ background: `rgba(${color}, 0.12)`, padding: '14px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: `rgb(${color})` }}>{icon}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                <h2 style={{
                    fontSize: '1.5rem', margin: 0, lineHeight: 1.2, fontWeight: 800,
                    color: isNegative ? 'var(--danger)' : isPositive ? 'var(--success)' : 'var(--text-primary)'
                }}>{value}</h2>
                {subtext && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{subtext}</p>}
            </div>
        </div>
    );
};

// ─── Section Divider ─────────────────────────────────────────────────────────
const SectionLabel = ({ label }: { label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
    </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [financials, setFinancials] = useState<any>(null);
    const [ledgers, setLedgers] = useState<{ receivables: any[]; payables: any[] } | null>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [regTab, setRegTab] = useState<'sales' | 'purchases'>('sales');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [finLoading, setFinLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    // 1. Initial Load: Fetch everything once
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [statRes, finRes, ledgerRes, salesRes, purchRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/financials?mode=FORMAL'),
                    api.get('/dashboard/ledgers?mode=FORMAL'),
                    api.get('/billing/sales/pakka'),
                    api.get('/billing/purchases/pakka'),
                ]);
                setStats(statRes.data);
                setFinancials(finRes.data);
                setLedgers(ledgerRes.data);
                setSales(salesRes.data || []);
                setPurchases(purchRes.data || []);
                setInitialLoaded(true);
            } catch (err) {
                console.error('Formal Dashboard initial load failed', err);
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    // 2. Date Filter Change: Only re-query financials (sales and purchases filter locally in memory)
    useEffect(() => {
        if (!initialLoaded) return;

        let active = true;
        const updateFinancials = async () => {
            setFinLoading(true);
            try {
                const query = `/dashboard/financials?mode=FORMAL&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
                const res = await api.get(query);
                if (active) {
                    setFinancials(res.data);
                }
            } catch (err) {
                console.error('Failed to update financials for date range', err);
            } finally {
                if (active) setFinLoading(false);
            }
        };

        const timer = setTimeout(() => {
            updateFinancials();
        }, 150);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [startDate, endDate, initialLoaded]);

    if (loading) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading Formal Dashboard...</p>
        </div>
    );

    if (!stats || !financials) return (
        <div style={{ color: 'var(--danger)', padding: '20px' }}>Failed to load dashboard. Check your backend connection.</div>
    );

    const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const { employees, customers, suppliers, items, shades, lowStock, recent_activity } = stats;
    const { revenue, cogs, grossProfit, opExpenses, netProfit, totalCollected, totalPaidOut, expenseBreakdown } = financials;

    // Filter registry rows by date
    const filterByDate = (rows: any[], dateKey: string) =>
        rows.filter(r => {
            const d = r[dateKey] ? formatToYYYYMMDD(r[dateKey]) : '';
            return (!startDate || d >= startDate) && (!endDate || d <= endDate);
        });

    const filteredSales = filterByDate(sales.filter((s: any) => !s.invoice_number?.startsWith('RET-')), 'sale_date');
    const filteredPurchases = filterByDate(purchases.filter((p: any) => !p.bill_number?.startsWith('PRET-')), 'bill_date');

    return (
        <div style={{ paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: '6px', height: '32px', background: 'var(--brand-maroon)', borderRadius: '3px' }} />
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Formal Registry Dashboard</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginLeft: '18px', fontSize: '0.85rem' }}>Tax-compliant Pakka sales · Formal purchase bills · GST ledger analytics</p>
                </div>
                {/* Unified Date Range Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>From:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>To:</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>Clear</button>
                    )}
                </div>
            </div>

            {/* ── P&L KPIs ── */}
            <SectionLabel label="Profit & Loss — Formal (Pakka)" />
            <div style={{ opacity: finLoading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <KpiCard title="Gross Revenue" value={fmt(revenue)} icon={<TrendingUp size={28} />} color="16, 185, 129" subtext={`${filteredSales.length} invoices`} trend="up" link="/billing" />
                    <KpiCard title="Cost of Goods (COGS)" value={fmt(cogs)} icon={<TrendingDown size={28} />} color="245, 158, 11" subtext={`${filteredPurchases.length} purchase bills`} trend="down" link="/purchase" />
                    <KpiCard
                        title="Gross Profit"
                        value={fmt(grossProfit)}
                        icon={<BarChart2 size={28} />}
                        color={grossProfit >= 0 ? "16, 185, 129" : "239, 68, 68"}
                        subtext={`Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}%`}
                        trend={grossProfit >= 0 ? 'up' : 'down'}
                    />
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <KpiCard title="Operating Expenses" value={fmt(opExpenses)} icon={<Minus size={28} />} color="239, 68, 68" subtext="Manual cashbook expenses" trend="down" />
                    <KpiCard
                        title="Net Profit"
                        value={fmt(netProfit)}
                        icon={<DollarSign size={28} />}
                        color={netProfit >= 0 ? "59, 130, 246" : "239, 68, 68"}
                        subtext={`After expenses | Margin: ${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%`}
                        trend={netProfit >= 0 ? 'up' : 'down'}
                    />
                    <KpiCard title="Total Collected" value={fmt(totalCollected)} icon={<IndianRupee size={28} />} color="139, 92, 246" subtext="From all cashbook receipts" />
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <KpiCard title="Total Receivable" value={fmt(Math.abs(parseFloat(stats.receivable || 0)))} icon={<TrendingUp size={28} />} color="59, 130, 246" subtext="Pending from customers" link="/customers" />
                    <KpiCard title="Total Payable" value={fmt(Math.abs(parseFloat(stats.payable || 0)))} icon={<TrendingDown size={28} />} color="239, 68, 68" subtext="Pending to suppliers" link="/suppliers" />
                    <KpiCard title="Total Paid Out" value={fmt(totalPaidOut)} icon={<TrendingDown size={28} />} color="245, 158, 11" subtext="All cashbook expenses" />
                </div>
            </div>

            {/* ── Entity Counts ── */}
            <SectionLabel label="System Entities" />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <KpiCard title="Employees" value={employees} icon={<Users size={24} />} color="59, 130, 246" link="/employees" />
                <KpiCard title="Customers" value={customers} icon={<Users size={24} />} color="16, 185, 129" link="/customers" />
                <KpiCard title="Vendors" value={suppliers} icon={<GitCompare size={24} />} color="245, 158, 11" link="/suppliers" />
                <KpiCard title="Items / Shades" value={`${items} / ${shades}`} icon={<Package size={24} />} color="139, 92, 246" link="/inventory" />
            </div>

            {/* ── Formal Registry ── */}
            <SectionLabel label="Formal Invoice Registry" />

            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <button onClick={() => setRegTab('sales')} style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: regTab === 'sales' ? 'var(--brand-maroon)' : 'transparent', color: regTab === 'sales' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={14} /> Sales
                    </button>
                    <button onClick={() => setRegTab('purchases')} style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: regTab === 'purchases' ? 'var(--brand-maroon)' : 'transparent', color: regTab === 'purchases' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} /> Purchases
                    </button>
                </div>
                {(startDate || endDate) && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Filtered: {startDate || 'Beginning'} to {endDate || 'Present'}
                    </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {regTab === 'sales' ? filteredSales.length : filteredPurchases.length} records
                </span>
            </div>

            {regTab === 'sales' ? (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    {/* Summary row */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoiced</span><br /><strong style={{ color: 'var(--success)' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.total_amount || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Balance</span><br /><strong style={{ color: 'var(--danger)' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.balance || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Collected</span><br /><strong style={{ color: 'var(--accent-primary)' }}>{fmt(filteredSales.reduce((s: number, r: any) => s + parseFloat(r.amount_paid || 0), 0))}</strong></div>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Invoice No', accessor: 'invoice_number', render: (v: string) => <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-maroon)' }}>{v}</span> },
                            { header: 'Customer', accessor: 'customer_name_ref' },
                            { header: 'Date', accessor: 'sale_date', render: (v: string) => formatToDDMMYY(v) },
                            { header: 'Total', accessor: 'total_amount', render: (v: any) => <span style={{ fontWeight: 700 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Paid', accessor: 'amount_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Balance', accessor: 'balance', render: (v: any) => <span style={{ fontWeight: 700, color: parseFloat(v) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: '', accessor: 'id', render: () => <button onClick={() => navigate('/pakka')} style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(121,28,28,0.3)', background: 'rgba(121,28,28,0.07)', color: 'var(--brand-maroon)', cursor: 'pointer' }}>View</button> },
                        ]}
                        data={filteredSales}
                        pageSize={8}
                        emptyMessage="No formal sales found for this period."
                    />
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Billed</span><br /><strong style={{ color: 'var(--warning)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.total_amount || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Balance</span><br /><strong style={{ color: 'var(--danger)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.balance_amount || 0), 0))}</strong></div>
                        <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</span><br /><strong style={{ color: 'var(--accent-primary)' }}>{fmt(filteredPurchases.reduce((s: number, r: any) => s + parseFloat(r.amount_paid || 0), 0))}</strong></div>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Bill No', accessor: 'bill_number', render: (v: string) => <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--warning)' }}>{v}</span> },
                            { header: 'Supplier', accessor: 'supplier_name' },
                            { header: 'Date', accessor: 'bill_date', render: (v: string) => formatToDDMMYY(v) },
                            { header: 'Total', accessor: 'total_amount', render: (v: any) => <span style={{ fontWeight: 700 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Paid', accessor: 'amount_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: 'Balance', accessor: 'balance_amount', render: (v: any) => <span style={{ fontWeight: 700, color: parseFloat(v) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>₹{Number(v || 0).toLocaleString('en-IN')}</span> },
                            { header: '', accessor: 'id', render: () => <button onClick={() => navigate('/pakka')} style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.07)', color: 'var(--warning)', cursor: 'pointer' }}>View</button> },
                        ]}
                        data={filteredPurchases}
                        pageSize={8}
                        emptyMessage="No formal purchases found for this period."
                    />
                </div>
            )}

            {/* ── Expense Breakdown ── */}
            {expenseBreakdown && expenseBreakdown.length > 0 && (
                <>
                    <SectionLabel label="Expense Breakdown by Category" />
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Category</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Amount</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>% of Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseBreakdown.map((row: any, i: number) => {
                                    const pct = opExpenses > 0 ? ((parseFloat(row.total) / opExpenses) * 100).toFixed(1) : '0';
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>{row.category}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>₹{parseFloat(row.total).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <div style={{ width: '80px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--danger)', borderRadius: '3px' }} />
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

            {/* ── Ledger Tables ── */}
            {ledgers && (
                <>
                    <SectionLabel label="Customer & Supplier Ledger Summary" />
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Customer Receivables */}
                        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Customer Receivables</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <DataTable
                                    columns={[
                                        { header: 'Customer', accessor: 'entity_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
                                        { header: 'Total', accessor: 'pakka_total', render: (v: any) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}` },
                                        { header: 'Paid', accessor: 'pakka_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: 'Pending', accessor: 'pakka_pending', render: (v: any) => <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: '', accessor: 'entity_id', render: () => <button onClick={() => navigate('/customers')} style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', cursor: 'pointer' }}>Ledger</button> },
                                    ]}
                                    data={ledgers.receivables}
                                    pageSize={8}
                                    emptyMessage="No customer ledgers found."
                                />
                            </div>
                        </div>

                        {/* Supplier Payables */}
                        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Supplier Payables</h3>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <DataTable
                                    columns={[
                                        { header: 'Supplier', accessor: 'entity_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
                                        { header: 'Total', accessor: 'pakka_total', render: (v: any) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}` },
                                        { header: 'Paid', accessor: 'pakka_paid', render: (v: any) => <span style={{ color: 'var(--success)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: 'Pending', accessor: 'pakka_pending', render: (v: any) => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{parseFloat(v || 0).toLocaleString('en-IN')}</span> },
                                        { header: '', accessor: 'entity_id', render: () => <button onClick={() => navigate('/suppliers')} style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}>Ledger</button> },
                                    ]}
                                    data={ledgers.payables}
                                    pageSize={8}
                                    emptyMessage="No supplier ledgers found."
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Recent Activity + Low Stock ── */}
            <SectionLabel label="Alerts & Recent Activity" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                {/* Low Stock */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <AlertTriangle size={20} color="var(--danger)" />
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Critical Stock Warnings</h3>
                    </div>
                    {lowStock.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>✅ All stock levels healthy</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Shade</th>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Item</th>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'right', textTransform: 'uppercase' }}>Qty</th>
                            </tr></thead>
                            <tbody>{lowStock.map((s: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{s.shade_id_label}</td>
                                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{s.item_name}</td>
                                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: s.available_qty <= 0 ? 'var(--danger)' : 'var(--warning)' }}>{s.available_qty}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Activity size={20} color="var(--accent-primary)" />
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Recent Formal Activity</h3>
                    </div>
                    {recent_activity.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No recent activity found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Reference</th>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'left', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'right', textTransform: 'uppercase' }}>Amount</th>
                            </tr></thead>
                            <tbody>{recent_activity.map((act: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '10px 8px' }}>
                                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginRight: '6px', background: act.type === 'SALE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: act.type === 'SALE' ? 'var(--success)' : 'var(--warning)' }}>{act.type}</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{act.ref}</span>
                                    </td>
                                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{formatToDDMMYY(act.date)}</td>
                                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(act.amount).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
