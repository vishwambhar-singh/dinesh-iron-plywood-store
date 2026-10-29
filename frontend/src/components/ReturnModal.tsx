import { useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import api from '../utils/api';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
    customerName: string;
    type: 'sale' | 'purchase';
}

interface ReturnItem {
    shade_id: string;
    item_name: string;
    shade_label?: string;
    shade_code: string;
    original_qty: number;
    return_qty: number;
    price: number;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, sale, type }) => {
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [refundAmount, setRefundAmount] = useState('');
    const [refundMethod, setRefundMethod] = useState('CREDIT_NOTE');
    const [refundDescription, setRefundDescription] = useState('');

    useEffect(() => {
        if (isOpen && sale) {
            const rawItems = sale.items || [];
            const fetchedItems = rawItems.map((i: any) => ({
                shade_id: i.shade_id || i.id || String(Math.random()),
                item_name: i.name || i.item_name || 'Item',
                shade_label: i.shade_label || i.shade_id_label || '',
                shade_code: i.shade_code || i.shade_id_label || i.hsn || '-',
                original_qty: Math.max(1, Math.floor(parseFloat(i.qty || i.received_qty || 1))),
                return_qty: 0,
                price: parseFloat(i.price_after_gst || i.price || 0) / Math.max(1, parseFloat(i.qty || i.received_qty || 1))
            }));
            setItems(fetchedItems);
            setLoading(false);
        }
    }, [isOpen, sale, type]);

    useEffect(() => {
        if (!isOpen) {
            setItems([]);
            setRefundAmount('');
            setRefundMethod('CREDIT_NOTE');
            setRefundDescription('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const handleReturnQtyChange = (shade_id: string, value: string) => {
        const val = parseInt(value) || 0;
        setItems(items.map(item => {
            if (item.shade_id === shade_id) {
                return { ...item, return_qty: Math.max(0, Math.min(val, item.original_qty)) };
            }
            return item;
        }));
    };

    const returnItems = items.filter(i => i.return_qty > 0);
    const totalReturnQty = returnItems.reduce((sum, i) => sum + i.return_qty, 0);
    const autoRefund = returnItems.reduce((sum, i) => sum + (i.return_qty * i.price), 0);

    useEffect(() => {
        if (autoRefund > 0) setRefundAmount(autoRefund.toFixed(2));
        else setRefundAmount('');
    }, [autoRefund]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setReturning(true);

    try {
      const payload = {
        [type === 'sale' ? 'sale_id' : 'bill_id']: sale.id,
        returned_shades: returnItems.map(item => ({
          shade_id: item.shade_id,
          qty: item.return_qty
        })),
        refund_amount: autoRefund,
        refund_method: refundMethod,
        refund_description: refundDescription || `${type === 'sale' ? 'Credit' : 'Debit'} Note issued`
      };

      const endpoint = type === 'sale' ? '/billing/credit-note/sale' : '/billing/debit-note/purchase';
      await api.post(endpoint, payload);

      setSuccess(`${type === 'sale' ? 'Credit' : 'Debit'} note processed successfully`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Processing failed');
    } finally {
      setReturning(false);
    }
  };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
            padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'auto',
                padding: '32px', position: 'relative',
                background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: 'none'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {type === 'sale' ? 'Credit' : 'Debit'} Note
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 600 }}>
                                {type === 'sale' ? 'Invoice' : 'PO'}: {sale?.invoice_number || sale?.bill_number || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
                {success && <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} />{success}</div>}

                <div style={{ marginBottom: '20px', padding: '0', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Item Description</th>
                                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Price</th>
                                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Billed Qty</th>
                                <th style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', width: '130px' }}>Return Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading items...</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.shade_id} style={{ borderTop: '1px solid #e2e8f0', background: item.return_qty > 0 ? 'rgba(16, 185, 129, 0.05)' : '#fff', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px', color: '#1e293b' }}>
                                        <div style={{ fontWeight: 700 }}>
                                            {item.item_name} {item.shade_label ? `(${item.shade_label})` : ''}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{item.shade_code}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontWeight: 500 }}>₹{item.price.toFixed(2)}</td>
                                    <td style={{ padding: '16px', color: '#334155', textAlign: 'center', fontWeight: 700 }}>{item.original_qty}</td>
                                    <td style={{ padding: '16px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.original_qty}
                                            value={item.return_qty === 0 ? '' : item.return_qty}
                                            onChange={e => handleReturnQtyChange(item.shade_id, e.target.value)}
                                            placeholder="0"
                                            style={{
                                                width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                                background: '#fff', color: '#1e293b', textAlign: 'center', fontWeight: 700
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && !loading && (
                                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No items found in this bill.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Refund Method</label>
                        <select
                            value={refundMethod}
                            onChange={e => setRefundMethod(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontWeight: 500 }}
                        >
                            <option value="CREDIT_NOTE">{type === 'sale' ? 'Credit Note' : 'Debit Note'}</option>
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>
                    <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Notes / Description</label>
                        <input
                            type="text"
                            value={refundDescription}
                            onChange={e => setRefundDescription(e.target.value)}
                            placeholder="Reason for return..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', fontWeight: 500 }}
                        />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Total Refund Amount</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>₹{autoRefund.toFixed(2)}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={returning || totalReturnQty === 0}
                        style={{
                            padding: '12px 28px',
                            borderRadius: '10px',
                            border: 'none',
                            background: totalReturnQty === 0 ? '#cbd5e1' : '#10b981',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: totalReturnQty === 0 ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {returning ? 'Processing...' : `Confirm ${type === 'sale' ? 'Credit' : 'Debit'} Note`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnModal;