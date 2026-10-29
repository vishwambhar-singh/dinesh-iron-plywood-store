import React, { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';

interface AdjustStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    shadeId: string;
    itemName: string;
    shadeLabel: string;
    currentQty: number;
    onSuccess: () => void;
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ isOpen, onClose, shadeId, itemName, shadeLabel, currentQty, onSuccess }) => {
    const [quantity, setQuantity] = useState('');
    const [type, setType] = useState<'INCREASE' | 'DECREASE'>('DECREASE');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!quantity || parseFloat(quantity) <= 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason for this adjustment.');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/items/adjustments`, {
                shade_id: shadeId,
                quantity: parseFloat(quantity),
                type,
                reason
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to adjust stock.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manual Stock Adjustment">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{itemName}</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Shade: {shadeLabel}</p>
                    <div style={{ marginTop: '12px', fontSize: '0.95rem' }}>
                        Current Godown Stock: <strong style={{ color: 'var(--brand-green)' }}>{currentQty}</strong>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '12px', background: 'var(--danger)', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Adjustment Type</label>
                        <select 
                            className="form-input" 
                            value={type} 
                            onChange={(e) => setType(e.target.value as any)}
                        >
                            <option value="DECREASE">Decrease Stock (-)</option>
                            <option value="INCREASE">Increase Stock (+)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Quantity</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            className="form-input" 
                            placeholder="0.00" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)} 
                            required
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Reason for Adjustment</label>
                    <textarea 
                        className="form-input" 
                        placeholder="e.g., Damaged during transport, Missing from godown, etc." 
                        rows={3}
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        required
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={onClose} className="primary-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-btn" disabled={loading} style={{ background: type === 'INCREASE' ? '#10b981' : '#ef4444', color: '#fff', minWidth: '120px' }}>
                        {loading ? 'Processing...' : 'Confirm Adjustment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AdjustStockModal;
