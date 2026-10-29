import React from 'react';
import { X, CheckCircle, XCircle, ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react';

interface BillChangeDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    changeRequest: any | null;
    onAccept: () => void;
    onReject: () => void;
    loading?: boolean;
}

const BillChangeDiffModal: React.FC<BillChangeDiffModalProps> = ({
    isOpen, onClose, changeRequest, onAccept, onReject, loading = false
}) => {
    if (!isOpen || !changeRequest) return null;

    const oldSnap = typeof changeRequest.old_actual_snapshot === 'string'
        ? JSON.parse(changeRequest.old_actual_snapshot)
        : changeRequest.old_actual_snapshot;

    const newSnap = typeof changeRequest.new_actual_snapshot === 'string'
        ? JSON.parse(changeRequest.new_actual_snapshot)
        : changeRequest.new_actual_snapshot;

    const isSale = changeRequest.bill_type === 'SALE';
    const billRef = changeRequest.bill_ref || newSnap?.invoice_number || newSnap?.bill_number || '—';
    const entityName = changeRequest.entity_name || newSnap?.customer_name || newSnap?.supplier_name || '—';

    const oldNet = parseFloat(oldSnap?.old_actual_net || 0);
    const newNet = parseFloat(newSnap?.new_actual_net || 0);
    const netDiff = newNet - oldNet;

    const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const oldItems = oldSnap?.items || [];
    const newItems = newSnap?.items || [];

    // Match old items with new items to correctly identify added/deleted items, especially when duplicate shades exist.
    const newToOldMatch: (number | null)[] = new Array(newItems.length).fill(null);
    const oldStillExists: boolean[] = new Array(oldItems.length).fill(false);

    const remainingOldIndices = Array.from({ length: oldItems.length }, (_, i) => i);

    for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        const matchedOldIdxIndex = remainingOldIndices.findIndex(oldIdx => oldItems[oldIdx].shade_id === newItem.shade_id);
        if (matchedOldIdxIndex !== -1) {
            const matchedOldIdx = remainingOldIndices[matchedOldIdxIndex];
            newToOldMatch[i] = matchedOldIdx;
            oldStillExists[matchedOldIdx] = true;
            remainingOldIndices.splice(matchedOldIdxIndex, 1);
        }
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{
                maxWidth: '1200px', // Wider modal for side-by-side view
                width: '95vw',
                height: 'auto',
                maxHeight: '95vh',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--panel-bg, #ffffff)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
            }}>
                {/* ─── Header ─── */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-color, #e2e8f0)',
                    background: 'linear-gradient(135deg, rgba(160, 43, 43, 0.05), rgba(248, 250, 252, 0.5))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <AlertTriangle size={20} color="var(--brand-maroon, #A02B2B)" />
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-maroon, #A02B2B)' }}>
                                Review Formal Bill Changes (Before vs After)
                            </h2>
                            <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                                background: 'rgba(160, 43, 43, 0.1)', color: 'var(--brand-maroon, #A02B2B)',
                                border: '1px solid rgba(160, 43, 43, 0.2)'
                            }}>
                                {isSale ? 'SALE' : 'PURCHASE'}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #475569)' }}>
                            Bill: <strong style={{ color: 'var(--text-primary, #1e293b)', fontFamily: 'monospace' }}>{billRef}</strong>
                            {' '} · {' '}
                            {isSale ? 'Customer' : 'Supplier'}: <strong style={{ color: 'var(--text-primary, #1e293b)' }}>{entityName}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted, #64748b)', padding: '4px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* ─── Body ─── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    
                    {/* Header comparison card */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        background: 'var(--base-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Old Actual Net</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(oldNet)}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ArrowRight size={18} color="var(--brand-maroon)" />
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                                background: netDiff > 0 ? 'rgba(239,68,68,0.1)' : netDiff < 0 ? 'rgba(19,154,81,0.1)' : 'rgba(100,100,100,0.1)',
                                color: netDiff > 0 ? 'var(--danger)' : netDiff < 0 ? 'var(--brand-green)' : 'var(--text-muted)'
                            }}>
                                {netDiff === 0 ? 'No price change' : `${netDiff > 0 ? '+' : ''}${fmt(netDiff)}`}
                            </span>
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', fontWeight: 700, textTransform: 'uppercase' }}>New Proposed Net</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-green)' }}>{fmt(newNet)}</h3>
                        </div>
                    </div>

                    {/* Dual pane layout */}
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        
                        {/* LEFT PANE: Old Bill (Before Edit) */}
                        <div style={{ flex: '1 1 48%', minWidth: '350px' }}>
                            <h4 style={{
                                margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800,
                                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                                Before Edit (Current Actual State)
                            </h4>
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color, #e2e8f0)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--base-bg, #f8fafc)', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>
                                            {['Item / Shade', 'Qty', 'Formal', 'Actual', 'Total'].map(h => (
                                                <th key={h} style={{
                                                    padding: '10px 12px', textAlign: h === 'Item / Shade' ? 'left' : 'right',
                                                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {oldItems.map((item: any, idx: number) => {
                                            const stillExists = oldStillExists[idx];
                                            const correspondingNewItem = stillExists 
                                                ? newItems.find((_: any, newIdx: number) => newToOldMatch[newIdx] === idx) 
                                                : null;
                                            
                                            // Fallbacks for older snapshot entries lacking full detail
                                            const itemName = item.name || correspondingNewItem?.name || '—';
                                            const shadeLabel = item.shade_label || correspondingNewItem?.shade_label || '';
                                            const itemQty = item.qty !== undefined && item.qty !== null ? parseFloat(item.qty) : (correspondingNewItem ? parseFloat(correspondingNewItem.qty) : 0);
                                            const formalPrice = item.price !== undefined && item.price !== null ? parseFloat(item.price) : (correspondingNewItem ? parseFloat(correspondingNewItem.price) : 0);
                                            
                                            const total = itemQty * (item.actual_price || 0);

                                            return (
                                                <tr key={idx} style={{
                                                    borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                                    background: !stillExists ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                                    textDecoration: !stillExists ? 'line-through' : 'none',
                                                    color: !stillExists ? 'var(--text-muted)' : 'var(--text-primary)'
                                                }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{itemName}</div>
                                                        {shadeLabel && (
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                                {shadeLabel}
                                                            </div>
                                                        )}
                                                        {!stillExists && (
                                                            <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', fontWeight: 700, marginLeft: '4px', textDecoration: 'none', display: 'inline-block' }}>DELETED</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600 }}>{itemQty}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{formalPrice.toFixed(2)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600 }}>₹{(item.actual_price || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                        {oldItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No items in original bill.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* RIGHT PANE: New Bill (After Edit) */}
                        <div style={{ flex: '1 1 48%', minWidth: '350px' }}>
                            <h4 style={{
                                margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 800,
                                color: 'var(--brand-maroon, #A02B2B)', textTransform: 'uppercase', letterSpacing: '0.04em',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-maroon)' }} />
                                Proposed Edit (Formal Registry Changes - Highlights indicate edits)
                            </h4>
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color, #e2e8f0)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--base-bg, #f8fafc)', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>
                                            {['Item / Shade', 'Qty', 'Formal', 'Actual', 'Total'].map(h => (
                                                <th key={h} style={{
                                                    padding: '10px 12px', textAlign: h === 'Item / Shade' ? 'left' : 'right',
                                                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newItems.map((item: any, idx: number) => {
                                            const oldItemIdx = newToOldMatch[idx];
                                            const oldItem = oldItemIdx !== null ? oldItems[oldItemIdx] : null;
                                            
                                            // Diff flags
                                            const isNew = !oldItem;
                                            const isQtyChanged = !isNew && oldItem && Math.abs((oldItem.qty || 0) - item.qty) > 0.001;
                                            
                                            const isFormalChanged = isNew
                                                ? ((item.standard_formal_price !== undefined && item.standard_formal_price !== null) && Math.abs(item.standard_formal_price - item.price) > 0.001)
                                                : (oldItem && Math.abs((oldItem.price || 0) - item.price) > 0.001);
                                                
                                            const isActualChanged = isNew
                                                ? ((item.standard_actual_price !== undefined && item.standard_actual_price !== null) && Math.abs(item.standard_actual_price - item.actual_price) > 0.001)
                                                : (oldItem && Math.abs((oldItem.actual_price || 0) - item.actual_price) > 0.001);

                                            const stdFormalPrice = item.standard_formal_price;
                                            const isFormalDiffFromStd = stdFormalPrice !== undefined && stdFormalPrice !== null && Math.abs(stdFormalPrice - item.price) > 0.001;

                                            const stdActualPrice = item.standard_actual_price;
                                            const isActualDiffFromStd = stdActualPrice !== undefined && stdActualPrice !== null && Math.abs(stdActualPrice - item.actual_price) > 0.001;

                                            const total = (item.qty || 0) * (item.actual_price || 0);

                                            return (
                                                <tr key={idx} style={{
                                                    borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                                    background: isNew ? 'rgba(19, 154, 81, 0.05)' : (isQtyChanged || isFormalChanged || isActualChanged) ? 'rgba(160, 43, 43, 0.03)' : 'transparent'
                                                }}>
                                                    {/* Name */}
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.name}</div>
                                                        {item.shade_label && (
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                                {item.shade_label}
                                                            </div>
                                                        )}
                                                        {isNew && (
                                                            <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(19,154,81,0.15)', color: 'var(--brand-green)', fontWeight: 700, marginLeft: '4px', display: 'inline-block' }}>ADDED</span>
                                                        )}
                                                    </td>

                                                    {/* Qty */}
                                                    <td style={{
                                                        padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600,
                                                        background: isQtyChanged ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                                        color: isQtyChanged ? 'var(--brand-maroon)' : 'var(--text-primary)'
                                                    }}>
                                                        {item.qty}
                                                        {isQtyChanged && oldItem && (
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                                was {oldItem.qty}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Formal Price */}
                                                    <td style={{
                                                        padding: '12px', textAlign: 'right', fontSize: '0.8rem',
                                                        background: (isFormalChanged || isFormalDiffFromStd) ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                                        color: (isFormalChanged || isFormalDiffFromStd) ? 'var(--brand-maroon)' : 'var(--text-secondary)'
                                                    }}>
                                                        ₹{(item.price || 0).toFixed(2)}
                                                        {isFormalChanged && oldItem && (
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                                was ₹{(oldItem.price || 0).toFixed(2)}
                                                            </span>
                                                        )}
                                                        {isFormalDiffFromStd && (
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>
                                                                std: ₹{stdFormalPrice.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actual Price */}
                                                    <td style={{
                                                        padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600,
                                                        background: (isActualChanged || isActualDiffFromStd) ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                                        color: (isActualChanged || isActualDiffFromStd) ? 'var(--brand-green)' : 'var(--text-primary)'
                                                    }}>
                                                        ₹{(item.actual_price || 0).toFixed(2)}
                                                        {isActualChanged && oldItem && (
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                                was ₹{(oldItem.actual_price || 0).toFixed(2)}
                                                            </span>
                                                        )}
                                                        {isActualDiffFromStd && (
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>
                                                                std: ₹{stdActualPrice.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Line Total */}
                                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        ₹{total.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {newItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No items in edited bill.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Extra charges note */}
                    {(newSnap?.extra_charges > 0 || newSnap?.insurance_amount > 0) && (
                        <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'var(--base-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.8rem', color: 'var(--text-secondary, #475569)' }}>
                            {newSnap?.extra_charges > 0 && <span>Extra Charges: <strong style={{ color: 'var(--brand-maroon, #A02B2B)' }}>₹{parseFloat(newSnap.extra_charges).toFixed(2)}</strong> · </span>}
                            {newSnap?.insurance_amount > 0 && <span>Insurance: <strong style={{ color: 'var(--brand-maroon, #A02B2B)' }}>₹{parseFloat(newSnap.insurance_amount).toFixed(2)}</strong></span>}
                        </div>
                    )}

                    <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(160, 43, 43, 0.04)', border: '1px solid rgba(160, 43, 43, 0.08)', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                        ⚠️ <strong>Accept</strong> → updates actual portal totals and per-item prices immediately.<br />
                        ⛔ <strong>Reject</strong> → formal portal keeps its changes, actual portal remains unchanged.
                    </div>
                </div>

                {/* ─── Footer Actions ─── */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex', justifyContent: 'flex-end', gap: '12px',
                    background: 'var(--base-bg, #f8fafc)'
                }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '8px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            background: 'transparent', color: 'var(--text-secondary, #475569)',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                            opacity: loading ? 0.5 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onReject}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.08)', color: 'var(--danger, #ef4444)',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: loading ? 0.5 : 1,
                            transition: 'all 0.15s'
                        }}
                    >
                        <XCircle size={16} /> Reject Changes
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={loading}
                        style={{
                            padding: '10px 24px', borderRadius: '8px',
                            border: 'none',
                            background: loading ? '#cbd5e1' : 'var(--brand-maroon, #A02B2B)',
                            color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 800, fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: loading ? 'none' : '0 4px 12px rgba(160, 43, 43, 0.2)',
                            transition: 'all 0.15s'
                        }}
                    >
                        <CheckCircle size={16} /> {loading ? 'Applying...' : 'Accept Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillChangeDiffModal;
