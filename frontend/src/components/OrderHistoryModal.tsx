import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import DataTable from './DataTable';
import { formatToDDMMYY } from '../utils/date';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, order }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const orderId = order?.id;
    const orderNumber = order?.invoice_number || order?.bill_number || '';
    const totalAmount = parseFloat(order?.total_amount || 0);
    const amountPaid = parseFloat(order?.amount_paid || 0);
    const balance = parseFloat(order?.balance || order?.balance_amount || 0);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchHistory();
        }
    }, [isOpen, orderId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/cashbook/order-history/${orderId}`);
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch order history", err);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Date', accessor: 'transaction_date', render: (val: string) => formatToDDMMYY(val) },
        {
            header: 'Type', accessor: 'type', render: (val: string) => (
                <span style={{
                    background: val === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: val === 'INCOME' ? '#10b981' : '#ef4444',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                }}>{val}</span>
            )
        },
        { header: 'Description', accessor: 'description' },
        { header: 'Method', accessor: 'payment_method' },
        {
            header: 'Amount', accessor: 'amount', render: (val: string, row: any) => (
                <span style={{ fontWeight: 'bold', color: row.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                    ₹{parseFloat(val).toFixed(2)}
                </span>
            )
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payment History - ${orderNumber}`} maxWidth="800px">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Amount</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>₹{totalAmount.toFixed(2)}</p>
                </div>
                <div className="glass-panel" style={{ padding: '12px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>₹{amountPaid.toFixed(2)}</p>
                </div>
                <div className="glass-panel" style={{ padding: '12px', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Balance</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>₹{balance.toFixed(2)}</p>
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Transaction Breakdown</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Detailed list of all payments/refunds for this order.</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '12px' }}>
                <DataTable 
                    columns={columns} 
                    data={history} 
                    loading={loading} 
                    emptyMessage="No payment history found for this order." 
                />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="primary-btn" onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
};

export default OrderHistoryModal;
