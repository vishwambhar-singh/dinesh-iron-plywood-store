import React, { useState, useEffect } from 'react';
import { ShoppingCart, Receipt, Plus, Trash2, Eye, History, Trash, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SaleDetailModal from '../components/SaleDetailModal';
import { formatToDDMMYY, getLocalDateString } from '../utils/date';
import OrderHistoryModal from '../components/OrderHistoryModal';
import SearchableSelect from '../components/SearchableSelect';

const SalesTerminal = () => {
  const [panelMode, setPanelMode] = useState<'PAKKA' | 'ACTUAL'>('PAKKA');
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [advancePayment, setAdvancePayment] = useState('0');
  const [saleDate, setSaleDate] = useState(getLocalDateString());
  
  const [loading, setLoading] = useState(false);
  const [viewingSale, setViewingSale] = useState<any>(null);
  const [viewingHistory, setViewingHistory] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchAll();
  }, []);

  const fetchData = async () => {
    try {
      const [cusRes, itemRes] = await Promise.all([
        api.get('/customers'),
        api.get('/items')
      ]);
      setCustomers(cusRes.data);
      setItems(itemRes.data);
    } catch (err) {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/sales/pakka');
      setAllSales(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const addToCart = (shade: any, parentItem: any) => {
    const existing = cart.find(i => i.shade_id === shade.id);
    if (existing) {
        setCart(cart.map(i => i.shade_id === shade.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
        setCart([...cart, {
            shade_id: shade.id,
            item_name: `${parentItem.name} - ${shade.shade_id_label}`,
            category: shade.shade_category,
            qty: 1,
            pakka_price: parseFloat(shade.base_pakka_selling_rate || parentItem.base_pakka_selling_rate) || 0,
            hsn: parentItem.hsn_code,
            tax_bracket: parseFloat(parentItem.tax_bracket_percent) || 18
        }]);
    }
  };

  const removeFromCart = (shadeId: string) => {
    setCart(cart.filter(i => i.shade_id !== shadeId));
  };

  const updateCartQty = (shadeId: string, qty: string) => {
    const val = parseFloat(qty) || 0;
    setCart(cart.map(i => i.shade_id === shadeId ? { ...i, qty: val } : i));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => {
        const itemTotal = item.qty * item.pakka_price;
        const tax = itemTotal * (item.tax_bracket / 100);
        return acc + itemTotal + tax;
    }, 0);
  };

  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const handleCheckout = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    try {
      setLoading(true);
      const res = await api.post('/billing/sale', {
        customer_id: selectedCustomer.id,
        items: cart,
        advance_payment: parseFloat(advancePayment) || 0,
        sale_date: saleDate
      });
      
      const itemsFormatted = cart.map(item => {
          const price = item.pakka_price;
          const lineSubtotal = price * item.qty;
          const tax = lineSubtotal * (item.tax_bracket / 100);
          return {
              ...item,
              name: item.item_name,
              price: price,
              cgst: tax / 2,
              sgst: tax / 2,
              price_after_gst: lineSubtotal + tax
          };
      });

      setLastReceipt({ 
        ...res.data, 
        customer: selectedCustomer, 
        customer_name: selectedCustomer.name,
        sale_date: saleDate,
        items: itemsFormatted, 
        total_amount: calculateTotal() 
      });
      setCart([]);
      setSelectedCustomer(null);
      setAdvancePayment('0');
      setSaleDate(getLocalDateString());
      fetchAll();
    } catch (err) {}
    setLoading(false);
  };

  const formatMoney = (val: any) => {
    return '₹' + (parseFloat(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  // ─── PAKKA COLUMNS ───
  const pakkaColumns = [
    { header: 'Invoice #', accessor: 'invoice_number', render: (v: string) => <span style={{ fontWeight:800, fontFamily:'monospace', color: 'var(--accent-primary)' }}>{v}</span> },
    { header: 'Customer', accessor: 'customer_name_ref' },
    { header: 'Date', accessor: 'sale_date', render: (v: string) => formatToDDMMYY(v) },
    { header: 'Grand Total', accessor: 'total_amount', render: (v: number) => <span style={{ fontWeight:700 }}>{formatMoney(v)}</span> },
    { header: 'Actions', accessor: 'id', render: (_: string, row: any) => (
      <div style={{ display:'flex', gap:'12px' }}>
        <button className="primary-btn" style={{ padding:'10px 20px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'8px', height:'auto' }} onClick={() => setViewingSale(row)}>
          <FileText size={16}/> View Bill
        </button>
        <button className="primary-btn" style={{ padding:'10px 16px', fontSize:'0.85rem', background: 'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid #ef4444' }} onClick={async () => {
          if (window.confirm('Erase this invoice from the formal registry?')) {
            await api.delete(`/billing/sale/${row.id}`);
            fetchAll();
          }
        }}><Trash2 size={16}/></button>
      </div>
    )}
  ];

  return (
    <>
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <Receipt size={32} color="var(--accent-primary)" />
        <h1 style={{ fontSize:'2rem', fontWeight:800 }}>Billing Desk (Formal Registry)</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '1fr 400px', gap:'24px', marginBottom:'40px' }}>
        <div className="glass-panel" style={{ padding:'32px' }}>
            <div style={{ marginBottom:'32px' }}>
                <label style={{ display:'block', marginBottom:'12px', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>1. Select Customer</label>
                <SearchableSelect 
                    options={customers.map(c => ({ id: c.id, label: c.name, sublabel: `GST: ${c.gst_number || 'N/A'}` }))}
                    value={selectedCustomer?.name || ''}
                    onChange={(val) => setSelectedCustomer(customers.find(c => c.name === val))}
                    placeholder="Search customer by name or GST..."
                />
            </div>

            <div style={{ marginBottom:'32px' }}>
                <label style={{ display:'block', marginBottom:'12px', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>2. Inject Items to Cart</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxHeight:'400px', overflowY:'auto', paddingRight:'10px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{ padding:'16px', background:'#fff', border:'1px solid var(--border-color)', borderRadius:'12px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                                <span style={{ fontWeight:700, fontSize:'0.95rem' }}>{item.name}</span>
                                <span style={{ color:'var(--accent-primary)', fontWeight:600 }}>{formatMoney(item.base_pakka_selling_rate)}</span>
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                                {(item.shades || []).map((sh: any) => (
                                    <button 
                                        key={sh.id}
                                        onClick={() => addToCart(sh, item)}
                                        style={{ padding:'6px 12px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.1)', borderRadius:'6px', fontSize:'0.75rem', cursor:'pointer' }}
                                    >
                                        + {sh.shade_id_label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="glass-panel" style={{ padding:'32px', background:'rgba(59,130,246,0.02)', border:'1px solid rgba(59,130,246,0.1)' }}>
            <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'24px', display:'flex', alignItems:'center', gap:'10px' }}>
                <ShoppingCart size={20}/> Active Checkout
            </h2>

            <div style={{ minHeight:'300px', marginBottom:'24px' }}>
                {cart.length === 0 ? (
                    <div style={{ textAlign:'center', color:'var(--text-muted)', paddingTop:'100px' }}>Cart is empty</div>
                ) : (
                    cart.map(i => (
                        <div key={i.shade_id} style={{ display:'flex', gap:'12px', marginBottom:'16px', paddingBottom:'16px', borderBottom:'1px dashed var(--border-color)' }}>
                            <div style={{ flex:1 }}>
                                <div style={{ fontSize:'0.9rem', fontWeight:600 }}>{i.item_name}</div>
                                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{i.category} | {i.tax_bracket}% GST</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <input type="number" className="form-input" style={{ width:'60px', padding:'4px 8px' }} value={i.qty} onChange={e => updateCartQty(i.shade_id, e.target.value)} />
                                <button onClick={() => removeFromCart(i.shade_id)} style={{ color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={{ borderTop:'2px solid var(--border-color)', paddingTop:'20px' }}>
                {lastReceipt ? (
                    <div className="glass-panel" style={{ padding:'20px', background:'rgba(34,197,94,0.05)', border:'1px solid #22c55e', textAlign:'center', borderRadius:'16px' }}>
                        <CheckCircle size={48} color="#22c55e" style={{ margin:'0 auto 16px' }} />
                        <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#166534', marginBottom:'8px' }}>INVOICE GENERATED</h3>
                        <p style={{ fontSize:'0.85rem', color:'#166534', marginBottom:'20px' }}>#{lastReceipt.invoice_number} | {lastReceipt.customer.name}</p>
                        
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                            <button className="primary-btn" style={{ width:'100%', background:'#22c55e' }} onClick={() => setViewingSale(lastReceipt)}>
                                <Eye size={18}/> View & Print Bill
                            </button>
                            <button className="primary-btn" style={{ width:'100%', background:'none', border:'1px solid #22c55e', color:'#22c55e' }} onClick={() => setLastReceipt(null)}>
                                <Plus size={18}/> New Bill
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                            <span style={{ color:'var(--text-muted)' }}>Invoice Net Total:</span>
                            <span style={{ fontSize:'1.25rem', fontWeight:800 }}>{formatMoney(calculateTotal())}</span>
                        </div>
                        <div style={{ marginBottom:'24px' }}>
                            <label style={{ display:'block', marginBottom:'8px', fontSize:'0.85rem' }}>Advance Received (Optional)</label>
                            <input type="number" className="form-input" style={{ padding:'12px', fontSize:'1rem', fontWeight:600 }} value={advancePayment} onChange={e => setAdvancePayment(e.target.value)} />
                        </div>
                        <div style={{ marginBottom:'24px' }}>
                            <label style={{ display:'block', marginBottom:'8px', fontSize:'0.85rem' }}>Invoice Date</label>
                            <input type="date" className="form-input" style={{ padding:'12px', fontSize:'1rem', fontWeight:600 }} value={saleDate} onChange={e => setSaleDate(e.target.value)} />
                        </div>
                        <button 
                            className="primary-btn" 
                            disabled={loading || cart.length === 0 || !selectedCustomer}
                            onClick={handleCheckout}
                            style={{ width:'100%', height:'60px', fontSize:'1.25rem', fontWeight:800, background:'var(--accent-primary)', color:'#fff' }}
                        >
                            {loading ? 'Finalizing...' : 'GENERATE INVOICE'}
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h2 style={{ fontSize:'1.25rem', fontWeight:600 }}>Formal Sale Records</h2>
            <button 
              className="primary-btn" 
              style={{ padding:'8px 16px', background:'none', color:'var(--accent-primary)', border:'1px solid var(--accent-primary)', display:'flex', alignItems:'center', gap:'6px', height:'auto' }} 
              onClick={fetchAll}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh History
            </button>
          </div>
          <DataTable columns={pakkaColumns} data={allSales} loading={loading} />
      </div>

      <SaleDetailModal isOpen={!!viewingSale} onClose={() => setViewingSale(null)} sale={viewingSale} customerName={viewingSale?.customer_name || ''} />
      <OrderHistoryModal isOpen={!!viewingHistory} onClose={() => setViewingHistory(null)} order={viewingHistory} />
    </div>
    </>
  );
};

export default SalesTerminal;
