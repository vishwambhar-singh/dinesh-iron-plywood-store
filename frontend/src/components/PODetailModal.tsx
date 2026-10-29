import React, { useState, useEffect } from 'react';
import { X, Printer, PackageCheck, Edit3, Check, FileText, Save, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import pdsLogo from '../assets/pds_logo.png';
import formalLogo from '../assets/LOGO.png';
import SearchableSelect from './SearchableSelect';

interface PODetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: any;
    supplierName: string;
    onFulfill?: (id: string) => void;
    isActual?: boolean;
    onProcessReturn?: (po: any) => void;
    showActualTab?: boolean;
    initialEditMode?: boolean;
    onRefresh?: () => void;
}

import { formatToDDMMYY } from '../utils/date';

const PODetailModal: React.FC<PODetailModalProps> = ({ isOpen, onClose, po, supplierName, onFulfill, isActual = false, initialEditMode = false, onRefresh }) => {
    const [settings, setSettings] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable state
    const [editBillNo, setEditBillNo] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editItems, setEditItems] = useState<any[]>([]);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    useEffect(() => {
        if (po) {
            setEditBillNo(po.bill_number);
            setEditDate(po.bill_date ? po.bill_date.split('T')[0] : '');
            setIsEditing(initialEditMode);
            
            // Map items for editing
            const mapped = (po.items || []).map((i: any) => ({
                shade_id: i.shade_id,
                item_name: i.name || i.item_name,
                category: i.shade_category,
                qty: parseFloat(i.received_qty || i.qty) || 0,
                pakka_price: isActual ? (i.actual_price || i.price) : i.price,
                price: i.price,
                actual_price: i.actual_price,
                hsn: i.hsn,
                tax_bracket: Number(i.price) > 0 ? ((Number(i.gst_amount || 0) / (Number(i.price) * Number(i.qty || i.received_qty))) * 100) : 18,
                shade_label: i.shade_label || i.shade_id_label || ''
            }));
            setEditItems(mapped);
        }
        
        const fetchDeps = async () => {
            try {
                const [sRes, iRes] = await Promise.all([
                    api.get('/settings/variables'),
                    api.get('/items')
                ]);
                const sMap: any = {};
                sRes.data.forEach((s: any) => { sMap[s.key] = s.value; });
                setSettings(sMap);
                setAllItems(iRes.data);
            } catch(e) {}
        };
        if (isOpen) fetchDeps();
    }, [po, isOpen, initialEditMode, isActual]);

    useKeyboardShortcuts({
        'Escape': onClose
    });

    if (!isOpen || !po) return null;

    const formatMoney = (val: any) => {
        const num = Math.abs(parseFloat(val) || 0);
        return '₹' + num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleSave = async () => {
        if (!window.confirm('Save changes? This will recalculate stock and ledger balances.')) return;
        try {
            setSaving(true);
            await api.put(`/billing/purchase/${po.id}/full`, {
                bill_number: editBillNo,
                bill_date: editDate,
                items: editItems.map(item => ({
                    ...item,
                    price: isActual ? item.price : item.pakka_price,
                    actual_price: isActual ? item.pakka_price : item.actual_price
                }))
            });
            setIsEditing(false);
            if (onRefresh) onRefresh();
            onClose();
        } catch (err) {
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editItems];
        newItems[index][field] = value;
        setEditItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...editItems];
        newItems.splice(index, 1);
        setEditItems(newItems);
    };

    const addNewItem = (parent: any, shade: any) => {
        setEditItems([...editItems, {
            shade_id: shade.id,
            item_name: parent.name,
            category: shade.shade_category,
            qty: 1,
            pakka_price: parseFloat(shade.base_pakka_purchase_rate || parent.base_pakka_purchase_rate) || 0,
            price: parseFloat(shade.base_pakka_purchase_rate || parent.base_pakka_purchase_rate) || 0,
            actual_price: parseFloat(shade.base_pakka_purchase_rate || parent.base_pakka_purchase_rate) || 0,
            hsn: parent.hsn_code,
            tax_bracket: parseFloat(parent.tax_bracket_percent) || 18,
            shade_label: shade.shade_id_label
        }]);
        setItemSearch('');
    };

    const calcSubtotal = () => editItems.reduce((acc, item) => acc + (item.qty * item.pakka_price), 0);
    const calcTax = () => editItems.reduce((acc, item) => acc + (item.qty * item.pakka_price * (item.tax_bracket / 100 || 0)), 0);
    const calcGrandTotal = () => calcSubtotal() + calcTax();

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const accentColor = isActual ? '#f59e0b' : '#2b6cb0';
        const cName = isActual ? 'PDS' : (settings.pakka_company_name || 'PLY DECORE SALES');
        const cLogo = isActual ? pdsLogo : formalLogo;

        const rows = (po.items || []).map((item: any) => {
            const price = isActual ? (item.actual_price || item.price) : item.price;
            const total = isActual ? (item.actual_line_total || (item.received_qty * price)) : item.price_after_gst;
            const shade = item.shade_label || item.shade_id_label || '';

            return `
                <tr>
                    <td>${item.name || item.item_name} ${shade ? `(${shade})` : ''}</td>
                    <td style="text-align:center">${parseFloat(item.received_qty || item.qty)}</td>
                    <td style="text-align:right">₹${parseFloat(price).toFixed(2)}</td>
                    <td style="text-align:right">₹${parseFloat(total).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const totalAmt = isActual ? (po.actual_total || po.net_godown_total) : po.total_amount;
        const printFormat = settings.default_print_format || 'STANDARD';
        const isCompact = printFormat === 'COMPACT';

        printWindow.document.write(`
            <html><head><title>${isActual ? 'Procurement Note' : 'Purchase Order'} #${po.bill_number}</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                @page {
                    size: A4 portrait;
                    margin: 8mm 10mm;
                }
                @media print {
                    html, body {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #fff !important;
                        height: 100% !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .bill-container {
                        border: 2px solid ${accentColor} !important;
                        box-sizing: border-box !important;
                        min-height: 275mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        page-break-inside: avoid;
                    }
                }
                body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;background:#fff;padding:${isCompact ? '10px' : '15px'}}
                .bill-container{
                    border: 2px solid ${accentColor}; 
                    padding: ${isCompact ? '12px' : '18px'}; 
                    box-sizing: border-box;
                    min-height: calc(100vh - 30px); 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: space-between;
                    position: relative;
                }
                .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${isCompact ? '8px' : '12px'};border-bottom:1.5px solid ${accentColor};padding-bottom:${isCompact ? '6px' : '8px'}}
                .header h1{font-size:${isCompact ? '16px' : '20px'};color:${accentColor};margin-bottom:2px}
                .header-left { flex: 1; }
                .header-right { text-align: right; }
                .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:${isCompact ? '6px' : '10px'};margin-bottom:${isCompact ? '8px' : '12px'}}
                .info-block label{display:block;font-size:8px;color:#4a5568;text-transform:uppercase;font-weight:700;letter-spacing:.5px;margin-bottom:1px}
                .info-block span{font-size:${isCompact ? '10px' : '11px'};font-weight:600}
                table{width:100%;border-collapse:collapse;margin-bottom:${isCompact ? '8px' : '12px'};border: 1px solid #cbd5e1;}
                th{background:#f8fafc;padding:${isCompact ? '4px 6px' : '6px 8px'};text-align:left;font-size:9.5px;font-weight:700;text-transform:uppercase;color:#475569;border-bottom:1.5px solid #cbd5e1;border-right: 1px solid #cbd5e1;}
                td{padding:${isCompact ? '4px 6px' : '5px 8px'};font-size:${isCompact ? '9px' : '10px'};border-bottom:1px solid #f1f5f9;border-right: 1px solid #cbd5e1;}
                th:last-child, td:last-child{border-right: none;}
                .totals-section{display:flex;justify-content:space-between;align-items:flex-start;margin-top:auto;}
                .totals{width: 40%; margin-left: auto;}
                .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:${isCompact ? '10px' : '11px'}}
                .grand{border-top:1.5px solid ${accentColor};padding-top:4px;margin-top:2px;font-size:${isCompact ? '12px' : '13px'};font-weight:700;color:${accentColor};display:flex;justify-content:space-between;}
                .footer{text-align:center;margin-top:${isCompact ? '6px' : '10px'};font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px}
                .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; z-index: -1; width: 250px; pointer-events: none; }
            </style></head><body>
            <div class="bill-container">
              <div>
                <div class="watermark">
                    ${cLogo ? `<img src="${cLogo}" style="width:100%;" />` : ''}
                </div>
                <div class="header">
                    <div>
                        ${cLogo ? '<img src="' + cLogo + '" style="max-height: ' + (isCompact ? '40px' : '50px') + '; margin-bottom: 6px;" />' : ''}
                        <h1>${cName}</h1>
                        <p style="font-size:${isCompact ? '10px' : '11px'}; color:#475569; margin-bottom: 2px;">${isActual ? 'Internal Procurement System' : 'Formal Vendor Registry'}</p>
                    </div>
                    <div style="text-align:right">
                        <h3>${isActual ? 'Procurement Note' : 'Purchase Order'}</h3>
                        <p style="font-size:${isCompact ? '12px' : '14px'};font-weight:bold;">#${po.bill_number}</p>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-block"><label>Supplier / Vendor</label><span>${supplierName}</span></div>
                    <div class="info-block"><label>Transaction Date</label><span>${formatToDDMMYY(po.bill_date)}</span></div>
                    <div class="info-block"><label>Reference</label><span>${po.voucher_no || '-'}</span></div>
                </div>
                <table>
                    <thead><tr>
                        <th>Item Description</th>
                        <th style="text-align:center">Quantity</th>
                        <th style="text-align:right">Unit Rate</th>
                        <th style="text-align:right">Line Total</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
              </div>
              <div>
                <div class="totals-section">
                    <div class="totals">
                        <div class="grand"><span>Grand Total</span><span>${formatMoney(totalAmt)}</span></div>
                    </div>
                </div>
                <div class="footer">
                    ${isActual ? 'PDS Internal Procurement Document' : 'Computer Generated Purchase Record'}
                </div>
              </div>
            </div>
            <script>window.print();</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                width: '100%', maxWidth: '1150px', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ padding: '32px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #fff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', background: isActual ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActual ? '#f59e0b' : '#2563eb' }}>
                            {isActual ? <FileText size={24}/> : <PackageCheck size={24}/>}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                                {isActual ? 'PDS | Godown Purchase Record' : 'Purchase Order Master Matrix'}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                {isEditing ? (
                                    <input 
                                        value={editBillNo} 
                                        onChange={e => setEditBillNo(e.target.value)}
                                        style={{ padding: '4px 8px', border: '1px solid var(--accent-primary)', borderRadius: '6px', fontSize: '1rem', fontWeight: 700 }}
                                    />
                                ) : (
                                    <>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>#{po.bill_number}</span>
                                        {!isActual && <button onClick={() => setIsEditing(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent-primary)', opacity: 0.6 }}><Edit3 size={14}/></button>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', color: '#64748b' }}><X size={20}/></button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Supplier / Vendor</label>
                            <p style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem' }}>
                                {supplierName || po.supplier_name || 'Direct Procurement'}
                            </p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Procurement Date</label>
                            {isEditing ? (
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                            ) : (
                                <p style={{ fontWeight: 700, color: '#334155', fontSize: '1.1rem' }}>{formatToDDMMYY(po.bill_date)}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>System Voucher</label>
                            <p style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{po.voucher_no || 'N/A'}</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: isActual ? '#f59e0b' : '#2563eb', marginBottom: '6px', letterSpacing: '0.05em' }}>Total Order Value</label>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: isActual ? '#f59e0b' : '#2563eb' }}>
                                {isEditing ? formatMoney(calcGrandTotal()) : formatMoney(isActual ? (po.actual_total || po.net_godown_total) : po.total_amount)}
                            </p>
                        </div>
                    </div>

                    <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'visible' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#475569' }}>
                                    <th style={{ padding: '16px 24px', borderTopLeftRadius: '16px' }}>Item Description</th>
                                    <th style={{ padding: '16px', textAlign: 'center' }}>Quantity</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Unit Rate</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', borderTopRightRadius: isEditing ? '0' : '16px' }}>Line Total</th>
                                    {isEditing && <th style={{ padding: '16px', textAlign: 'center', borderTopRightRadius: '16px' }}></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(isEditing ? editItems : (po.items || [])).map((item: any, i: number) => {
                                    const rawPrice = isActual ? (item.actual_price || item.price || item.pakka_price) : (item.price || item.pakka_price);
                                    const price = parseFloat(rawPrice) || 0;
                                    const qty = parseFloat(isEditing ? item.qty : (item.received_qty || item.qty));
                                    const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : (item.price_after_gst || (qty * price * (1 + (item.tax_bracket||0)/100)));
                                    const total = parseFloat(rawTotal) || 0;

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>
                                                {item.name || item.item_name} {item.shade_label ? `(${item.shade_label})` : (item.shade_id_label ? `(${item.shade_id_label})` : '')}
                                                <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.shade_label || item.shade_id_label || 'GENERAL'}</span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                                                {isEditing ? (
                                                    <input type="number" value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} style={{ width: '60px', padding: '4px' }} />
                                                ) : qty}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>
                                                {isEditing ? (
                                                    <input type="number" value={item.pakka_price || price} onChange={(e) => updateItem(i, 'pakka_price', e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                                ) : formatMoney(price)}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{formatMoney(total)}</td>
                                            {isEditing && (
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button onClick={() => removeItem(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                
                                {isEditing && (
                                    <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                                        <td colSpan={5} style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <SearchableSelect 
                                                        placeholder="+ Add an item to this purchase bill..."
                                                        options={allItems.flatMap(parent => 
                                                            (parent.shades || []).map((sh: any) => ({
                                                                id: `${parent.id}|${sh.id}`,
                                                                label: parent.name,
                                                                sublabel: sh.shade_id_label
                                                            }))
                                                        )}
                                                        value={itemSearch}
                                                        onChange={(val) => {
                                                            if (!val) return;
                                                            const [itemId, shadeId] = val.split('|');
                                                            const p = allItems.find((x: any) => x.id === itemId);
                                                            if (p) {
                                                                const s = p.shades.find((x: any) => x.id === shadeId);
                                                                if (s) addNewItem(p, s);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '32px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
                    <div style={{ marginRight: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <span style={{ width: '8px', height: '8px', background: isActual ? '#f59e0b' : '#3b82f6', borderRadius: '50%' }}></span>
                         <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            {isActual ? 'Godown Entry Verified' : 'Formal Order Registry Locked'}
                         </span>
                    </div>

                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel Edit</button>
                            <button disabled={saving} onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}>
                                <Save size={18}/> {saving ? 'Saving...' : 'Save Purchase Updates'}
                            </button>
                        </>
                    ) : (
                        <>
                            {onFulfill && po.status === 'PENDING' && (
                                <button onClick={() => onFulfill(po.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <PackageCheck size={18}/> Fulfill Stock Entry
                                </button>
                            )}
                            <button onClick={onClose} style={{ padding: '12px 28px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Close View</button>
                            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 40px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <Printer size={20}/> Print Order Note
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PODetailModal;
