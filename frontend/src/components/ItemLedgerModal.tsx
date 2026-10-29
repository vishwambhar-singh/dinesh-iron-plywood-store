import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import DataTable from './DataTable';
import api from '../utils/api';
import { formatToDDMMYY } from '../utils/date';
import { ShoppingCart, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';

interface ItemLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    shade?: any;
}

const ItemLedgerModal: React.FC<ItemLedgerModalProps> = ({ isOpen, onClose, item, shade }) => {
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const getMonthRangeForLatestTx = (transactions: any[]) => {
        let latestDate: Date | null = null;
        if (Array.isArray(transactions)) {
            transactions.forEach(t => {
                const rawDate = t.date || t.created_at;
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

    const fetchLedger = async (start: string = startDate, end: string = endDate, type: string = filterType) => {
        if (!item) return;
        setLoading(true);
        try {
            let url = `/items/${item.id}/ledger?type=${type}`;
            if (shade?.id) url += `&shadeId=${shade.id}`;
            if (start) url += `&startDate=${start}`;
            if (end) url += `&endDate=${end}`;

            const res = await api.get(url);
            setLedgerData(res.data || []);
            return res.data || [];
        } catch (err) {
            console.error('Failed to fetch item ledger:', err);
            setLedgerData([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && item) {
            let url = `/items/${item.id}/ledger?type=ALL`;
            if (shade?.id) url += `&shadeId=${shade.id}`;
            
            setLoading(true);
            api.get(url)
                .then(res => {
                    const allTx = res.data || [];
                    const range = getMonthRangeForLatestTx(allTx);
                    setStartDate(range.start);
                    setEndDate(range.end);
                    return fetchLedger(range.start, range.end, 'ALL');
                })
                .catch(() => setLedgerData([]))
                .finally(() => setLoading(false));
        }
    }, [isOpen, item, shade]);

    const handleFilterChange = (newType: 'ALL' | 'BUY' | 'SELL') => {
        setFilterType(newType);
        fetchLedger(startDate, endDate, newType);
    };

    const columns = [
        {
            header: 'Type',
            accessor: 'type',
            sortable: true,
            render: (v: string) => (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: v === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: v === 'BUY' ? '#10b981' : '#ef4444',
                    border: `1px solid ${v === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                    {v === 'BUY' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    {v === 'BUY' ? 'BUY (Purchase)' : 'SELL (Sale)'}
                </span>
            )
        },
        {
            header: 'Date',
            accessor: 'date',
            sortable: true,
            render: (v: string) => <span style={{ fontWeight: 600 }}>{formatToDDMMYY(v)}</span>
        },
        {
            header: 'Party (Supplier / Customer)',
            accessor: 'party_name',
            sortable: true,
            render: (v: string, row: any) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{v}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {row.type === 'BUY' ? 'Supplier' : 'Customer'}
                    </div>
                </div>
            )
        },
        {
            header: 'Bill / Invoice No',
            accessor: 'ref_no',
            sortable: true,
            render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v || 'N/A'}</span>
        },
        {
            header: 'Shade',
            accessor: 'shade_label',
            sortable: true,
            render: (v: string) => <span style={{ fontSize: '0.85rem' }}>{v}</span>
        },
        {
            header: 'Quantity',
            accessor: 'qty',
            sortable: true,
            render: (v: any, row: any) => (
                <span style={{
                    fontWeight: 700,
                    color: row.type === 'BUY' ? '#10b981' : '#ef4444'
                }}>
                    {row.type === 'BUY' ? `+${v}` : `-${v}`} Units
                </span>
            )
        },
        {
            header: 'Rate',
            accessor: 'rate',
            sortable: true,
            render: (v: any) => `₹${(parseFloat(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        },
        {
            header: 'Total Amount',
            accessor: 'amount',
            sortable: true,
            render: (v: any) => (
                <span style={{ fontWeight: 700 }}>
                    ₹{(parseFloat(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            )
        }
    ];

    const title = shade 
        ? `Item Stock Ledger - ${item?.name} (${shade.shade_id_label})` 
        : `Item Stock Ledger - ${item?.name || ''}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="1200px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Header Controls: Filters & Date Pickers */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    {/* Buy/Sell Filter Tabs */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => handleFilterChange('ALL')}
                            className="primary-btn"
                            style={{
                                padding: '6px 14px',
                                fontSize: '0.82rem',
                                background: filterType === 'ALL' ? 'var(--brand-maroon)' : 'var(--panel-bg)',
                                color: filterType === 'ALL' ? '#fff' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => handleFilterChange('BUY')}
                            className="primary-btn"
                            style={{
                                padding: '6px 14px',
                                fontSize: '0.82rem',
                                background: filterType === 'BUY' ? '#10b981' : 'var(--panel-bg)',
                                color: filterType === 'BUY' ? '#fff' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <ArrowDownLeft size={14} style={{ marginRight: 4 }} /> BUY (Purchases)
                        </button>
                        <button
                            onClick={() => handleFilterChange('SELL')}
                            className="primary-btn"
                            style={{
                                padding: '6px 14px',
                                fontSize: '0.82rem',
                                background: filterType === 'SELL' ? '#ef4444' : 'var(--panel-bg)',
                                color: filterType === 'SELL' ? '#fff' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <ArrowUpRight size={14} style={{ marginRight: 4 }} /> SELL (Sales)
                        </button>
                    </div>

                    {/* Date Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Filter size={14} color="var(--text-muted)" />
                        <input
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                fetchLedger(e.target.value, endDate, filterType);
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
                        <input
                            type="date"
                            className="form-input"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                fetchLedger(startDate, e.target.value, filterType);
                            }}
                            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                        />
                    </div>
                </div>

                {/* Ledger Data Table */}
                <DataTable
                    columns={columns}
                    data={ledgerData}
                    loading={loading}
                    emptyMessage="No stock buy/sell transactions found for the selected period."
                />
            </div>
        </Modal>
    );
};

export default ItemLedgerModal;
