import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import { useAuthStore } from '../store/useAuthStore';
import { PackageMinus, Trash2 } from 'lucide-react';

interface AdjustmentLog {
    id: number;
    employee_name: string;
    item_name: string;
    shade_id_label: string;
    previous_qty: string;
    adjusted_qty: string;
    new_qty: string;
    adjustment_type: 'INCREASE' | 'DECREASE';
    reason: string;
    created_at: string;
}

const AdjustmentLogs = () => {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<AdjustmentLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = () => {
        setLoading(true);
        api.get('/items/adjustments/logs')
            .then(res => setLogs(res.data))
            .catch(err => console.error("Error fetching adjustment logs", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this log? The inventory will automatically revert the adjustment.")) return;
        
        try {
            await api.delete(`/items/adjustments/logs/${id}`);
            fetchLogs();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to revert adjustment.');
        }
    };

    const columns = [
        {
            header: 'Date',
            accessor: 'created_at',
            render: (val: any) => new Date(val).toLocaleString()
        },
        {
            header: 'Account',
            accessor: 'employee_name'
        },
        {
            header: 'Item',
            accessor: 'item_name',
            render: (_: any, row: AdjustmentLog) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.item_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.shade_id_label}</div>
                </div>
            )
        },
        {
            header: 'Adjustment',
            accessor: 'adjustment_type',
            render: (_: any, row: AdjustmentLog) => (
                <span style={{ 
                    color: row.adjustment_type === 'INCREASE' ? '#10b981' : '#ef4444', 
                    fontWeight: 700 
                }}>
                    {row.adjustment_type === 'INCREASE' ? '+' : '-'}{row.adjusted_qty}
                </span>
            )
        },
        {
            header: 'Before -> After',
            accessor: 'new_qty',
            render: (_: any, row: AdjustmentLog) => (
                <div style={{ color: 'var(--text-secondary)' }}>
                    {row.previous_qty} <span style={{ opacity: 0.5 }}>→</span> <strong style={{ color: 'var(--text-primary)' }}>{row.new_qty}</strong>
                </div>
            )
        },
        {
            header: 'Reason',
            accessor: 'reason'
        },
        {
            header: 'Actions',
            accessor: 'id',
            sortable: false,
            render: (id: number) => (
                <button 
                    onClick={() => handleDelete(id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    title="Revert Adjustment"
                >
                    <Trash2 size={18} />
                </button>
            )
        }
    ];

    if (user?.role !== 'ADMIN' && user?.role !== 'ACCOUNTANT') {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Access Restricted. Formal Portal Only.</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <PackageMinus size={28} color="var(--brand-maroon)" /> 
                        Stock Adjustment Logs
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track manual inventory corrections and deletions.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <DataTable 
                    columns={columns} 
                    data={logs} 
                    loading={loading} 
                    emptyMessage="No manual stock adjustments found." 
                />
            </div>
        </div>
    );
};

export default AdjustmentLogs;
