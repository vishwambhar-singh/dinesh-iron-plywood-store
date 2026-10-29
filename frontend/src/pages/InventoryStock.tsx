import { useState, useEffect } from 'react';
import { RefreshCw, Eye, Edit3, Edit } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import AdjustStockModal from '../components/AdjustStockModal';

const InventoryStock = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  // Modal state
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [editingRates, setEditingRates] = useState<any>(null);
  const [newRates, setNewRates] = useState({ selling: '', purchase: '' });
  const [submitting, setSubmitting] = useState(false);
  const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const [adjustingShade, setAdjustingShade] = useState<any>(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/items/${editingRates.id}`, {
        name: editingRates.name,
        hsn_code: editingRates.hsn_code,
        base_pakka_selling_rate: Number(newRates.selling),
        base_pakka_purchase_rate: Number(newRates.purchase)
      });
      setEditingRates(null);
      fetchStock();
    } catch (err) {}
    setSubmitting(false);
  };



  const formatMoney = (val: any) => {
    return '₹' + (parseFloat(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const columns = [
    { header: 'Item Name', accessor: 'name' },
    { header: 'HSN Code', accessor: 'hsn_code' },
    { 
      header: 'Selling Price', 
      accessor: 'base_pakka_selling_rate', 
      render: (v: any) => <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMoney(v)}</span>
    },
    { 
      header: 'Purchase Price', 
      accessor: 'base_pakka_purchase_rate', 
      render: (v: any) => <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatMoney(v)}</span>
    },
    { header: 'Tax Bracket', accessor: 'tax_bracket_percent', render: (v: number) => `${v}%` },
    { header: 'Net Stock', accessor: 'id', render: (_: any, row: any) => {
        const sum = (row.shades || []).reduce((acc: number, cur: any) => acc + parseFloat(cur.available_qty), 0);
        return (
            <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: sum > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: sum > 0 ? '#10b981' : '#ef4444',
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {Math.floor(sum)} Units
              </span>
        );
    }},
    { header: 'Actions', accessor: 'id', render: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
                style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    background: 'white', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }} 
                onClick={() => setViewingItem(row)}
                title="View Details"
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
                <Eye size={13} />
            </button>
            <button 
                style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '0 12px', 
                    height: '32px', 
                    borderRadius: '6px', 
                    border: '1px solid #3b82f6', 
                    background: 'rgba(59, 130, 246, 0.05)', 
                    color: '#3b82f6', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }} 
                onClick={() => {
                    setEditingRates(row);
                    setNewRates({ selling: row.base_pakka_selling_rate, purchase: row.base_pakka_purchase_rate || 0 });
                }}
                onMouseEnter={(e) => { 
                    e.currentTarget.style.background = '#3b82f6'; 
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.25)';
                }}
                onMouseLeave={(e) => { 
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; 
                    e.currentTarget.style.color = '#3b82f6';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <Edit3 size={13} /> Rates
            </button>
        </div>
    )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Inventory Stock Registry</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Centralized inventory ledger and rate management.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="primary-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={fetchStock}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Standard Product Matrix</h2>
        </div>
        <DataTable columns={columns} data={items} loading={loading} emptyMessage="No inventory nodes detected." />
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!viewingItem} onClose={() => setViewingItem(null)} title="Sub-Item Stock Detail">
        {viewingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{viewingItem.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HSN: {viewingItem.hsn_code} | Tax: {viewingItem.tax_bracket_percent}%</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Shade / ID</th>
                                <th style={{ padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Physical Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(viewingItem.shades || []).map((s: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{s.shade_id_label}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{s.shade_category}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: s.available_qty <= 0 ? '#ef4444' : '#10b981' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                            {Math.floor(s.available_qty)} Units
                                            {isFormalUser && (
                                                <button 
                                                    onClick={() => setAdjustingShade({ ...s, item_name: viewingItem.name })}
                                                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                    title="Adjust Stock"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Edit Rates Modal */}
      <Modal isOpen={!!editingRates} onClose={() => setEditingRates(null)} title="Update Item Rates">
          <form onSubmit={handleUpdateRates} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(59,130,246,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>{editingRates?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HSN: {editingRates?.hsn_code}</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Selling Rate (Pakka)</label>
                      <input type="number" step="0.01" required className="form-input" value={newRates.selling} onChange={e => setNewRates({...newRates, selling: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Purchase Rate (Pakka)</label>
                      <input type="number" step="0.01" required className="form-input" value={newRates.purchase} onChange={e => setNewRates({...newRates, purchase: e.target.value})} />
                  </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: Changing these rates will update the default price for all future invoices.</p>
              <button type="submit" className="primary-btn" disabled={submitting} style={{ background: 'var(--accent-primary)', color: '#fff' }}>{submitting ? 'Updating...' : 'Save Changes'}</button>
          </form>
      </Modal>

      {adjustingShade && (
          <AdjustStockModal 
              isOpen={!!adjustingShade}
              onClose={() => setAdjustingShade(null)}
              shadeId={adjustingShade.id}
              itemName={adjustingShade.item_name}
              shadeLabel={adjustingShade.shade_id_label}
              currentQty={adjustingShade.available_qty}
              onSuccess={() => {
                  fetchStock();
                  setAdjustingShade(null);
                  setViewingItem(null);
              }}
          />
      )}
    </div>
  );
};

export default InventoryStock;
