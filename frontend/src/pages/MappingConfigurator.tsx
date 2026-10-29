import React, { useState, useEffect, useMemo } from 'react';
import { GitCompare, Save, CheckSquare, Square, Pencil, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import SearchableSelect from '../components/SearchableSelect';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

const MappingConfigurator = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'GODOWN';
  const isAllowed = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT' || user?.role === 'GODOWN';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT' || user?.role === 'GODOWN';

  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Mapping Master Tables
  const [supplierMaps, setSupplierMaps] = useState<any[]>([]);
  const [customerMaps, setCustomerMaps] = useState<any[]>([]);

  const [mode, setMode] = useState<'SUPPLIER' | 'CUSTOMER'>('CUSTOMER');

  // Bulk mapping state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  
  // For customers: { [customer_id]: { checked: boolean, actual_selling_price: string, name: string } }
  // For suppliers: { [supplier_id]: { checked: boolean, pakka_buying_rate: string, kaccha_deduction_commission: string, name: string } }
  const [bulkEntries, setBulkEntries] = useState<Record<string, any>>({});

  // Entity search & filter in Step 2
  const [entitySearch, setEntitySearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'CHECKED' | 'UNCHECKED' | 'MAPPED' | 'NEW'>('ALL');

  // Single-mapping edit modal state
  const [editingMapping, setEditingMapping] = useState<any | null>(null);
  const [editCustomerPrice, setEditCustomerPrice] = useState('');
  const [editPakkaRate, setEditPakkaRate] = useState('');
  const [editKacchaAddition, setEditKacchaAddition] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [status, setStatus] = useState({ loading: false, fetching: false, success: '', error: '' });

  const fetchCore = async () => {
    setStatus(s => ({ ...s, fetching: true }));
    try {
      const [itemsRes, supRes, cusRes, sMapsRes, cMapsRes] = await Promise.all([
        api.get('/items'),
        api.get('/suppliers'),
        api.get('/customers'),
        api.get('/mappings/supplier'),
        api.get('/mappings/customer')
      ]);
      setItems(itemsRes.data);
      setSuppliers(supRes.data);
      setCustomers(cusRes.data);
      setSupplierMaps(sMapsRes.data);
      setCustomerMaps(cMapsRes.data);
    } catch (err) {
      console.error('Failed to load mapping data', err);
    }
    setStatus(s => ({ ...s, fetching: false }));
  };

  useEffect(() => {
    fetchCore();
  }, []);

  if (!isAllowed) return <Navigate to="/" replace />;

  // When a product is selected, initialize the bulk entries table
  const initBulkEntries = (itemId: string, price: string) => {
    const entities = mode === 'CUSTOMER' ? customers : suppliers;
    const existingMaps = mode === 'CUSTOMER' ? customerMaps : supplierMaps;
    
    const entries: Record<string, any> = {};
    entities.forEach(entity => {
      const entityKey = mode === 'CUSTOMER' ? 'customer_id' : 'supplier_id';
      const existing = existingMaps.find(m => m[entityKey] === entity.id && m.item_id === itemId);
      
      if (mode === 'CUSTOMER') {
        entries[entity.id] = {
          checked: !!existing,
          actual_selling_price: existing ? String(existing.actual_selling_price) : price,
          name: entity.name
        };
      } else {
        entries[entity.id] = {
          checked: !!existing,
          pakka_buying_rate: existing ? String(existing.pakka_buying_rate) : price,
          kaccha_deduction_commission: existing ? String(existing.kaccha_deduction_commission) : '0',
          name: entity.name
        };
      }
    });
    setBulkEntries(entries);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setStatus(s => ({ ...s, error: '', success: '' }));
    setEntitySearch('');
    setFilterTab('ALL');
    if (!itemId) {
      setBulkEntries({});
      setDefaultPrice('');
      return;
    }
    const item = items.find(i => i.id === itemId);
    const price = mode === 'CUSTOMER' 
      ? String(item?.base_pakka_selling_rate || '') 
      : String(item?.base_pakka_purchase_rate || '');
    setDefaultPrice(price);
    initBulkEntries(itemId, price);
  };

  const handleDefaultPriceChange = (price: string) => {
    setDefaultPrice(price);
    // Apply to all unmapped (new) entries only
    const updated = { ...bulkEntries };
    const existingMaps = mode === 'CUSTOMER' ? customerMaps : supplierMaps;
    Object.keys(updated).forEach(id => {
      const entityKey = mode === 'CUSTOMER' ? 'customer_id' : 'supplier_id';
      const hasExisting = existingMaps.some(m => m[entityKey] === id && m.item_id === selectedItemId);
      if (!hasExisting) {
        if (mode === 'CUSTOMER') {
          updated[id].actual_selling_price = price;
        } else {
          updated[id].pakka_buying_rate = price;
        }
      }
    });
    setBulkEntries(updated);
  };

  const applyDefaultToAll = () => {
    if (!defaultPrice) return;
    setBulkEntries(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (mode === 'CUSTOMER') {
          updated[id].actual_selling_price = defaultPrice;
        } else {
          updated[id].pakka_buying_rate = defaultPrice;
        }
        updated[id].checked = true;
      });
      return updated;
    });
  };

  const applyDefaultToChecked = () => {
    if (!defaultPrice) return;
    setBulkEntries(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id].checked) {
          if (mode === 'CUSTOMER') {
            updated[id].actual_selling_price = defaultPrice;
          } else {
            updated[id].pakka_buying_rate = defaultPrice;
          }
        }
      });
      return updated;
    });
  };

  const toggleCheck = (entityId: string) => {
    setBulkEntries(prev => ({
      ...prev,
      [entityId]: { ...prev[entityId], checked: !prev[entityId].checked }
    }));
  };

  const handleBulkSave = async () => {
    const checkedEntries = Object.entries(bulkEntries).filter(([_, val]) => val.checked);
    if (checkedEntries.length === 0) {
      setStatus(s => ({ ...s, error: 'Please select at least one entity to map.', success: '' }));
      return;
    }

    setStatus(s => ({ ...s, loading: true, error: '', success: '' }));
    try {
      if (mode === 'CUSTOMER') {
        const mappings = checkedEntries.map(([customer_id, data]) => ({
          customer_id,
          actual_selling_price: parseFloat(data.actual_selling_price) || 0
        }));
        await api.post('/mappings/customer/bulk', { item_id: selectedItemId, mappings });
      } else {
        const mappings = checkedEntries.map(([supplier_id, data]) => ({
          supplier_id,
          pakka_buying_rate: parseFloat(data.pakka_buying_rate) || 0,
          kaccha_deduction_commission: parseFloat(data.kaccha_deduction_commission) || 0
        }));
        await api.post('/mappings/supplier/bulk', { item_id: selectedItemId, mappings });
      }
      setStatus({ loading: false, fetching: false, success: `${checkedEntries.length} mappings saved successfully!`, error: '' });
      await fetchCore();
      setSelectedItemId('');
      setBulkEntries({});
      setDefaultPrice('');
    } catch (err: any) {
      setStatus({ loading: false, fetching: false, success: '', error: err.response?.data?.error || 'Bulk save failed' });
    }
  };

  // Re-init when mode changes
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId);
      const price = mode === 'CUSTOMER' 
        ? String(item?.base_pakka_selling_rate || '') 
        : String(item?.base_pakka_purchase_rate || '');
      setDefaultPrice(price);
      initBulkEntries(selectedItemId, price);
    } else {
      setBulkEntries({});
    }
    setStatus(s => ({ ...s, error: '', success: '' }));
  }, [mode, customerMaps, supplierMaps]);

  // Saved mappings filtered to the currently selected product
  const savedMappingsForProduct = useMemo(() => {
    if (!selectedItemId) return mode === 'SUPPLIER' ? supplierMaps : customerMaps;
    if (mode === 'SUPPLIER') return supplierMaps.filter(m => m.item_id === selectedItemId);
    return customerMaps.filter(m => m.item_id === selectedItemId);
  }, [selectedItemId, mode, supplierMaps, customerMaps]);

  // Open Direct Edit Modal for a single mapping row
  const handleOpenEditModal = (row: any) => {
    setEditingMapping(row);
    setEditError('');
    if (mode === 'CUSTOMER') {
      setEditCustomerPrice(String(row.actual_selling_price || ''));
    } else {
      setEditPakkaRate(String(row.pakka_buying_rate || ''));
      setEditKacchaAddition(String(row.kaccha_deduction_commission || '0'));
    }
  };

  // Save Direct Edit
  const handleSaveDirectEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapping) return;

    setEditSaving(true);
    setEditError('');
    try {
      if (mode === 'CUSTOMER') {
        const price = parseFloat(editCustomerPrice);
        if (isNaN(price) || price < 0) {
          setEditError('Please enter a valid actual selling price.');
          setEditSaving(false);
          return;
        }
        await api.put(`/mappings/customer/${editingMapping.id}`, {
          actual_selling_price: price
        });
      } else {
        const pakka = parseFloat(editPakkaRate);
        const kaccha = parseFloat(editKacchaAddition);
        if (isNaN(pakka) || pakka < 0) {
          setEditError('Please enter a valid Pakka buying rate.');
          setEditSaving(false);
          return;
        }
        await api.put(`/mappings/supplier/${editingMapping.id}`, {
          pakka_buying_rate: pakka,
          kaccha_deduction_commission: isNaN(kaccha) ? 0 : kaccha
        });
      }

      setStatus(s => ({ ...s, success: 'Mapping updated successfully!', error: '' }));
      setEditingMapping(null);
      await fetchCore();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update mapping.');
    } finally {
      setEditSaving(false);
    }
  };

  // Calculate counts for Step 2
  const entityKey = mode === 'CUSTOMER' ? 'customer_id' : 'supplier_id';
  const existingMaps = mode === 'CUSTOMER' ? customerMaps : supplierMaps;

  const totalCount = Object.keys(bulkEntries).length;
  const checkedCount = Object.values(bulkEntries).filter(e => e.checked).length;
  const mappedCount = Object.keys(bulkEntries).filter(id => 
    existingMaps.some(m => m[entityKey] === id && m.item_id === selectedItemId)
  ).length;
  const newCount = totalCount - mappedCount;

  // Filtered entries for Step 2 table
  const filteredEntries = useMemo(() => {
    const query = entitySearch.toLowerCase().trim();
    return Object.entries(bulkEntries).filter(([entityId, entry]) => {
      const matchesSearch = !query || entry.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      const hasExisting = existingMaps.some(m => m[entityKey] === entityId && m.item_id === selectedItemId);
      if (filterTab === 'CHECKED') return entry.checked;
      if (filterTab === 'UNCHECKED') return !entry.checked;
      if (filterTab === 'MAPPED') return hasExisting;
      if (filterTab === 'NEW') return !hasExisting;
      return true;
    });
  }, [bulkEntries, entitySearch, filterTab, existingMaps, entityKey, selectedItemId]);

  const toggleFilteredAll = (select: boolean) => {
    setBulkEntries(prev => {
      const updated = { ...prev };
      filteredEntries.forEach(([id]) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], checked: select };
        }
      });
      return updated;
    });
  };

  // --- Saved mappings table columns ---
  const suppColumns = [
    { header: 'Target Item', accessor: 'item_name', render: (v: string, row: any) => (
      <div>
        <span style={{ fontWeight: 600 }}>{v}</span>
        {row.hsn_code && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>HSN: {row.hsn_code}</span>}
      </div>
    )},
    { header: 'Vendor Identity', accessor: 'supplier_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { header: 'Pakka Buying Rate', accessor: 'pakka_buying_rate', render: (v: number) => <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(v || 0).toFixed(2)}</span> },
    { header: 'Kaccha Addition', accessor: 'kaccha_deduction_commission', render: (v: number) => <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+ ₹{Number(v || 0).toFixed(2)}</span> },
    ...(canEdit ? [{ header: 'Actions', accessor: 'id', render: (val: string, row: any) => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          className="primary-btn" 
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
          onClick={() => handleOpenEditModal(row)}
        >
          <Pencil size={12} /> Edit
        </button>
        {isAdmin && (
          <button 
            className="primary-btn" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ef4444' }} 
            onClick={async () => {
              if (window.confirm(`Delete supplier mapping for ${row.supplier_name} - ${row.item_name}?`)) {
                await api.delete(`/mappings/supplier/${val}`);
                fetchCore();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    )}] : [])
  ];

  const custColumns = [
    { header: 'Target Item', accessor: 'item_name', render: (v: string, row: any) => (
      <div>
        <span style={{ fontWeight: 600 }}>{v}</span>
        {row.hsn_code && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>HSN: {row.hsn_code}</span>}
      </div>
    )},
    { header: 'Base Pakka Rate', accessor: 'base_pakka_selling_rate', render: (v: number) => `₹${Number(v || 0).toFixed(2)}` },
    { header: 'Customer Entity', accessor: 'customer_name', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { header: 'Actual Selling Price', accessor: 'actual_selling_price', render: (v: number) => <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>₹{Number(v || 0).toFixed(2)}</span> },
    ...(canEdit ? [{ header: 'Actions', accessor: 'id', render: (val: string, row: any) => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          className="primary-btn" 
          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
          onClick={() => handleOpenEditModal(row)}
        >
          <Pencil size={12} /> Edit
        </button>
        {isAdmin && (
          <button 
            className="primary-btn" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ef4444' }} 
            onClick={async () => {
              if (window.confirm(`Delete customer mapping for ${row.customer_name} - ${row.item_name}?`)) {
                await api.delete(`/mappings/customer/${val}`);
                fetchCore();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    )}] : [])
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <GitCompare size={28} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '1.75rem' }}>Price Mappings</h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage custom Godown selling prices for customers and custom buying rates for suppliers.
      </p>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => { setMode('CUSTOMER'); setSelectedItemId(''); setBulkEntries({}); setDefaultPrice(''); setStatus({ loading:false, fetching: false, error:'', success:'' })}} 
          className={mode === 'CUSTOMER' ? 'primary-btn' : 'glass-panel'}
          style={mode !== 'CUSTOMER' ? { padding: '12px 24px', cursor: 'pointer', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'transparent' } : { padding: '12px 24px' }}
        >
          Customer Rates ({customerMaps.length} mapped)
        </button>
        <button 
          onClick={() => { setMode('SUPPLIER'); setSelectedItemId(''); setBulkEntries({}); setDefaultPrice(''); setStatus({ loading:false, fetching: false, error:'', success:'' })}} 
          className={mode === 'SUPPLIER' ? 'primary-btn' : 'glass-panel'}
          style={mode !== 'SUPPLIER' ? { padding: '12px 24px', cursor: 'pointer', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'transparent' } : { padding: '12px 24px' }}
        >
          Supplier Rates ({supplierMaps.length} mapped)
        </button>
      </div>

      {status.error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{status.error}</span>
        </div>
      )}
      {status.success && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{status.success}</span>
        </div>
      )}

      {/* Step 1: Select Product + Default Price */}
      {canEdit && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Step 1 — Select Product & Default Rate
            </h2>
            {selectedItemId && (
              <button
                onClick={() => handleItemSelect('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={14} /> Clear Selection
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 2fr) minmax(200px, 1fr) auto', gap: '16px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                Target Item / Product
              </label>
              <SearchableSelect
                options={items.map(i => ({ id: i.id, label: `${i.name} (HSN: ${i.hsn_code || 'N/A'}) — Base: ₹${mode === 'CUSTOMER' ? (i.base_pakka_selling_rate || 0) : (i.base_pakka_purchase_rate || 0)}` }))}
                value={selectedItemId}
                onChange={(val) => handleItemSelect(val)}
                placeholder="-- Search & Select a Product --"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                {mode === 'CUSTOMER' ? 'Default Actual Selling Price (₹)' : 'Default Pakka Buy Rate (₹)'}
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input" 
                value={defaultPrice} 
                onChange={e => handleDefaultPriceChange(e.target.value)} 
                placeholder="0.00"
                disabled={!selectedItemId}
              />
            </div>

            {selectedItemId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={applyDefaultToChecked}
                  disabled={!defaultPrice || checkedCount === 0}
                  style={{ padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                  title="Apply default rate to all checked rows"
                >
                  Apply to Checked ({checkedCount})
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={applyDefaultToAll}
                  disabled={!defaultPrice}
                  style={{ padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  title="Apply default rate to all entities and check them"
                >
                  Apply to All ({totalCount})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Bulk entity assignment table */}
      {selectedItemId && canEdit && totalCount > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Step 2 — Assign {mode === 'CUSTOMER' ? 'Customers' : 'Suppliers'}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginLeft: '12px' }}>
                  ({checkedCount} of {totalCount} selected)
                </span>
              </h2>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button"
                className="primary-btn" 
                style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                onClick={() => toggleFilteredAll(filteredEntries.some(([_, e]) => !e.checked))}
              >
                {filteredEntries.every(([_, e]) => e.checked) ? 'Deselect Filtered' : 'Select Filtered'}
              </button>
              <button 
                type="button"
                className="primary-btn" 
                style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }} 
                onClick={handleBulkSave}
                disabled={status.loading || checkedCount === 0}
              >
                <Save size={16} />
                {status.loading ? 'Saving...' : `Save ${checkedCount} Mapping${checkedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {/* Search bar & filter pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
                placeholder={`Search ${mode === 'CUSTOMER' ? 'customer' : 'supplier'} by name...`}
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
              />
              {entitySearch && (
                <button
                  onClick={() => setEntitySearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['ALL', 'CHECKED', 'UNCHECKED', 'MAPPED', 'NEW'] as const).map(tab => {
                const count = tab === 'ALL' ? totalCount
                  : tab === 'CHECKED' ? checkedCount
                  : tab === 'UNCHECKED' ? totalCount - checkedCount
                  : tab === 'MAPPED' ? mappedCount
                  : newCount;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterTab(tab)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid ' + (filterTab === tab ? 'var(--accent-primary)' : 'var(--border-color)'),
                      background: filterTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: filterTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: filterTab === tab ? 700 : 500
                    }}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ maxHeight: '460px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '50px' }}>
                    <button 
                      onClick={() => toggleFilteredAll(filteredEntries.some(([_, e]) => !e.checked))} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      {filteredEntries.length > 0 && filteredEntries.every(([_, e]) => e.checked) 
                        ? <CheckSquare size={18} color="var(--accent-primary)" /> 
                        : <Square size={18} color="var(--text-muted)" />}
                    </button>
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {mode === 'CUSTOMER' ? 'Customer Name' : 'Supplier Name'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '180px' }}>
                    {mode === 'CUSTOMER' ? 'Actual Selling Price' : 'Pakka Buying Rate'}
                  </th>
                  {mode === 'SUPPLIER' && (
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '160px' }}>
                      Kaccha Addition
                    </th>
                  )}
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', width: '100px' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={mode === 'SUPPLIER' ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No matching {mode === 'CUSTOMER' ? 'customers' : 'suppliers'} found.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(([entityId, entry]) => {
                    const hasExisting = existingMaps.some(m => m[entityKey] === entityId && m.item_id === selectedItemId);
                    
                    return (
                      <tr 
                        key={entityId} 
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          background: entry.checked 
                            ? 'rgba(59,130,246,0.06)' 
                            : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <button onClick={() => toggleCheck(entityId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            {entry.checked 
                              ? <CheckSquare size={18} color="var(--accent-primary)" /> 
                              : <Square size={18} color="var(--text-muted)" />}
                          </button>
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.9rem' }}>{entry.name}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              className="form-input" 
                              style={{ width: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
                              value={mode === 'CUSTOMER' ? entry.actual_selling_price : entry.pakka_buying_rate}
                              onChange={e => {
                                const val = e.target.value;
                                setBulkEntries(prev => ({
                                  ...prev,
                                  [entityId]: {
                                    ...prev[entityId],
                                    ...(mode === 'CUSTOMER' ? { actual_selling_price: val } : { pakka_buying_rate: val }),
                                    checked: true
                                  }
                                }));
                              }}
                            />
                          </div>
                        </td>
                        {mode === 'SUPPLIER' && (
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>+ ₹</span>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-input" 
                                style={{ width: '110px', padding: '6px 10px', fontSize: '0.85rem' }}
                                value={entry.kaccha_deduction_commission}
                                onChange={e => {
                                  setBulkEntries(prev => ({
                                    ...prev,
                                    [entityId]: { ...prev[entityId], kaccha_deduction_commission: e.target.value, checked: true }
                                  }));
                                }}
                              />
                            </div>
                          </td>
                        )}
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: hasExisting ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.12)',
                            color: hasExisting ? '#10b981' : 'var(--text-muted)'
                          }}>
                            {hasExisting ? 'MAPPED' : 'NEW'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saved Mappings Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Saved {mode === 'CUSTOMER' ? 'Customer' : 'Supplier'} Mappings ({savedMappingsForProduct.length})
            </h2>
            {selectedItemId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
                  Filtered: {items.find(i => i.id === selectedItemId)?.name || 'Selected Item'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItemId('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Show All Products
                </button>
              </div>
            )}
          </div>
        </div>

        <DataTable 
          columns={mode === 'SUPPLIER' ? suppColumns : custColumns} 
          data={savedMappingsForProduct} 
          loading={status.fetching} 
          emptyMessage={`No ${mode.toLowerCase()} mappings ${selectedItemId ? 'found for this product' : 'configured yet'}.`} 
        />
      </div>

      {/* Direct Edit Mapping Modal */}
      <Modal
        isOpen={!!editingMapping}
        onClose={() => setEditingMapping(null)}
        title={mode === 'CUSTOMER' ? 'Edit Customer Price Mapping' : 'Edit Supplier Price Mapping'}
        maxWidth="480px"
      >
        {editingMapping && (
          <form onSubmit={handleSaveDirectEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {editError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                {editError}
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Target Item</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.95rem' }}>{editingMapping.item_name}</p>
                {editingMapping.hsn_code && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HSN: {editingMapping.hsn_code}</span>}
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {mode === 'CUSTOMER' ? 'Customer' : 'Supplier'}
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.95rem' }}>
                  {mode === 'CUSTOMER' ? editingMapping.customer_name : editingMapping.supplier_name}
                </p>
              </div>
              {mode === 'CUSTOMER' && editingMapping.base_pakka_selling_rate !== undefined && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Base Pakka Rate: ₹{Number(editingMapping.base_pakka_selling_rate || 0).toFixed(2)}
                </div>
              )}
            </div>

            {mode === 'CUSTOMER' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                  Actual Selling Price (Godown Rate)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    value={editCustomerPrice}
                    onChange={e => setEditCustomerPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  This rate is used for actual internal billing and godown accounting for this customer.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                    Pakka Buying Rate
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '28px' }}
                      value={editPakkaRate}
                      onChange={e => setEditPakkaRate(e.target.value)}
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                    Kaccha Addition (Commission / Surcharge)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', fontWeight: 600 }}>+ ₹</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '34px' }}
                      value={editKacchaAddition}
                      onChange={e => setEditKacchaAddition(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="primary-btn"
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                onClick={() => setEditingMapping(null)}
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={editSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {editSaving ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MappingConfigurator;
