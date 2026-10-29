import React, { useState, useEffect } from 'react';
import { Layers, Plus, Save, Trash2, Edit3, UploadCloud, Eye } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const ItemGenerator = () => {
    const [formData, setFormData] = useState({
        name: '',
        hsn_code: '',
        base_pakka_selling_rate: '',
        base_pakka_purchase_rate: '',
        categoryBlocks: [{ category: '', shadesString: '' }]
    });

    const [items, setItems] = useState<any[]>([]);

    const [tableLoading, setTableLoading] = useState(true);
    const [status, setStatus] = useState({ loading: false, success: '', error: '' });


    // Edit & View State
    const [viewingItem, setViewingItem] = useState<any>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [editData, setEditData] = useState({ name: '', hsn_code: '', base_pakka_selling_rate: '', base_pakka_purchase_rate: '' });
    const [newShade, setNewShade] = useState({ category: '', label: '' });
    const [editStatus, setEditStatus] = useState({ loading: false, success: '', error: '' });

    const [uploadStatus, setUploadStatus] = useState({ loading: false, success: '', error: '' });

    const fetchItems = async () => {
        setTableLoading(true);
        try {
            const res = await api.get('/items');
            setItems(res.data);
        } catch (err) { }
        setTableLoading(false);
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('Delete this entire parent matrix and all its shades? This cannot be undone.')) return;
        try {
            await api.delete(`/items/${id}`);
            fetchItems();
        } catch (err) { }
    };

    const handleDeleteShade = async (shadeId: string) => {
        if (!window.confirm('Delete this specific shade/sub-item?')) return;
        try {
            await api.delete(`/items/shades/${shadeId}`);
            fetchItems();
            if (editItem) {
                setEditItem({
                    ...editItem,
                    shades: editItem.shades.filter((s: any) => s.id !== shadeId)
                });
            }
        } catch (err) { }
    };



    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, success: '', error: '' });

        try {
            const flattenedShades: any[] = [];
            formData.categoryBlocks.forEach(block => {
                if (!block.category.trim()) return;
                const shadeLabels = block.shadesString.split(/[,\n]+/).map(s => s.trim()).filter(s => s !== '');
                shadeLabels.forEach(label => {
                    flattenedShades.push({ category: block.category.trim(), label });
                });
            });

            if (flattenedShades.length === 0) {
                setStatus({ loading: false, success: '', error: 'Please add at least one category and some shades.' });
                return;
            }

            const response = await api.post('/items/generate', {
                ...formData,
                shades: flattenedShades,
                base_pakka_selling_rate: parseFloat(formData.base_pakka_selling_rate),
                base_pakka_purchase_rate: parseFloat(formData.base_pakka_purchase_rate || '0')
            });
            setStatus({ loading: false, success: response.data.message, error: '' });
            setFormData({ name: '', hsn_code: '', base_pakka_selling_rate: '', base_pakka_purchase_rate: '', categoryBlocks: [{ category: '', shadesString: '' }] });
            fetchItems();
        } catch (err: any) {
            setStatus({ loading: false, success: '', error: err.response?.data?.error || 'Generation Failed' });
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditStatus({ loading: true, success: '', error: '' });
        try {
            await api.put(`/items/${editItem.id}`, {
                ...editData,
                base_pakka_selling_rate: parseFloat(editData.base_pakka_selling_rate),
                base_pakka_purchase_rate: parseFloat(editData.base_pakka_purchase_rate)
            });
            setEditStatus({ loading: false, success: 'Item details securely updated.', error: '' });
            fetchItems();
            setEditItem({
                ...editItem, ...editData,
                base_pakka_selling_rate: parseFloat(editData.base_pakka_selling_rate),
                base_pakka_purchase_rate: parseFloat(editData.base_pakka_purchase_rate)
            });
        } catch (err: any) {
            setEditStatus({ loading: false, success: '', error: err.response?.data?.error || 'Failed to patch item' });
        }
    };

    const handleAddShadesBulk = async (e: React.FormEvent) => {
        e.preventDefault();
        const labels = newShade.label.split(/[,\n]+/).map(s => s.trim()).filter(s => s !== '');
        if (labels.length === 0 || !newShade.category) return;

        setEditStatus({ loading: true, success: '', error: '' });
        try {
            await api.post(`/items/${editItem.id}/shades/bulk`, {
                shade_category: newShade.category,
                shade_labels: labels
            });

            setEditStatus({ loading: false, success: `Successfully injected ${labels.length} shades.`, error: '' });
            setNewShade({ category: '', label: '' });
            fetchItems();
            const newEntries = labels.map(l => ({ shade_id_label: l, shade_category: newShade.category }));
            setEditItem({
                ...editItem,
                shades: [...(editItem.shades || []), ...newEntries]
            });
        } catch (err: any) {
            setEditStatus({ loading: false, success: '', error: err.response?.data?.error || 'Failed to inject bulk shades' });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadStatus({ loading: true, success: '', error: '' });
        try {
            const res = await api.post('/items/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus({ loading: false, success: res.data.message, error: '' });
            fetchItems();
        } catch (err: any) {
            setUploadStatus({ loading: false, success: '', error: err.response?.data?.error || 'Import Failed' });
        }
        e.target.value = '';
    };

    const columns = [
        { header: 'Item Name', accessor: 'name' },
        { header: 'HSN', accessor: 'hsn_code' },
        { header: 'Sell Rate', accessor: 'base_pakka_selling_rate', render: (v: string) => <span style={{ color: '#10b981', fontWeight: 600 }}>₹{v}</span> },
        { header: 'Buy Rate', accessor: 'base_pakka_purchase_rate', render: (v: string) => <span style={{ color: '#ef4444', fontWeight: 600 }}>₹{v || 0}</span> },
        {
            header: 'Shades', accessor: 'shades', render: (s: any[]) => (
                <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {s?.length || 0} Shades
                </span>
            )
        },
        {
            header: 'Actions', accessor: 'id', render: (val: any, row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="primary-btn" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setViewingItem(row)} title="View Shades">
                        <Eye size={14} />
                    </button>
                    <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => {
                        setEditItem(row);
                        setEditData({
                            name: row.name,
                            hsn_code: row.hsn_code,
                            base_pakka_selling_rate: row.base_pakka_selling_rate,
                            base_pakka_purchase_rate: row.base_pakka_purchase_rate || 0
                        });
                        setEditStatus({ loading: false, success: '', error: '' });
                        setNewShade({ category: '', label: '' });
                    }}>Edit</button>
                    <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ef4444' }} onClick={() => handleDeleteItem(val)}>Delete</button>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Layers size={28} color="var(--accent-primary)" />
                <h1 style={{ fontSize: '1.75rem' }}>Inventory Setup (Items & Shades)</h1>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Add new products and their various shades/colors here to manage stock and default rates.
            </p>

            {/* Tally Import Block */}
            <div className="glass-panel" style={{ padding: '24px', maxWidth: '800px', marginBottom: '24px', background: 'rgba(16, 185, 129, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '8px' }}><UploadCloud size={20} /> Import from Tally Excel</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Upload a Tally export file (.xls, .xlsx, .csv) to auto-generate the parent item and its shades.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFileUpload} disabled={uploadStatus.loading} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        <button className="primary-btn" style={{ background: '#10b981', color: '#fff', pointerEvents: 'none' }}>
                            {uploadStatus.loading ? 'Importing...' : 'Select File'}
                        </button>
                    </div>
                </div>
                {uploadStatus.error && <div style={{ marginTop: '12px', padding: '10px', background: 'var(--danger)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}>{uploadStatus.error}</div>}
                {uploadStatus.success && <div style={{ marginTop: '12px', padding: '10px', background: 'var(--success)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}>{uploadStatus.success}</div>}
            </div>

            {/* The Generator Form */}
            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Item Engineering Portal</h2>

                {status.error && <div style={{ padding: '12px', background: 'var(--danger)', borderRadius: '8px', color: '#fff' }}>{status.error}</div>}
                {status.success && <div style={{ padding: '12px', background: 'var(--success)', borderRadius: '8px', color: '#fff' }}>{status.success}</div>}

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Parent Item Name</label>
                    <input type="text" className="form-input" required placeholder="e.g. 0.72MM Koflam" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1.5 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>HSN Code</label>
                        <input type="text" className="form-input" required placeholder="4412" value={formData.hsn_code} onChange={e => setFormData({ ...formData, hsn_code: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Selling Rate</label>
                        <input type="number" step="0.01" className="form-input" required placeholder="180.00" value={formData.base_pakka_selling_rate} onChange={e => setFormData({ ...formData, base_pakka_selling_rate: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Purchase Rate</label>
                        <input type="number" step="0.01" className="form-input" required placeholder="150.00" value={formData.base_pakka_purchase_rate} onChange={e => setFormData({ ...formData, base_pakka_purchase_rate: e.target.value })} />
                    </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(59,130,246,0.02)' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Generate Shades Matrix</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {formData.categoryBlocks.map((block, idx) => (
                            <div key={idx} style={{ padding: '16px', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ width: '220px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sub-Category</label>
                                        <input type="text" className="form-input" placeholder="e.g. Category A" value={block.category} onChange={e => {
                                            const newBlocks = [...formData.categoryBlocks];
                                            newBlocks[idx].category = e.target.value;
                                            setFormData({ ...formData, categoryBlocks: newBlocks });
                                        }}
                                        />
                                    </div>
                                    {formData.categoryBlocks.length > 1 && (
                                        <button type="button" onClick={() => setFormData({ ...formData, categoryBlocks: formData.categoryBlocks.filter((_, i) => i !== idx) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>
                                    )}
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Shade Labels (Comma / Newline Separated)</label>
                                    <textarea className="form-input" rows={3} placeholder="101, 102, 103..." value={block.shadesString} onChange={e => {
                                        const newBlocks = [...formData.categoryBlocks];
                                        newBlocks[idx].shadesString = e.target.value;
                                        setFormData({ ...formData, categoryBlocks: newBlocks });
                                    }}
                                    />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, categoryBlocks: [...formData.categoryBlocks, { category: '', shadesString: '' }] })} style={{ padding: '12px', borderRadius: '8px', border: '2px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                            + Add Category Block
                        </button>
                    </div>
                </div>

                <button type="submit" className="primary-btn" disabled={status.loading} style={{ marginTop: '16px', background: 'var(--accent-primary)', color: '#fff' }}>
                    {status.loading ? 'Generating Matrix...' : 'Save Parent Item & Shades'}
                </button>
            </form>

            {/* The Matrix Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Master Item Registry</h2>
                </div>
                <DataTable columns={columns} data={items} loading={tableLoading} emptyMessage="No base items engineered yet." />
            </div>

            {/* View Details Modal */}
            <Modal isOpen={!!viewingItem} onClose={() => setViewingItem(null)} title="Sub-Item Stock Detail">
                {viewingItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{viewingItem.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HSN: {viewingItem.hsn_code} | Tax Bracket: {viewingItem.tax_bracket_percent}%</p>
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
                                            {Math.floor(s.available_qty || 0)} Units
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>

            {/* Edit Item Modal */}
            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title={`Matrix Engineering: ${editItem?.name}`}>
                {editStatus.error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{editStatus.error}</div>}
                {editStatus.success && <div style={{ background: 'var(--success)', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{editStatus.success}</div>}

                <form onSubmit={handleUpdateItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Item Name</label>
                            <input type="text" required className="form-input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>HSN</label>
                            <input type="text" required className="form-input" value={editData.hsn_code} onChange={e => setEditData({ ...editData, hsn_code: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Selling Rate</label>
                            <input type="number" step="0.01" required className="form-input" value={editData.base_pakka_selling_rate} onChange={e => setEditData({ ...editData, base_pakka_selling_rate: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Purchase Rate</label>
                            <input type="number" step="0.01" required className="form-input" value={editData.base_pakka_purchase_rate} onChange={e => setEditData({ ...editData, base_pakka_purchase_rate: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="primary-btn" disabled={editStatus.loading}>Update Master Details</button>
                </form>

                <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700 }}>Sub-Item / Shade Matrix</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    {(editItem?.shades || []).map((sh: any, idx: number) => (
                        <div key={idx} style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 700 }}>{sh.shade_id_label}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '10px' }}>{sh.shade_category}</span>
                            </div>
                            <button type="button" style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleDeleteShade(sh.id)}><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddShadesBulk} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(59,130,246,0.05)', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Bulk Inject Shades</h4>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ width: '180px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem' }}>Category</label>
                            <input type="text" className="form-input" placeholder="Category A" value={newShade.category} onChange={e => setNewShade({ ...newShade, category: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem' }}>Labels (Comma separated)</label>
                            <textarea className="form-input" rows={2} value={newShade.label} onChange={e => setNewShade({ ...newShade, label: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="primary-btn">Add to Matrix</button>
                </form>
            </Modal>
        </div>
    );
};

export default ItemGenerator;
