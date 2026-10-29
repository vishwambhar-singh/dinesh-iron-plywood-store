import React, { useState, useEffect } from 'react';
import { X, Printer, RotateCcw, Edit3, Check, Save, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import pdsLogo from '../assets/pds_logo.png';
import formalLogo from '../assets/LOGO.png';
import SearchableSelect from './SearchableSelect';

interface PurchaseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchase: any;
    supplierName: string;
    isActual?: boolean;
    onProcessReturn?: (purchase: any) => void;
    initialEditMode?: boolean;
    onRefresh?: () => void;
}

import { formatToDDMMYY } from '../utils/date';

const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({ isOpen, onClose, purchase, supplierName, onProcessReturn, isActual = false, initialEditMode = false, onRefresh }) => {
    const [settings, setSettings] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable state
    const [editInvoiceNo, setEditInvoiceNo] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editItems, setEditItems] = useState<any[]>([]);
    const [editDestination, setEditDestination] = useState('');
    const [editBillingAddress, setEditBillingAddress] = useState('');
    const [editSupplierGst, setEditSupplierGst] = useState('');
    const [editDispatchThrough, setEditDispatchThrough] = useState('');
    const [editExtraCharges, setEditExtraCharges] = useState<number | ''>(0);
    const [editExtraChargeName, setEditExtraChargeName] = useState('');
    const [editInsuranceAmount, setEditInsuranceAmount] = useState<number | ''>("");
    const [editInsuranceName, setEditInsuranceName] = useState('');
    const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
    const [editSupplierName, setEditSupplierName] = useState('');
    const [allItems, setAllItems] = useState<any[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    // Searchable Select State
    const [itemSearch, setItemSearch] = useState('');

    useEffect(() => {
        if (purchase) {
            setEditInvoiceNo(purchase.bill_number || purchase.invoice_number);
            setEditDate((purchase.bill_date || purchase.purchase_date || '').split('T')[0]);
            setEditDestination(purchase.destination || '');
            setEditBillingAddress(purchase.billing_address || '');
            setEditSupplierGst(purchase.supplier_gst || '');
            setEditDispatchThrough(purchase.dispatch_through || '');
            setEditExtraCharges(parseFloat(purchase.extra_charges) || 0);
            setEditExtraChargeName(purchase.extra_charge_name || '');
            setEditInsuranceAmount(parseFloat(purchase.insurance_amount) || 0);
            setEditInsuranceName(purchase.insurance_name || '');
            setEditSupplierId(purchase.supplier_id || null);
            setEditSupplierName(supplierName || purchase.supplier_name_ref || purchase.supplier_name || 'Unknown Supplier');
            setIsEditing(initialEditMode);
            
            // Map items for editing
            const mapped = (purchase.items || []).map((i: any) => ({
                shade_id: i.shade_id,
                item_name: i.name || i.item_name,
                category: i.shade_category,
                qty: parseFloat(i.qty !== undefined ? i.qty : i.received_qty) || 0,
                pakka_price: isActual ? (i.actual_price || i.price) : i.price,
                price: i.price,
                actual_price: i.actual_price,
                hsn: i.hsn,
                tax_bracket: Number(i.price) > 0 ? ((Number(i.gst_amount || 0) / (Number(i.price) * Number(i.qty))) * 100) : 18,
                shade_label: i.shade_label || i.shade_id_label || ''
            }));
            setEditItems(mapped);
        }
        
        const fetchDeps = async () => {
            try {
                const [sRes, iRes, pRes] = await Promise.all([
                    api.get('/settings/variables'),
                    api.get('/items'),
                    api.get('/suppliers')
                ]);
                const sMap: any = {};
                sRes.data.forEach((s: any) => { sMap[s.key] = s.value; });
                setSettings(sMap);
                setAllItems(iRes.data);
                setAllSuppliers(pRes.data);
            } catch(e) {}
        };
        if (isOpen) fetchDeps();
    }, [purchase, isOpen, initialEditMode, isActual]);

    useKeyboardShortcuts({
        'Escape': onClose
    });

    if (!isOpen || !purchase) return null;

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
            const purchaseId = purchase.id || purchase.bill_id;
            await api.put(`/billing/purchase/${purchaseId}/full`, {
                bill_number: editInvoiceNo,
                bill_date: editDate,
                billing_address: editBillingAddress,
                supplier_gst: editSupplierGst,
                dispatch_through: editDispatchThrough,
                destination: editDestination,
                extra_charges: Number(editExtraCharges) || 0,
                extra_charge_name: editExtraChargeName,
                insurance_amount: Number(editInsuranceAmount) || 0,
                insurance_name: editInsuranceName,
                supplier_id: editSupplierId,
                supplier_name: editSupplierName,
                gst_type: purchase.gst_type,
                // source: FORMAL → creates pending approval request in actual portal
                //         ACTUAL → syncs both portals immediately
                source: isActual ? 'ACTUAL' : 'FORMAL',
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
    const calcTax = () => isActual ? 0 : editItems.reduce((acc, item) => acc + (item.qty * item.pakka_price * (item.tax_bracket / 100 || 0)), 0);
    const calcGrandTotal = () => {
        const sub = calcSubtotal();
        const extra = Number(editExtraCharges || 0);
        const ins = Number(editInsuranceAmount || 0);
        if (isActual) {
            return sub + extra + ins;
        }
        const tax = calcTax();
        const insWithGst = ins * 1.18;
        return sub + tax + extra + insWithGst;
    };

    const getActualViewTotal = () => {
        const itemsTotal = (purchase.items || []).reduce((acc: number, item: any) => {
            const rawPrice = item.actual_price !== undefined && item.actual_price !== null ? item.actual_price : item.price;
            const price = parseFloat(rawPrice) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = item.actual_line_total !== undefined ? item.actual_line_total : (qty * price);
            return acc + (parseFloat(rawTotal) || (qty * price));
        }, 0);
        const extra = parseFloat(purchase.extra_charges || 0) || 0;
        const insurance = parseFloat(purchase.insurance_amount || 0) || 0;
        if (itemsTotal > 0 || extra > 0 || insurance > 0) {
            return itemsTotal + extra + insurance;
        }
        return parseFloat(purchase.actual_total || purchase.net_godown_total || 0) || 0;
    };

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const accentColor = isActual ? '#2b6cb0' : '#A02B2B';
        const cName = isActual ? 'PDS' : (settings.pakka_company_name || 'PLY DECORE PURCHASES');
        const cGst = isActual ? '07AAAAA0000A1Z5' : (settings.pakka_gst_number || '07BKXPS4512M1Z2');
        const cLogo = isActual ? pdsLogo : formalLogo;
        const absoluteLogoUrl = cLogo ? new URL(cLogo, window.location.origin).href : '';

        const rows = (purchase.items || []).map((item: any) => {
            const rawPrice = isActual ? (item.actual_price || item.price) : item.price;
            const price = parseFloat(rawPrice) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : item.price_after_gst;
            const total = parseFloat(rawTotal) || (qty * price);
            const shade = item.shade_label || item.shade_id_label || '';

            if (isActual) {
                return `
                    <tr>
                        <td>${item.name || item.item_name} ${shade ? `(${shade})` : ''}</td>
                        <td style="text-align:right">${qty}</td>
                        <td style="text-align:right">₹${price.toFixed(2)}</td>
                        <td style="text-align:right">₹${total.toFixed(2)}</td>
                    </tr>
                `;
            }
            const taxable = (price * qty);
            const isInterstate = purchase.gst_type === 'INTERSTATE';
            const itemGst = Math.max(0, total - taxable);
            const igstVal = isInterstate ? (parseFloat(item.igst) > 0 ? parseFloat(item.igst) : itemGst) : 0;
            const cgstVal = !isInterstate ? (parseFloat(item.cgst) > 0 ? parseFloat(item.cgst) : (itemGst / 2)) : 0;
            const sgstVal = !isInterstate ? (parseFloat(item.sgst) > 0 ? parseFloat(item.sgst) : (itemGst / 2)) : 0;
            
            const taxCols = isInterstate 
                ? `<td style="text-align:right">₹${igstVal.toFixed(2)}</td>`
                : `<td style="text-align:right">₹${cgstVal.toFixed(2)}</td>
                   <td style="text-align:right">₹${sgstVal.toFixed(2)}</td>`;
                   
            return `
                <tr>
                    <td>${item.name || item.item_name} ${shade ? `(${shade})` : ''}</td>
                    <td>${item.hsn || '-'}</td>
                    <td style="text-align:right">${qty}</td>
                    <td style="text-align:right">₹${price.toFixed(2)}</td>
                    <td style="text-align:right">₹${taxable.toFixed(2)}</td>
                    ${taxCols}
                    <td style="text-align:right">₹${total.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        const totalQty = (purchase.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0), 0);
        const totalTaxable = (purchase.items || []).reduce((sum: number, item: any) => {
            const price = parseFloat(isActual ? (item.actual_price || item.price) : item.price) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            return sum + (price * qty);
        }, 0);
        const totalIGST = (purchase.items || []).reduce((sum: number, item: any) => {
            if (purchase.gst_type !== 'INTERSTATE') return 0;
            const price = parseFloat(isActual ? (item.actual_price || item.price) : item.price) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : item.price_after_gst;
            const total = parseFloat(rawTotal) || (qty * price);
            const taxable = price * qty;
            const itemGst = Math.max(0, total - taxable);
            return sum + (parseFloat(item.igst) > 0 ? parseFloat(item.igst) : itemGst);
        }, 0);
        const totalCGST = (purchase.items || []).reduce((sum: number, item: any) => {
            if (purchase.gst_type === 'INTERSTATE') return 0;
            const price = parseFloat(isActual ? (item.actual_price || item.price) : item.price) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : item.price_after_gst;
            const total = parseFloat(rawTotal) || (qty * price);
            const taxable = price * qty;
            const itemGst = Math.max(0, total - taxable);
            return sum + (parseFloat(item.cgst) > 0 ? parseFloat(item.cgst) : (itemGst / 2));
        }, 0);
        const totalSGST = (purchase.items || []).reduce((sum: number, item: any) => {
            if (purchase.gst_type === 'INTERSTATE') return 0;
            const price = parseFloat(isActual ? (item.actual_price || item.price) : item.price) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : item.price_after_gst;
            const total = parseFloat(rawTotal) || (qty * price);
            const taxable = price * qty;
            const itemGst = Math.max(0, total - taxable);
            return sum + (parseFloat(item.sgst) > 0 ? parseFloat(item.sgst) : (itemGst / 2));
        }, 0);
        const totalLineAmount = (purchase.items || []).reduce((sum: number, item: any) => {
            const price = parseFloat(isActual ? (item.actual_price || item.price) : item.price) || 0;
            const qty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
            const rawTotal = isActual ? (item.actual_line_total || (qty * price)) : item.price_after_gst;
            return sum + (parseFloat(rawTotal) || (qty * price));
        }, 0);

        const extraChargesNum = parseFloat(isEditing ? editExtraCharges : purchase.extra_charges) || 0;
        const extraChargeName = (isEditing ? editExtraChargeName : purchase.extra_charge_name) || 'Extra Charges';
        const insuranceNum = parseFloat(isEditing ? editInsuranceAmount : purchase.insurance_amount) || 0;
        const insuranceName = (isEditing ? editInsuranceName : purchase.insurance_name) || 'Insurance';

        let extraChargesHtml = '';
        if (extraChargesNum > 0) {
            if (isActual) {
                extraChargesHtml = `
                    <tr>
                        <td>${extraChargeName}</td>
                        <td style="text-align:right">-</td>
                        <td style="text-align:right">₹${extraChargesNum.toFixed(2)}</td>
                        <td style="text-align:right">₹${extraChargesNum.toFixed(2)}</td>
                    </tr>
                `;
            }
        }

        let insTaxable = 0, insCGST = 0, insSGST = 0, insIGST = 0, insTotal = 0;
        let insuranceHtml = '';
        if (insuranceNum > 0) {
            insTaxable = insuranceNum;
            insTotal = insTaxable * 1.18;
            if (!isActual) {
                if (purchase.gst_type === 'INTERSTATE') {
                    insIGST = insTaxable * 0.18;
                    insuranceHtml = `
                    <tr>
                        <td colspan="2">${insuranceName}</td>
                        <td style="text-align:right">-</td>
                        <td style="text-align:right">-</td>
                        <td style="text-align:right">₹${insTaxable.toFixed(2)}</td>
                        <td style="text-align:right">₹${insIGST.toFixed(2)}</td>
                        <td style="text-align:right">₹${insTotal.toFixed(2)}</td>
                    </tr>`;
                } else {
                    insCGST = insTaxable * 0.09;
                    insSGST = insTaxable * 0.09;
                    insuranceHtml = `
                    <tr>
                        <td colspan="2">${insuranceName}</td>
                        <td style="text-align:right">-</td>
                        <td style="text-align:right">-</td>
                        <td style="text-align:right">₹${insTaxable.toFixed(2)}</td>
                        <td style="text-align:right">₹${insCGST.toFixed(2)}</td>
                        <td style="text-align:right">₹${insSGST.toFixed(2)}</td>
                        <td style="text-align:right">₹${insTotal.toFixed(2)}</td>
                    </tr>`;
                }
            } else {
                insuranceHtml = `
                <tr>
                    <td>${insuranceName}</td>
                    <td style="text-align:right">-</td>
                    <td style="text-align:right">₹${insTaxable.toFixed(2)}</td>
                    <td style="text-align:right">₹${insTaxable.toFixed(2)}</td>
                </tr>`;
            }
        }

        const totalsRow = `
            <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                <td colspan="${isActual ? 1 : 2}">TOTALS</td>
                <td style="text-align:right">${totalQty}</td>
                <td style="text-align:right">-</td>
                ${isActual ? '' : `<td style="text-align:right">₹${(totalTaxable + insTaxable).toFixed(2)}</td>${purchase.gst_type === 'INTERSTATE' ? `<td style="text-align:right">₹${(totalIGST + insIGST).toFixed(2)}</td>` : `<td style="text-align:right">₹${(totalCGST + insCGST).toFixed(2)}</td><td style="text-align:right">₹${(totalSGST + insSGST).toFixed(2)}</td>`}`}
                <td style="text-align:right">₹${(totalLineAmount + (isActual ? (extraChargesNum + insTaxable) : insTotal)).toFixed(2)}</td>
            </tr>
        `;

        const grandPrintTotal = Number(isActual ? (totalLineAmount + extraChargesNum + insuranceNum) : (parseFloat(purchase.total_amount || 0) || 0));

        const printFormat = settings.default_print_format || 'STANDARD';
        const isCompact = printFormat === 'COMPACT';

        const destVal = (isEditing ? editDestination : (purchase.destination || editDestination))?.toString().trim();
        const dispatchedFromVal = (isEditing ? editBillingAddress : (purchase.billing_address || editBillingAddress))?.toString().trim();
        const suppGstVal = (isEditing ? editSupplierGst : (purchase.supplier_gst || editSupplierGst))?.toString().trim();
        const dispatchVal = (isEditing ? editDispatchThrough : (purchase.dispatch_through || editDispatchThrough))?.toString().trim();

        printWindow.document.write(`
            <html><head><title>${isActual ? 'Delivery Note' : 'Purchase Order'} #${purchase.bill_number}</title>
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
                .bank-details{width: 55%; font-size: ${isCompact ? '8px' : '9px'}; color: #475569; border: 1px solid #cbd5e1; padding: ${isCompact ? '5px' : '8px'}; border-radius: 6px;}
                .totals{width: 40%;}
                .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:${isCompact ? '10px' : '11px'}}
                .tot-grand{border-top:1.5px solid ${accentColor};padding-top:4px;margin-top:2px;font-size:${isCompact ? '12px' : '13px'};font-weight:700;color:${accentColor}}
                .signature-section{margin-top: ${isCompact ? '10px' : '16px'}; display: flex; justify-content: space-between; align-items: flex-end;}
                .footer{text-align:center;margin-top:${isCompact ? '6px' : '10px'};font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px}
                .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; z-index: -1; width: 250px; pointer-events: none; }
            </style></head><body>
            <div class="bill-container">
              <div>
                <div class="header">
                    <div class="header-left">
                        ${absoluteLogoUrl ? '<img src="' + absoluteLogoUrl + '" style="max-height: ' + (isCompact ? '40px' : '50px') + '; margin-bottom: 6px;" />' : ''}
                        <h1>${cName}</h1>
                        <p style="font-size:${isCompact ? '10px' : '11px'}; color:#475569; margin-bottom: 2px;">${settings.pakka_address || 'Address not provided'}</p>
                        <p style="font-size:${isCompact ? '10px' : '11px'}; color:#475569; margin-bottom: 2px;">Email: ${settings.pakka_email || 'email@example.com'} | Ph: ${settings.pakka_mobile || '0000000000'}</p>
                        <p style="font-size:${isCompact ? '10px' : '11px'}; font-weight: 600;">GSTIN: ${cGst}</p>
                    </div>
                    <div class="header-right">
                        <h3>${isActual ? 'Delivery Note' : 'Purchase Order'}</h3>
                        <p style="font-size:${isCompact ? '12px' : '14px'};font-weight:bold;">#${purchase.bill_number}</p>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-block"><label>Supplier</label><span>${supplierName}</span></div>
                    <div class="info-block"><label>Date</label><span>${formatToDDMMYY(isEditing ? editDate : purchase.bill_date)}</span></div>
                    <div class="info-block"><label>Ref</label><span>${purchase.voucher_no || '-'}</span></div>
                    ${destVal ? `<div class="info-block"><label>Destination</label><span>${destVal}</span></div>` : ''}
                    ${dispatchedFromVal ? `<div class="info-block"><label>Dispatched From</label><span>${dispatchedFromVal}</span></div>` : ''}
                    ${suppGstVal ? `<div class="info-block"><label>Supplier GSTIN</label><span>${suppGstVal}</span></div>` : ''}
                    ${dispatchVal ? `<div class="info-block"><label>Dispatched Through</label><span>${dispatchVal}</span></div>` : ''}
                </div>
                <table>
                    <thead><tr>
                        <th>Item Description</th>
                        ${isActual ? '' : '<th>HSN</th>'}
                        <th style="text-align:right">Qty</th>
                        <th style="text-align:right">Rate</th>
                        ${isActual ? '' : `<th style="text-align:right">Taxable</th>${purchase.gst_type === 'INTERSTATE' ? '<th style="text-align:right">IGST</th>' : '<th style="text-align:right">CGST</th><th style="text-align:right">SGST</th>'}`}
                        <th style="text-align:right">Total</th>
                    </tr></thead>
                    <tbody>${rows}${extraChargesHtml}${insuranceHtml}${totalsRow}</tbody>
                </table>
              </div>
              <div>
                <div class="totals-section">
                    <div class="bank-details">
                        <p style="font-weight: 700; margin-bottom: 4px; color: #1e293b;">Bank Account Details</p>
                        <p><strong>Bank:</strong> ${settings.bank_name || 'N/A'}</p>
                        <p><strong>A/C No:</strong> ${settings.bank_account_no || 'N/A'}</p>
                        <p><strong>IFSC:</strong> ${settings.bank_ifsc || 'N/A'}</p>
                        <p><strong>Branch:</strong> ${settings.bank_branch || 'N/A'}</p>
                    </div>
                    <div class="totals">
                        <div class="tot-row"><span>Items Subtotal</span><span>₹${totalLineAmount.toFixed(2)}</span></div>
                        ${extraChargesNum > 0 ? `<div class="tot-row"><span>${extraChargeName}</span><span>₹${extraChargesNum.toFixed(2)}</span></div>` : ''}
                        ${insuranceNum > 0 ? `<div class="tot-row"><span>${insuranceName}${!isActual ? ' (inc. GST)' : ''}</span><span>₹${(isActual ? insuranceNum : insTotal).toFixed(2)}</span></div>` : ''}
                        <div class="tot-row tot-grand"><span>Grand Total</span><span>₹${grandPrintTotal.toFixed(2)}</span></div>
                    </div>
                </div>
                <div class="signature-section">
                    <div style="width: 55%; font-size: ${isCompact ? '8px' : '9px'}; color: #64748b; text-align: left;">
                        <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Terms & Conditions</p>
                        <p style="white-space: pre-line; line-height: 1.2;">${settings.invoice_terms || 'Goods once sold are not returnable.'}</p>
                    </div>
                    <div style="width: 40%; text-align: right;">
                        <p style="font-weight: bold; font-size: ${isCompact ? '11px' : '12px'}; margin-bottom: ${isCompact ? '30px' : '45px'};">For ${cName}</p>
                        <p style="font-size: ${isCompact ? '10px' : '11px'}; font-weight: 600; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px;">Authorised Signatory</p>
                    </div>
                </div>
                <div class="footer">
                    ${isActual ? 'PDS Internal Document' : 'Computer Generated Tax Invoice'}
                </div>
              </div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 250);
                };
            </script>
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
                        <div style={{ width: '48px', height: '48px', background: isActual ? 'rgba(43,108,176,0.1)' : 'rgba(160,43,43,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActual ? '#2b6cb0' : '#A02B2B' }}>
                            {isActual ? <Edit3 size={24}/> : <Check size={24}/>}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                                {isActual ? 'PDS Internal Delivery Record' : 'Ply Decore Purchases | Formal Tax Invoice'}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                {isEditing ? (
                                    <input 
                                        value={editInvoiceNo} 
                                        onChange={e => setEditInvoiceNo(e.target.value)}
                                        style={{ padding: '4px 8px', border: '1px solid var(--accent-primary)', borderRadius: '6px', fontSize: '1rem', fontWeight: 700 }}
                                    />
                                ) : (
                                    <>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>#{purchase.bill_number || purchase.invoice_number}</span>
                                        {<button onClick={() => setIsEditing(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent-primary)', opacity: 0.6 }}><Edit3 size={14}/></button>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', color: '#64748b' }}><X size={20}/></button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '20px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Billed Supplier</label>
                            {isEditing ? (
                                <SearchableSelect 
                                    placeholder="Search Supplier..."
                                    options={allSuppliers.map(s => ({ id: s.id, label: s.name }))}
                                    value={editSupplierId || ""}
                                    onChange={(val) => {
                                        setEditSupplierId(val);
                                        const supp = allSuppliers.find(s => s.id === val);
                                        if (supp) {
                                            setEditSupplierName(supp.name);
                                            setEditSupplierGst(supp.gst_number || '');
                                            setEditBillingAddress(supp.address || '');
                                        } else {
                                            setEditSupplierId(null);
                                            setEditSupplierName('Unknown Supplier');
                                        }
                                    }}
                                />
                            ) : (
                                <p style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem' }}>
                                    {editSupplierName}
                                </p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Invoice Date</label>
                            {isEditing ? (
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                            ) : (
                                <p style={{ fontWeight: 700, color: '#334155', fontSize: '1.1rem' }}>{formatToDDMMYY(purchase.bill_date || purchase.purchase_date)}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>System Voucher</label>
                            <p style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{purchase.voucher_no || 'N/A'}</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: isActual ? '#2b6cb0' : '#A02B2B', marginBottom: '6px', letterSpacing: '0.05em' }}>Net Payable</label>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: isActual ? '#2b6cb0' : '#A02B2B' }}>
                                {isEditing ? formatMoney(calcGrandTotal()) : formatMoney(isActual ? getActualViewTotal() : purchase.total_amount)}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Destination (Optional)</label>
                            {isEditing ? (
                                <input type="text" value={editDestination} onChange={e => setEditDestination(e.target.value)} placeholder="e.g. Mumbai" style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }} />
                            ) : (
                                <p style={{ fontWeight: 600, color: '#334155' }}>{purchase.destination || 'N/A'}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Dispatched From</label>
                            {isEditing ? (
                                <input type="text" value={editBillingAddress} onChange={e => setEditBillingAddress(e.target.value)} placeholder="e.g. Warehouse A" style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }} />
                            ) : (
                                purchase.billing_address && <p style={{ fontWeight: 600, color: '#334155' }}>{purchase.billing_address}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Supplier GSTIN</label>
                            {isEditing ? (
                                <input type="text" value={editSupplierGst} onChange={e => setEditSupplierGst(e.target.value)} placeholder="e.g. 07AAAAA0000A1Z5" style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }} />
                            ) : (
                                purchase.supplier_gst && <p style={{ fontWeight: 600, color: '#334155' }}>{purchase.supplier_gst}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>Dispatched Through</label>
                            {isEditing ? (
                                <input type="text" value={editDispatchThrough} onChange={e => setEditDispatchThrough(e.target.value)} placeholder="e.g. FedEx" style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%' }} />
                            ) : (
                                purchase.dispatch_through && <p style={{ fontWeight: 600, color: '#334155' }}>{purchase.dispatch_through}</p>
                            )}
                        </div>
                        {isEditing && (
                            <>
                            {isActual && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#2b6cb0', marginBottom: '6px', letterSpacing: '0.05em' }}>Extra Charges</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input type="text" placeholder="Charge Name (e.g. Freight)" value={editExtraChargeName} onChange={e => setEditExtraChargeName(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: '6px', width: '100%' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>₹</span>
                                            <input type="number" step="0.01" value={editExtraCharges} onChange={e => setEditExtraCharges(Number(e.target.value) || '')} style={{ padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: '6px', width: '100%' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#10b981', marginBottom: '6px', letterSpacing: '0.05em' }}>Insurance</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input type="text" placeholder="Insurance Name" value={editInsuranceName} onChange={e => setEditInsuranceName(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #6ee7b7', borderRadius: '6px', width: '100%' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>₹</span>
                                        <input type="number" step="0.01" value={editInsuranceAmount} onChange={e => setEditInsuranceAmount(Number(e.target.value) || '')} style={{ padding: '4px 8px', border: '1px solid #6ee7b7', borderRadius: '6px', width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'visible' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#475569' }}>
                                    <th style={{ padding: '16px 24px', borderTopLeftRadius: '16px' }}>Item Description</th>
                                    {!isActual && <th style={{ padding: '16px' }}>HSN</th>}
                                    <th style={{ padding: '16px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Unit Rate</th>
                                    {!isActual && (
                                        <>
                                            <th style={{ padding: '16px', textAlign: 'right' }}>Taxable</th>
                                            {purchase.gst_type === 'INTERSTATE' ? (
                                                <th style={{ padding: '16px', textAlign: 'right' }}>IGST</th>
                                            ) : (
                                                <>
                                                    <th style={{ padding: '16px', textAlign: 'right' }}>CGST</th>
                                                    <th style={{ padding: '16px', textAlign: 'right' }}>SGST</th>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <th style={{ padding: '16px 24px', textAlign: 'right', borderTopRightRadius: isEditing ? '0' : '16px' }}>Total</th>
                                    {isEditing && <th style={{ padding: '16px', textAlign: 'center', borderTopRightRadius: '16px' }}></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(isEditing ? editItems : (purchase.items || [])).map((item: any, i: number) => {
                                    const rawPrice = isActual ? (item.actual_price || item.price || item.pakka_price) : (item.price || item.pakka_price);
                                    const price = parseFloat(rawPrice) || 0;
                                    const itemQty = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
                                    const rawTotal = isActual ? (item.actual_line_total || (itemQty * price)) : (item.price_after_gst || (itemQty * price * (1 + (item.tax_bracket||0)/100)));
                                    const total = parseFloat(rawTotal) || 0;
                                    const shade = item.shade_label || item.shade_id_label || '';
                                    const taxable = price * itemQty;

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>
                                                {item.name || item.item_name} {item.shade_label ? `(${item.shade_label})` : (item.shade_id_label ? `(${item.shade_id_label})` : '')}
                                                <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{shade || 'GENERAL'}</span>
                                            </td>
                                            {!isActual && <td style={{ padding: '16px', color: '#64748b', fontSize: '0.85rem' }}>{item.hsn || '-'}</td>}
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                                                {isEditing ? (
                                                    <input type="number" value={item.qty !== undefined ? item.qty : itemQty} onChange={(e) => updateItem(i, 'qty', e.target.value)} style={{ width: '60px', padding: '4px' }} />
                                                ) : itemQty}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>
                                                {isEditing ? (
                                                    <input type="number" value={item.pakka_price || price} onChange={(e) => updateItem(i, 'pakka_price', e.target.value)} style={{ width: '80px', padding: '4px' }} />
                                                ) : formatMoney(price)}
                                            </td>
                                            {!isActual && (
                                                <>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{formatMoney(taxable)}</td>
                                                    {purchase.gst_type === 'INTERSTATE' ? (
                                                        <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(item.igst || (taxable * ((item.tax_bracket||0)/100)))}</td>
                                                    ) : (
                                                        <>
                                                            <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(item.cgst || (taxable * ((item.tax_bracket||0)/200)))}</td>
                                                            <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(item.sgst || (taxable * ((item.tax_bracket||0)/200)))}</td>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{formatMoney(total)}</td>
                                            {isEditing && (
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button onClick={() => removeItem(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                
                                
                                {(!isEditing && ((isActual && purchase.extra_charges > 0) || purchase.insurance_amount > 0)) && (
                                    <>
                                        {isActual && purchase.extra_charges > 0 && (
                                            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                                                <td colSpan={isActual ? 3 : 4} style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>
                                                    {purchase.extra_charge_name || 'Extra Charges'}
                                                </td>
                                                {!isActual && (
                                                    <>
                                                        <td style={{ padding: '16px' }}></td>
                                                        {purchase.gst_type === 'INTERSTATE' ? <td style={{ padding: '16px' }}></td> : <><td style={{ padding: '16px' }}></td><td style={{ padding: '16px' }}></td></>}
                                                    </>
                                                )}
                                                <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{formatMoney(purchase.extra_charges)}</td>
                                            </tr>
                                        )}
                                        {purchase.insurance_amount > 0 && (() => {
                                            const insTaxable = parseFloat(purchase.insurance_amount);
                                            const insTotal = isActual ? insTaxable : insTaxable * 1.18;
                                            const insCGST = insTaxable * 0.09;
                                            const insSGST = insTaxable * 0.09;
                                            const insIGST = insTaxable * 0.18;
                                            return (
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                                                    <td colSpan={isActual ? 3 : 4} style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>
                                                        {purchase.insurance_name || 'Insurance'}
                                                    </td>
                                                    {!isActual && (
                                                        <>
                                                            <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{formatMoney(insTaxable)}</td>
                                                            {purchase.gst_type === 'INTERSTATE' ? (
                                                                <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(insIGST)}</td>
                                                            ) : (
                                                                <>
                                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(insCGST)}</td>
                                                                    <td style={{ padding: '16px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{formatMoney(insSGST)}</td>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{formatMoney(insTotal)}</td>
                                                </tr>
                                            );
                                        })()}
                                    </>
                                )}

                                {isEditing && (
                                    <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                                        <td colSpan={isActual ? 4 : 8} style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <SearchableSelect 
                                                        placeholder="+ Add an item to this invoice..."
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
                         <span style={{ width: '8px', height: '8px', background: isActual ? '#3b82f6' : '#10b981', borderRadius: '50%' }}></span>
                         <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            {isActual ? 'Internal Registry Sync Active' : 'Formal Compliance Locked'}
                         </span>
                    </div>

                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel Edit</button>
                            <button disabled={saving} onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}>
                                <Save size={18}/> {saving ? 'Saving...' : 'Save Invoice Updates'}
                            </button>
                        </>
                    ) : (
                        <>
                            {onProcessReturn && (
                                <button onClick={() => onProcessReturn(purchase)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <RotateCcw size={18}/> Process Purchase Return
                                </button>
                            )}
                            <button onClick={onClose} style={{ padding: '12px 28px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Close View</button>
                            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 40px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <Printer size={20}/> Print Invoice
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetailModal;
