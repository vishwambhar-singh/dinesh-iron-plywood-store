import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import { Search, Package, Edit } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLocation } from 'react-router-dom';
import AdjustStockModal from './AdjustStockModal';

interface InventoryQuickSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchableItem {
    id: string; // shade id
    item_id: string;
    item_name: string;
    item_code: string;
    category: string;
    shade_label: string;
    qty: number;
    price: number;
    actual_price: number;
    location: string;
}

const InventoryQuickSearch: React.FC<InventoryQuickSearchProps> = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const locationRouter = useLocation();
    
    // Determine context for prices
    const actualPaths = ['/actual', '/actual-billing', '/actual-cashbook', '/mappings'];
    const isActualMode = actualPaths.some(p => locationRouter.pathname.startsWith(p)) || user?.role === 'GODOWN';

    const [items, setItems] = useState<SearchableItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [adjustingShade, setAdjustingShade] = useState<SearchableItem | null>(null);

    const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

    const fetchInventory = () => {
        setLoading(true);
        api.get('/items')
            .then(res => {
                const flattened: SearchableItem[] = [];
                res.data.forEach((item: any) => {
                    if (item.shades && item.shades.length > 0) {
                        item.shades.forEach((shade: any) => {
                            flattened.push({
                                id: shade.id,
                                item_id: item.id,
                                item_name: item.name || '',
                                item_code: item.hsn_code || '',
                                category: shade.shade_category || '',
                                shade_label: shade.shade_id_label || '',
                                qty: parseFloat(shade.available_qty || 0),
                                price: parseFloat(shade.base_pakka_selling_rate || item.base_pakka_selling_rate || 0),
                                actual_price: parseFloat(shade.base_pakka_selling_rate || item.base_pakka_selling_rate || 0),
                                location: shade.location || ''
                            });
                        });
                    }
                });
                setItems(flattened);
            })
            .catch(err => console.error("Failed to load quick search inventory", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            if (items.length === 0) {
                fetchInventory();
            }
        }
    }, [isOpen, items.length]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items.slice(0, 100); // show top 100 max when empty to avoid lag
        
        const q = searchQuery.toLowerCase();
        return items.filter(item => 
            item.item_name.toLowerCase().includes(q) ||
            item.item_code.toLowerCase().includes(q) ||
            item.shade_label.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        ).slice(0, 200); // cap results
    }, [searchQuery, items]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Inventory Quick Search" maxWidth="1000px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="form-input" 
                        placeholder="Search by Item Name, Code, Shade, or Category..." 
                        style={{ paddingLeft: '48px', height: '54px', fontSize: '1.1rem', borderRadius: '12px' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading inventory...</div>
                    ) : filteredItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                            <p>No items found matching your search.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Item Details</th>
                                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Category</th>
                                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Shade / Grade</th>
                                    <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Godown Stock</th>
                                    <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid var(--border-color)' }}>Price ({isActualMode ? 'Actual' : 'Formal'})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: item.qty <= 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.item_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {item.item_code || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{item.category || '-'}</td>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.shade_label}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <span style={{ 
                                                    display: 'inline-block', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontWeight: 700,
                                                    background: item.qty > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: item.qty > 0 ? '#10b981' : '#ef4444'
                                                }}>
                                                    {item.qty}
                                                </span>
                                                {isFormalUser && (
                                                    <button 
                                                        onClick={() => setAdjustingShade(item)}
                                                        style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                        title="Adjust Stock"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                            ₹{(isActualMode ? item.actual_price : item.price).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {adjustingShade && (
                <AdjustStockModal 
                    isOpen={!!adjustingShade}
                    onClose={() => setAdjustingShade(null)}
                    shadeId={adjustingShade.id}
                    itemName={adjustingShade.item_name}
                    shadeLabel={adjustingShade.shade_label}
                    currentQty={adjustingShade.qty}
                    onSuccess={() => {
                        fetchInventory();
                        setAdjustingShade(null);
                    }}
                />
            )}
        </Modal>
    );
};

export default InventoryQuickSearch;
