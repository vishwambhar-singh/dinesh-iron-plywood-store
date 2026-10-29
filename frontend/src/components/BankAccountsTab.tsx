import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from './Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

const BankAccountsTab = ({ panelMode = 'PAKKA' }: { panelMode?: 'PAKKA' | 'ACTUAL' }) => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const defaultForm = {
        bank_name: '',
        account_name: '',
        account_number: '',
        ifsc_code: '',
        branch: '',
        opening_balance_pakka: '0',
        opening_balance_actual: '0'
    };
    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/bank-accounts');
            setAccounts(res.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/bank-accounts/${editingId}`, formData);
            } else {
                await api.post('/bank-accounts', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            fetchAccounts();
        } catch (e) {
            alert('Failed to save bank account');
        }
    };

    const handleEdit = (acc: any) => {
        setFormData({
            bank_name: acc.bank_name,
            account_name: acc.account_name,
            account_number: acc.account_number,
            ifsc_code: acc.ifsc_code || '',
            branch: acc.branch || '',
            opening_balance_pakka: acc.opening_balance_pakka?.toString() || '0',
            opening_balance_actual: acc.opening_balance_actual?.toString() || '0'
        });
        setEditingId(acc.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure? This will unlink transactions associated with this bank account.")) return;
        try {
            await api.delete(`/bank-accounts/${id}`);
            fetchAccounts();
        } catch (e) {
            alert('Failed to delete bank account');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Managed Bank Accounts</h2>
                <button className="primary-btn" onClick={() => { setFormData(defaultForm); setEditingId(null); setIsModalOpen(true); }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Bank Account
                </button>
            </div>

            {loading ? (
                <div>Loading accounts...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {accounts.map(acc => (
                        <div key={acc.id} className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{acc.bank_name}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleEdit(acc)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(acc.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>A/c Name:</strong> {acc.account_name}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>A/c No:</strong> {acc.account_number}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>IFSC:</strong> {acc.ifsc_code}</p>
                            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Opening:</span> <strong>₹{parseFloat(acc.opening_balance_pakka).toFixed(2)}</strong></div>
                                {panelMode === 'ACTUAL' && <div><span style={{ color: 'var(--text-muted)' }}>Opening Actual:</span> <strong>₹{parseFloat(acc.opening_balance_actual).toFixed(2)}</strong></div>}
                            </div>
                        </div>
                    ))}
                    {accounts.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No bank accounts added yet.</div>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Bank Account" : "Add Bank Account"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="form-label">Bank Name</label>
                        <input type="text" required className="form-input" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} placeholder="e.g. ICICI Bank" />
                    </div>
                    <div>
                        <label className="form-label">Account Name</label>
                        <input type="text" required className="form-input" value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} placeholder="e.g. ABC Corp Ltd" />
                    </div>
                    <div>
                        <label className="form-label">Account Number</label>
                        <input type="text" required className="form-input" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">IFSC Code</label>
                            <input type="text" className="form-input" value={formData.ifsc_code} onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Branch</label>
                            <input type="text" className="form-input" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Opening Balance (Pakka)</label>
                            <input type="number" step="0.01" className="form-input" value={formData.opening_balance_pakka} onChange={e => setFormData({ ...formData, opening_balance_pakka: e.target.value })} />
                        </div>
                        {panelMode === 'ACTUAL' && (
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Opening Balance (Actual)</label>
                                <input type="number" step="0.01" className="form-input" value={formData.opening_balance_actual} onChange={e => setFormData({ ...formData, opening_balance_actual: e.target.value })} />
                            </div>
                        )}
                    </div>
                    <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>{editingId ? "Update Account" : "Save Account"}</button>
                </form>
            </Modal>
        </div>
    );
};

export default BankAccountsTab;
