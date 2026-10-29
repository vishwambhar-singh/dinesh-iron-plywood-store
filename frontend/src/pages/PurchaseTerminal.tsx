import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, CheckCircle, Truck, X, ArrowRight, Search, Eye, History } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PurchaseOrderPDF } from '../components/PurchaseOrderPDF';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import ReturnModal from '../components/ReturnModal';
import OrderHistoryModal from '../components/OrderHistoryModal';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import { useAuthStore } from '../store/useAuthStore';
import SearchableSelect from '../components/SearchableSelect';
import { formatToDDMMYY, getLocalDateString } from '../utils/date';



const PurchaseTerminal = () => {
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [cart, setCart] = useState<{shade_id: string, item_id: string, qty: number, custom_pakka_rate: number, shade_label: string, item_name: string}[]>([]);


  const [selectedItem, setSelectedItem] = useState('');
  const [selectedShade, setSelectedShade] = useState('');
  const [qty, setQty] = useState(1);
  const [customRate, setCustomRate] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [poLoading, setPOLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billDate, setBillDate] = useState(getLocalDateString());
  const [ledgerTab, setLedgerTab] = useState<'PAKKA' | 'ACTUAL'>('PAKKA');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isFormalUser = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const [viewingPO, setViewingPO] = useState<any>(null);
  const [processingReturn, setProcessingReturn] = useState<any>(null);
  const [viewingHistory, setViewingHistory] = useState<{id: string, number: string} | null>(null);


  const [advancePayment, setAdvancePayment] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // New Dispatch Details State
  const [billingAddress, setBillingAddress] = useState('');
  const [supplierGst, setSupplierGst] = useState('');
  const [dispatchThrough, setDispatchThrough] = useState('');
  const [gstType, setGstType] = useState('LOCAL');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setPOLoading(true);
    try {
      const [itemsRes, supRes, poRes] = await Promise.all([
        api.get('/items'),
        api.get('/suppliers'),
        api.get('/billing/purchases')
      ]);
      setItems(itemsRes.data);
      setSuppliers(supRes.data);
      setPurchaseOrders(poRes.data);
    } catch (err) {}
    setPOLoading(false);
  };

  const activeItemData = items.find(i => i.id === selectedItem);
  const activeShadeData = activeItemData?.shades?.find((s: any) => s.id === selectedShade);

  useEffect(() => {
    // Auto-fill rate: Priority to selected shade, then parent item, then empty
    if (activeShadeData) {
        const rate = activeShadeData.base_pakka_purchase_rate || activeItemData.base_pakka_purchase_rate;
        setCustomRate(rate);
    } else if (activeItemData) {
        const rate = activeItemData.base_pakka_purchase_rate;
        // DEBUG ALERT
        if (selectedItem) {
           alert("DEBUG: Item " + activeItemData.name + " Buying Rate from DB is: " + rate);
        }
        setCustomRate(rate);
    } else {
        setCustomRate('');
    }
  }, [activeItemData, selectedShade]);


  const handleAddToCart = () => {
    if (!selectedItem || !selectedShade || qty <= 0 || customRate === '') return;
    const targetShade = activeItemData.shades.find((s: any) => s.id === selectedShade);
    setCart([...cart, {
      shade_id: selectedShade, item_id: selectedItem, qty,
      custom_pakka_rate: Number(customRate),
      shade_label: targetShade.shade_id_label,
      item_name: activeItemData.name
    }]);
    setSelectedShade('');
    setQty(1);
  };

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const handleCreatePO = async () => {
    const total = cart.reduce((s, c) => s + (c.custom_pakka_rate * c.qty), 0);
    if (!supplierId || cart.length === 0) return;
    if (Number(advancePayment) > total) {
      setError(`Advance payment (₹${advancePayment}) cannot exceed total bill amount (₹${total}).`);
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/billing/purchase', { 
        supplier_id: supplierId, 
        items: cart,
        advance_payment: advancePayment || 0,
        payment_method: paymentMethod,
        bill_date: billDate,
        billing_address: billingAddress,
        supplier_gst: supplierGst,
        dispatch_through: dispatchThrough,
        gst_type: gstType
      });
      const activeSup = suppliers.find(s => s.id === supplierId);
      setLastReceipt({ ...res.data, supplier_name: activeSup?.name, items: [...cart], total_amount: total });
      setCart([]); setSupplierId(''); setAdvancePayment('');
      setBillDate(getLocalDateString());
      setBillingAddress('');
      setSupplierGst('');
      setDispatchThrough('');
      setGstType('LOCAL');
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'PO Creation Failed');
    } finally { setLoading(false); }
  };

  const handleFulfill = async (billId: string) => {
    if (!window.confirm('Mark this PO as fulfilled? This will increment physical stock and commit to dual ledgers.')) return;
    try {
      await api.put(`/billing/purchase/${billId}/fulfill`);
      setSuccess('Purchase Order fulfilled! Stock updated.');
      fetchAll();
    } catch (err: any) { setError(err.response?.data?.error || 'Fulfillment Failed'); }
  };

  const handleDownloadPDF = async (po: any) => {
    const blob = await pdf(<PurchaseOrderPDF po={po} supplierName={po.supplier_name} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_${po.bill_number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatMoney = (val: any) => {
    const num = Math.abs(parseFloat(val) || 0);
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
        maximumFractionDigits: 2
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.custom_pakka_rate * c.qty), 0);



  // ─── COLUMNS ──────────
  const pakkaColumns = [
    { header: 'PO Number', accessor: 'bill_number', render: (v: string, _row: any) => (
      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: v.startsWith('RET-') ? '#ef4444' : 'inherit' }}>{v}</span>
    )},
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Date', accessor: 'bill_date', render: (v: string) => formatToDDMMYY(v) },
    { header: 'Total', accessor: 'total_amount', render: (v: number) => <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatMoney(v)}</span> },
    { header: 'Paid', accessor: 'amount_paid', render: (v: number) => <span style={{ color:'#10b981', fontWeight:600 }}>{formatMoney(v)}</span> },
    { header: 'Balance', accessor: 'balance_amount', render: (v: number) => <span style={{ color: parseFloat(String(v)) > 0 ? '#ef4444' : '#10b981', fontWeight:600 }}>{formatMoney(v)}</span> },
    { header: 'Status', accessor: 'status', render: (v: string, row: any) => {
      if (row.bill_number?.startsWith('RET-')) return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>RETURN INVOICE</span>;
      if (v === 'RETURNED') return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>RETURNED (MODIFIED)</span>;
      return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: v === 'FULFILLED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: v === 'FULFILLED' ? '#10b981' : '#f59e0b' }}>{v}</span>;
    }},
    { header: 'Actions', accessor: 'id', render: (val: string, row: any) => (
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setViewingPO(row)}><Eye size={14} style={{ marginRight: '4px' }} />View</button>
        <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--text-muted)' }} onClick={() => setViewingHistory(row)}>
          <History size={13}/> History
        </button>
        {row.status === 'PENDING' && <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981' }} onClick={() => handleFulfill(val)}>Fulfill</button>}
        {row.status === 'FULFILLED' && <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.7rem', background: 'rgba(59,130,246,0.15)', color: '#2563eb', border: '1px solid #3b82f6' }} onClick={() => handleDownloadPDF(row)}>PDF</button>}
        <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.7rem', background: '#ef4444' }} onClick={async () => {
          if (window.confirm('Delete this purchase record?')) {
            await api.delete(`/billing/purchase/${row.id}`);
            fetchAll();
          }
        }}>Delete</button>
      </div>

    )}
  ];

  const actualColumns = [
    { header: 'PO Number', accessor: 'bill_number', render: (v: string, _row: any) => (
      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: v.startsWith('RET-') ? '#ef4444' : 'inherit' }}>{v}</span>
    )},
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Date', accessor: 'bill_date', render: (v: string) => formatToDDMMYY(v) },
    { header: 'Pakka Total', accessor: 'total_amount', render: (v: number) => <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatMoney(v)}</span> },
    { header: 'Actual (Godown)', accessor: 'actual_total', render: (v: number) => <span style={{ fontWeight: 700, color: '#f59e0b' }}>{formatMoney(v)}</span> },
    { header: 'Status', accessor: 'status', render: (v: string, row: any) => {
      if (row.bill_number?.startsWith('RET-')) return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>RETURN INVOICE</span>;
      if (v === 'RETURNED') return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>RETURNED (MODIFIED)</span>;
      return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: v === 'FULFILLED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: v === 'FULFILLED' ? '#10b981' : '#f59e0b' }}>{v}</span>;
    }},
    { header: 'Actions', accessor: 'id', render: (_: string, row: any) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setViewingPO(row)}><Eye size={14} style={{ marginRight: '4px' }} />View</button>
          <button className="primary-btn" style={{ padding:'6px 12px', fontSize:'0.7rem', background: 'var(--text-muted)' }} onClick={() => setViewingHistory(row)}>
            <History size={13}/> History
          </button>
        </div>
      )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Truck size={28} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '1.75rem' }}>Purchase Terminal</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Create purchase orders against mapped suppliers. Stock only updates upon fulfillment.
      </p>

      {error && <div style={{ background: 'var(--danger)', color: '#fff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.875rem' }}>{error}</div>}
      {success && <div style={{ background: 'var(--success)', color: '#fff', padding: '14px 20px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.875rem' }}>{success}</div>}

      {/* ─── PO CREATION FORM ─── */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.875rem', fontWeight: 600 }}>Target Supplier Vendor</label>
            <SearchableSelect 
              options={suppliers.map(s => ({ id: s.id, label: s.name, sublabel: s.gstNumber ? `GST: ${s.gstNumber}` : '' }))}
              value={supplierId}
              onChange={(val) => {
                  setSupplierId(val);
                  const s = suppliers.find(sup => sup.id === val);
                  if (s) {
                      setBillingAddress(s.address || '');
                      setSupplierGst(s.gstNumber || s.gst_number || '');
                  }
              }}
              placeholder="-- Choose Mapped Supplier --"
            />
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Dispatch & Billing Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dispatched From Address</label>
                    <textarea className="form-input" rows={2} value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Full dispatch address..." style={{ resize: 'none' }}></textarea>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supplier GSTIN</label>
                        <input type="text" className="form-input" value={supplierGst} onChange={e => setSupplierGst(e.target.value)} placeholder="07AAAAA0000A1Z5" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>GST Type</label>
                        <select className="form-input" value={gstType} onChange={e => setGstType(e.target.value)}>
                            <option value="LOCAL">Local (CGST + SGST)</option>
                            <option value="INTERSTATE">Interstate (IGST)</option>
                            <option value="NONE">None / Cash</option>
                        </select>
                    </div>
                </div>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dispatched Through (Transport)</label>
                <input type="text" className="form-input" value={dispatchThrough} onChange={e => setDispatchThrough(e.target.value)} placeholder="e.g. Navkar Transport, Vehicle No..." />
            </div>
          </div>



          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Add Line Items</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inventory Item</label>
                <SearchableSelect 
                  options={items.map(i => ({ id: i.id, label: i.name, sublabel: `HSN: ${i.hsn_code}` }))}
                  value={selectedItem}
                  onChange={(val) => { setSelectedItem(val); setSelectedShade(''); }}
                  placeholder="-- Select Product --"
                />
              </div>


              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Physical Shade</label>
                <SearchableSelect 
                  options={(activeItemData?.shades || []).map((s: any) => ({ 
                    id: s.id, 
                    label: s.shade_id_label, 
                    sublabel: `Stock: ${Math.floor(s.available_qty)}` 
                  }))}
                  value={selectedShade}
                  onChange={setSelectedShade}
                  placeholder="-- Shade --"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Override Pakka Rate</label>
                <input type="number" step="0.01" className="form-input" value={customRate} onChange={e => setCustomRate(Number(e.target.value))} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty</label>
                <input type="number" min={1} className="form-input" value={qty} onChange={e => setQty(Number(e.target.value))} />
              </div>
              <button className="primary-btn" onClick={handleAddToCart} disabled={!selectedItem || !selectedShade || customRate === ''} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="glass-panel" style={{ flex: 1, padding: '24px', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ShoppingCart size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>PO Cart</h3>
            <span style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', marginLeft: 'auto' }}>{cart.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem' }}>No items added yet</p>
              </div>
            ) : cart.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.item_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{c.shade_label} &middot; {c.qty} units @ ₹{c.custom_pakka_rate}</p>
                </div>
                <button onClick={() => removeFromCart(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            ))}
          </div>
          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimated Pakka Total</span>
                <span style={{ fontWeight: 700 }}>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', gap:'8px', marginTop:'12px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.7rem', color:'var(--text-muted)' }}>Advance (₹)</label>
                  <input type="number" min="0" max={cartTotal} step="0.01" className="form-input" style={{ padding:'8px', fontSize:'0.8rem' }} placeholder={`Max: ₹${cartTotal.toFixed(2)}`} value={advancePayment} onChange={e => {
                      const val = Number(e.target.value);
                      if (val > cartTotal) {
                        setError(`Advance payment cannot exceed the total bill amount (₹${cartTotal.toFixed(2)}).`);
                        setAdvancePayment(cartTotal);
                      } else {
                        setError('');
                        setAdvancePayment(val);
                      }
                  }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.7rem', color:'var(--text-muted)' }}>Method</label>
                  <select className="form-input" style={{ padding:'8px', fontSize:'0.8rem' }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap:'8px', marginTop:'8px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.7rem', color:'var(--text-muted)' }}>Bill Date</label>
                  <input type="date" className="form-input" style={{ padding:'8px', fontSize:'0.8rem' }} value={billDate} onChange={e => setBillDate(e.target.value)} />
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0' }}>GST and deductions computed on submit via relationship mappings.</p>
            </div>
          )}
          {lastReceipt ? (
            <div className="glass-panel" style={{ padding:'20px', background:'rgba(59,130,246,0.05)', border:'1px solid var(--accent-primary)', textAlign:'center', borderRadius:'16px', marginTop:'auto' }}>
                <CheckCircle size={48} color="var(--accent-primary)" style={{ margin:'0 auto 16px' }} />
                <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--accent-primary)', marginBottom:'8px' }}>PURCHASE LOGGED</h3>
                <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'20px' }}>#{lastReceipt.bill_number} | {lastReceipt.supplier_name}</p>
                
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    <button className="primary-btn" style={{ width:'100%' }} onClick={() => setViewingPO(lastReceipt)}>
                        <Eye size={18}/> View PO Detail
                    </button>
                    <button className="primary-btn" style={{ width:'100%', background:'none', border:'1px solid var(--accent-primary)', color:'var(--accent-primary)' }} onClick={() => setLastReceipt(null)}>
                        <Plus size={18}/> New Purchase
                    </button>
                </div>
            </div>
          ) : (
            <button className="primary-btn" onClick={handleCreatePO} disabled={cart.length === 0 || !supplierId || loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '0.95rem', marginTop: 'auto' }}>
              {loading ? 'Saving...' : <><ArrowRight size={18} /> Save Purchase Order</>}
            </button>
          )}

        </div>
      </div>

      {/* ─── PURCHASE ORDER REGISTRY WITH DUAL TABS ─── */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Purchase History</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Pakka / Actual Tab Toggle */}
            {isAdmin && (
              <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setLedgerTab('PAKKA')}
                  style={{
                    padding: '8px 20px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: ledgerTab === 'PAKKA' ? 'var(--accent-primary)' : 'transparent',
                    color: ledgerTab === 'PAKKA' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Pakka
                </button>
                <button
                  onClick={() => setLedgerTab('ACTUAL')}
                  style={{
                    padding: '8px 20px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: ledgerTab === 'ACTUAL' ? '#f59e0b' : 'transparent',
                    color: ledgerTab === 'ACTUAL' ? '#000' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  Godown
                </button>
              </div>
            )}

           </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderTop: ledgerTab === 'ACTUAL' ? '3px solid #f59e0b' : '3px solid var(--accent-primary)' }}>
          <DataTable
            columns={ledgerTab === 'PAKKA' ? pakkaColumns : actualColumns}
            data={purchaseOrders}
            loading={poLoading}
            emptyMessage="No purchase orders found."
          />
        </div>

      {/* PO Detail Modal */}
      <PurchaseDetailModal
        isOpen={!!viewingPO}
        onClose={() => setViewingPO(null)}
        purchase={viewingPO}
        supplierName={viewingPO?.supplier_name || ''}
        onRefresh={fetchAll}
        onProcessReturn={(po) => setProcessingReturn(po)}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={!!processingReturn}
        onClose={() => setProcessingReturn(null)}
        sale={processingReturn}
        customerName={processingReturn?.supplier_name || ''}
        type="purchase"
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={!!viewingHistory}
        onClose={() => setViewingHistory(null)}
        order={viewingHistory}
      />
    </div>
  );
};

export default PurchaseTerminal;
