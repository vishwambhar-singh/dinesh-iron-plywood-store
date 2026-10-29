import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════
// ACTUAL PRICE IS SECRET — NEVER expose actual_price,
// actual_line_total, or actual_selling_price in formal
// (PAKKA) API responses. Use stripActualPrice(item) to
// sanitize item objects before sending them to the client.
// ActualAccounting, /sales/actual, /purchases/actual, and
// mode=ACTUAL endpoints are the ONLY legitimate consumers.
// ═══════════════════════════════════════════════════════════

const formatToDDMMYY = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string') {
        const cleanStr = dateStr.split('T')[0];
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const year = parts[0].slice(-2);
            const month = parts[1];
            const day = parts[2];
            return `${day}/${month}/${year}`;
        }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

const formatDateYYYYMMDD = (dateVal) => {
    if (!dateVal) {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    if (typeof dateVal === 'string') {
        return dateVal.split('T')[0];
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

function stripActualPrice(item) {
    delete item.actual_price;
    delete item.actual_line_total;
    delete item.actual_selling_price;
    return item;
}

// ═══════════════════════════════════════════════════════════
// SALE FLOW (AUTOMATIC FULFILL & ACTUAL SYNC)
// ═══════════════════════════════════════════════════════════
export const submitSale = async (req, res) => {
    const { customer_id, items: sold_shades, billing_address, customer_gst, dispatch_through, destination, gst_type, set_default_address, extra_charges, extra_charge_name, insurance_amount, insurance_name } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (set_default_address && billing_address) {
             await connection.query('UPDATE customers SET address = ?, gstNumber = ? WHERE id = ?', [billing_address, customer_gst, customer_id]);
        }

        const nextInvoiceNum = await getNextInvoiceNumber(connection, 'sales', 'invoice_number', 'PDS-', 'invoice_start_number');
        const invoiceNumber = req.body.invoice_number || nextInvoiceNum;
        await incrementSequenceSetting(connection, 'invoice_start_number', invoiceNumber);
        const sharedVoucherNo = `PDS/SAL/${invoiceNumber.split('-')[1] || invoiceNumber.slice(-4)}`;
        const voucherDate = formatDateYYYYMMDD(req.body.sale_date);

        const [cusRows] = await connection.query("SELECT name FROM customers WHERE id = ?", [customer_id]);
        if (cusRows.length === 0) throw new Error("Invalid Customer");
        const customerName = cusRows[0].name;

        let formalSubtotal = 0;
        let parsedExtraCharges = extra_charges !== undefined ? parseFloat(extra_charges || 0) : 0;
        let parsedInsuranceAmount = insurance_amount !== undefined ? parseFloat(insurance_amount || 0) : 0;
        let actualNet = parsedExtraCharges + parsedInsuranceAmount;
        let totalGstAmount = 0;
        const lineItems = [];

        for (let entry of sold_shades) {
            const [itemInfo] = await connection.query(`
                SELECT i.id as item_id, i.name, i.hsn_code, i.base_pakka_selling_rate, i.tax_bracket_percent, sh.shade_category 
                FROM items i
                JOIN item_shades sh ON sh.id = ?
                WHERE i.id = sh.item_id
            `, [entry.shade_id]);

            if (itemInfo.length === 0) throw new Error(`Item for shade ${entry.shade_id} not found.`);
            const rule = itemInfo[0];
            
            // Check Mapping for Godown Pricing
            const [mappingInfo] = await connection.query(`
                SELECT actual_selling_price FROM customer_item_mapping 
                WHERE customer_id = ? AND item_id = ?
            `, [customer_id, rule.item_id]);

            const basePakka = entry.pakka_price ? parseFloat(entry.pakka_price) : parseFloat(rule.base_pakka_selling_rate);
            const explicitActualPrice = mappingInfo.length > 0 ? parseFloat(mappingInfo[0].actual_selling_price) : basePakka;

            const qty = parseFloat(entry.qty);
            const taxRate = parseFloat(rule.tax_bracket_percent);
            const lineSubtotal = basePakka * qty;
            const lineGst = lineSubtotal * (taxRate / 100);
            const lineTotalAfterGst = lineSubtotal + lineGst;

            formalSubtotal += lineSubtotal;
            totalGstAmount += lineGst;
            actualNet += (explicitActualPrice * qty);

            // Deduct Stock
            await connection.query('UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?', [qty, entry.shade_id]);

            const gType = gst_type || 'LOCAL';
            const igst = gType === 'INTERSTATE' ? lineGst : 0;
            const cgst = gType === 'LOCAL' ? lineGst / 2 : 0;
            const sgst = gType === 'LOCAL' ? lineGst / 2 : 0;

            lineItems.push({
                shade_id: entry.shade_id,
                shade_category: rule.shade_category || 'GENERAL',
                name: rule.name,
                hsn: rule.hsn_code,
                qty,
                price: basePakka,
                actual_price: explicitActualPrice, // SNAPSHOT
                cgst,
                sgst,
                igst,
                gst_amount: lineGst,
                price_after_gst: lineTotalAfterGst
            });
        }

        const insuranceGst = parsedInsuranceAmount * 0.18;
        totalGstAmount += insuranceGst;
        const exactFormalTotal = formalSubtotal + totalGstAmount + parsedExtraCharges + parsedInsuranceAmount;
        const formalTotal = Math.round(exactFormalTotal);
        const roundOff = formalTotal - exactFormalTotal;

        const advAmt = parseFloat(req.body.advance_payment || 0);
        const finalBalance = formalTotal - advAmt;
        const pStatus = finalBalance <= 0 ? 'PAID' : (advAmt > 0 ? 'PARTIALLY_PAID' : 'PENDING');

        // 1. Insert into Formal Ledger (Required for FK)
        await connection.query(
            'INSERT INTO ledger_formal_pakka (voucher_no, entity_type, entity_id, transaction_type, total_taxable_value, total_tax_computed, net_invoice_total, financial_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [sharedVoucherNo, 'CUSTOMER', customer_id, 'SALE', formalSubtotal, totalGstAmount, formalTotal, 'FY26-27']
        );

        const saleId = uuidv4();
        // 2. Insert Pakka Bill
        await connection.query(
            `INSERT INTO sales (id, invoice_number, voucher_no, customer_id, customer_name, sale_date, subtotal, total_gst_amount, total_amount, amount_paid, balance, payment_status, gst_type, billing_address, customer_gst, dispatch_through, destination, round_off, extra_charges, extra_charge_name, insurance_amount, insurance_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             [saleId, invoiceNumber, sharedVoucherNo, customer_id, customerName, voucherDate, formalSubtotal, totalGstAmount, formalTotal, advAmt, finalBalance, pStatus, req.body.gst_type || 'LOCAL', billing_address || null, customer_gst || null, dispatch_through || null, destination || null, roundOff, parsedExtraCharges, extra_charge_name || null, parsedInsuranceAmount,
                 insurance_name !== undefined ? insurance_name : (insurance_name || null), insurance_name || null]
        );

        // 3. SYNC: Insert Actual Ledger Entry
        await connection.query(
            'INSERT INTO ledger_internal_actual (voucher_no, entity_type, entity_id, transaction_type, net_godown_total, split_reference) VALUES (?, ?, ?, ?, ?, ?)',
            [sharedVoucherNo, 'CUSTOMER', customer_id, 'SALE', actualNet, 'AUTO-SYNC-PAKKA']
        );

        if (advAmt > 0) {
            await connection.query(
                `INSERT INTO cashbook_transactions (id, transaction_date, type, category, amount, pakka_amount, actual_amount, payment_method, description, entity_name, related_type, related_id, is_automatic) 
                 VALUES (?, ?, 'INCOME', 'SALES_RECEIPT', ?, ?, ?, ?, ?, ?, 'SALES', ?, TRUE)`,
                [uuidv4(), voucherDate, advAmt, advAmt, advAmt, req.body.payment_method || 'BANK/NEFT', `Advance for Invoice ${invoiceNumber}`, customerName, saleId]
            );
        }

        for (let i = 0; i < lineItems.length; i++) {
            let item = lineItems[i];
            await connection.query(
                `INSERT INTO sale_items (id, sale_id, shade_id, shade_category, name, hsn, qty, price, actual_price, cgst, sgst, igst, gst_amount, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), saleId, item.shade_id, item.shade_category, item.name, item.hsn, item.qty, item.price, item.actual_price, item.cgst, item.sgst, item.igst, item.gst_amount, item.price_after_gst, i]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Sale Committed & Synced to Actual', invoice_number: invoiceNumber, voucher_no: sharedVoucherNo, sale_id: saleId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Sale Sync Failed", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// PURCHASE FLOW (AUTOMATIC FULFILL & ACTUAL SYNC)
// ═══════════════════════════════════════════════════════════
export const createPurchaseOrder = async (req, res) => {
    const { supplier_id, items: bought_shades, billing_address, supplier_gst, dispatch_through, destination, gst_type, extra_charges, extra_charge_name, insurance_amount, insurance_name } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const billNumber = await getNextInvoiceNumber(connection, 'supplier_bills', 'bill_number', 'PO-');
        const sharedVoucherNo = `PDS/PUR/${billNumber.split('-')[1] || billNumber.slice(-4)}`;
        const billDate = formatDateYYYYMMDD(req.body.bill_date);

        const [supRows] = await connection.query("SELECT name FROM suppliers WHERE id = ?", [supplier_id]);
        if (supRows.length === 0) throw new Error("Invalid Supplier");
        const supplierName = supRows[0].name;

        let formalSubtotal = 0;
        let parsedExtraCharges = extra_charges !== undefined ? parseFloat(extra_charges || 0) : 0;
        let parsedInsuranceAmount = insurance_amount !== undefined ? parseFloat(insurance_amount || 0) : 0;
        let actualNet = parsedExtraCharges + parsedInsuranceAmount;
        let totalGstAmount = 0;
        const lineItems = [];

        for (let entry of bought_shades) {
            const [itemInfo] = await connection.query(`
                SELECT i.id as item_id, i.name, i.hsn_code, i.tax_bracket_percent, sh.shade_category 
                FROM items i
                JOIN item_shades sh ON sh.id = ?
                WHERE i.id = sh.item_id
            `, [entry.shade_id]);

            const [mappingInfo] = await connection.query(`
                SELECT pakka_buying_rate, kaccha_deduction_commission FROM supplier_item_mapping 
                WHERE supplier_id = ? AND item_id = ?
            `, [supplier_id, itemInfo[0].item_id]);

            const rule = itemInfo[0];
            const map = mappingInfo[0] || { pakka_buying_rate: 0, kaccha_deduction_commission: 0 };
            
            const basePakka = entry.pakka_price ? parseFloat(entry.pakka_price) : (entry.custom_pakka_rate ? parseFloat(entry.custom_pakka_rate) : parseFloat(map.pakka_buying_rate));
            const qty = parseFloat(entry.qty);
            const taxRate = parseFloat(rule.tax_bracket_percent);
            
            const lineSubtotal = basePakka * qty;
            const lineGst = lineSubtotal * (taxRate / 100);
            const lineTotalAfterGst = lineSubtotal + lineGst;

            const deduction = parseFloat(map.kaccha_deduction_commission || 0);
            // REQUIREMENT: Add deduction to base rate, exclude GST for actual
            const lineActualTotal = (basePakka + deduction) * qty;

            formalSubtotal += lineSubtotal;
            totalGstAmount += lineGst;
            actualNet += lineActualTotal;

            // Increment Stock Immediately (Direct Fulfillment)
            await connection.query('UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?', [qty, entry.shade_id]);

            const gType = gst_type || 'LOCAL';
            const isInterstate = gType === 'INTERSTATE';
            const cgst = isInterstate ? 0 : (lineGst / 2);
            const sgst = isInterstate ? 0 : (lineGst / 2);
            const igst = isInterstate ? lineGst : 0;

            lineItems.push({
                shade_id: entry.shade_id,
                shade_category: rule.shade_category || 'GENERAL',
                name: rule.name,
                hsn: rule.hsn_code,
                qty,
                price: basePakka,
                actual_price: basePakka + deduction, // SNAPSHOT for history
                cgst,
                sgst,
                igst,
                price_after_gst: lineTotalAfterGst
            });
        }

        const insuranceGst = parsedInsuranceAmount * 0.18;
        totalGstAmount += insuranceGst;
        const exactFormalTotal = formalSubtotal + totalGstAmount + parsedExtraCharges + parsedInsuranceAmount;
        const formalTotal = Math.round(exactFormalTotal);
        const roundOff = formalTotal - exactFormalTotal;
        const advAmt = parseFloat(req.body.advance_payment || 0);
        const billId = uuidv4();
        const gType = gst_type || 'LOCAL';

        // 1. Insert into Formal Ledger (Required for FK)
        await connection.query(
            'INSERT INTO ledger_formal_pakka (voucher_no, entity_type, entity_id, transaction_type, total_taxable_value, total_tax_computed, net_invoice_total, financial_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [sharedVoucherNo, 'SUPPLIER', supplier_id, 'PURCHASE', formalSubtotal, totalGstAmount, formalTotal, 'FY26-27']
        );

        // 2. Insert Pakka Bill (Fulfilled by default)
        await connection.query(
            `INSERT INTO supplier_bills (id, supplier_id, voucher_no, bill_number, bill_date, subtotal, total_gst_amount, total_amount, round_off, amount_paid, balance_amount, status, billing_address, supplier_gst, dispatch_through, destination, gst_type, extra_charges, extra_charge_name, insurance_amount, insurance_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FULFILLED', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             [billId, supplier_id, sharedVoucherNo, billNumber, billDate, formalSubtotal, totalGstAmount, formalTotal, roundOff, advAmt, formalTotal - advAmt, billing_address || null, supplier_gst || null, dispatch_through || null, destination || null, gType, parsedExtraCharges, extra_charge_name || null, parsedInsuranceAmount,
                 insurance_name !== undefined ? insurance_name : (insurance_name || null), insurance_name || null]
        );

        // 3. SYNC: Insert Actual Ledger Entry
        await connection.query(
            'INSERT INTO ledger_internal_actual (voucher_no, entity_type, entity_id, transaction_type, net_godown_total, split_reference) VALUES (?, ?, ?, ?, ?, ?)',
            [sharedVoucherNo, 'SUPPLIER', supplier_id, 'PURCHASE', actualNet, 'AUTO-SYNC-PAKKA']
        );

        if (advAmt > 0) {
            await connection.query(
                `INSERT INTO cashbook_transactions (id, transaction_date, type, category, amount, pakka_amount, actual_amount, payment_method, description, entity_name, related_type, related_id, is_automatic) 
                 VALUES (?, ?, 'EXPENSE', 'PURCHASE_PAYMENT', ?, ?, ?, ?, ?, ?, 'PURCHASE', ?, TRUE)`,
                [uuidv4(), billDate, advAmt, advAmt, advAmt, req.body.payment_method || 'BANK/NEFT', `Payment for Bill ${billNumber}`, supplierName, billId]
            );
        }

        for (let i = 0; i < lineItems.length; i++) {
            let item = lineItems[i];
            await connection.query(
                `INSERT INTO supplier_bill_items (id, bill_id, shade_id, shade_category, name, hsn, received_qty, price, actual_price, cgst, sgst, igst, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), billId, item.shade_id, item.shade_category, item.name, item.hsn, item.qty, item.price, item.actual_price, item.cgst, item.sgst, item.igst, item.price_after_gst, i]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Purchase Committed & Synced to Actual', bill_number: billNumber, voucher_no: sharedVoucherNo, bill_id: billId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Purchase Sync Failed", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// PAKKA SALES ONLY — Formal Invoice View (No Actual Enrichment)
// ═══════════════════════════════════════════════════════════
export const fetchPakkaSales = async (req, res) => {
    try {
        const [sales] = await pool.query(`
            SELECT s.*, c.name as customer_name_ref
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            ORDER BY s.created_at DESC
        `);

        if (sales.length === 0) {
            return res.status(200).json([]);
        }

        const saleIds = sales.map(s => s.id);

        // Bulk fetch all items in one query
        const [allItems] = await pool.query(`
            SELECT si.*, sh.shade_id_label as shade_label, sh.shade_category as shade_cat_ref
            FROM sale_items si
            LEFT JOIN item_shades sh ON si.shade_id = sh.id
            WHERE si.sale_id IN (?)
            ORDER BY si.item_index ASC
        `, [saleIds]);

        // Bulk fetch all cashbook payments/returns in one query
        const [allPayments] = await pool.query(`
            SELECT related_id, type, SUM(pakka_amount) as total
            FROM cashbook_transactions
            WHERE related_id IN (?) AND type IN ('INCOME', 'EXPENSE')
            GROUP BY related_id, type
        `, [saleIds]);

        const itemsMap = new Map();
        for (const item of allItems) {
            if (!itemsMap.has(item.sale_id)) {
                itemsMap.set(item.sale_id, []);
            }
            itemsMap.get(item.sale_id).push(stripActualPrice(item));
        }

        const incomeMap = new Map();
        const expenseMap = new Map();
        for (const p of allPayments) {
            if (p.type === 'INCOME') {
                incomeMap.set(p.related_id, Number(p.total || 0));
            } else if (p.type === 'EXPENSE') {
                expenseMap.set(p.related_id, Number(p.total || 0));
            }
        }

        for (let sale of sales) {
            sale.items = itemsMap.get(sale.id) || [];
            const totalIn = incomeMap.get(sale.id) || 0;
            const totalOut = expenseMap.get(sale.id) || 0;
            const ledgerPaid = totalIn - totalOut;

            sale.amount_paid = Number(sale.advance_payment || 0) + ledgerPaid;
            sale.balance = Number(sale.total_amount || 0) - sale.amount_paid;

            // Format for consistency
            sale.amount_paid = Number(sale.amount_paid.toFixed(2));
            sale.balance = Number(sale.balance.toFixed(2));
        }

        res.status(200).json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pakka sales' });
    }
};

// ═══════════════════════════════════════════════════════════
// ACTUAL SALES ONLY — Godown/Internal View (No Pakka Details)
// ═══════════════════════════════════════════════════════════
export const fetchActualSales = async (req, res) => {
    try {
        const [actualLedger] = await pool.query(`
            SELECT 
                lia.*, 
                s.id as sale_id, 
                s.invoice_number, 
                s.sale_date, 
                s.total_amount as pakka_total, 
                c.name as customer_name, 
                lia.net_godown_total as actual_total,
                s.destination, s.dispatch_through, s.customer_gst, s.billing_address, s.extra_charges, s.extra_charge_name, s.insurance_amount, s.insurance_name
            FROM ledger_internal_actual lia
            LEFT JOIN sales s ON lia.voucher_no = s.voucher_no
            LEFT JOIN customers c ON lia.entity_id = c.id
            WHERE lia.entity_type = 'CUSTOMER'
            ORDER BY lia.created_at DESC
        `);

        for (const entry of actualLedger) {
            // Check for PENDING or REJECTED change request
            const [changeReq] = await pool.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [entry.sale_id]
            );

            let items;
            if (changeReq.length > 0) {
                const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                    ? JSON.parse(changeReq[0].old_actual_snapshot)
                    : changeReq[0].old_actual_snapshot;

                // Override details with baseline values
                entry.invoice_number = snapshot.invoice_number || entry.invoice_number;
                entry.sale_date = snapshot.sale_date || entry.sale_date;
                entry.customer_name = snapshot.customer_name || entry.customer_name;
                entry.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : entry.extra_charges;
                entry.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : entry.insurance_amount;

                items = (snapshot.items || []).map(item => ({
                    shade_id: item.shade_id,
                    name: item.name || '—',
                    shade_label: item.shade_label || '',
                    qty: item.qty || 0,
                    price: item.price || 0,
                    actual_price: item.actual_price || 0,
                    actual_line_total: (item.qty || 0) * (item.actual_price || 0),
                    price_after_gst: (item.qty || 0) * (item.actual_price || 0)
                }));
            } else {
                const [dbItems] = await pool.query(`
                    SELECT si.*, sh.shade_id_label as shade_label
                    FROM sale_items si
                    LEFT JOIN item_shades sh ON si.shade_id = sh.id
                    WHERE si.sale_id = ?
                    ORDER BY si.item_index ASC
                `, [entry.sale_id]);

                items = dbItems.map(item => {
                    const actualPrice = (item.actual_price !== null && item.actual_price !== undefined) ? parseFloat(item.actual_price) : 0;
                    const qty = parseFloat(item.qty || 0);
                    return {
                        ...item,
                        actual_price: actualPrice,
                        price: parseFloat(item.price || 0),
                        actual_line_total: actualPrice * qty,
                        price_after_gst: actualPrice * qty
                    };
                });
            }

            entry.items = items;
            entry.actual_total = entry.net_godown_total;

            // Calculate payments
            const [payRes] = await pool.query('SELECT SUM(actual_amount) as paid FROM cashbook_transactions WHERE related_id = ? AND type = "INCOME"', [entry.sale_id]);
            entry.actual_paid = parseFloat(payRes[0].paid || 0);
            entry.actual_balance = parseFloat(entry.actual_total) - entry.actual_paid;
        }

        res.status(200).json(actualLedger);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch actual sales' });
    }
};

export const fetchPakkaPurchases = async (req, res) => {
    try {
        const [bills] = await pool.query(`
            SELECT b.*, s.name as supplier_name 
            FROM supplier_bills b
            JOIN suppliers s ON b.supplier_id = s.id
            WHERE b.status = 'FULFILLED'
            ORDER BY b.created_at DESC
        `);

        if (bills.length === 0) {
            return res.status(200).json([]);
        }

        const billIds = bills.map(b => b.id);
        const [allItems] = await pool.query(`
            SELECT sbi.*, sbi.received_qty as qty, sh.shade_id_label as shade_label
            FROM supplier_bill_items sbi
            LEFT JOIN item_shades sh ON sbi.shade_id = sh.id
            WHERE sbi.bill_id IN (?)
            ORDER BY sbi.item_index ASC
        `, [billIds]);

        const itemsMap = new Map();
        for (const item of allItems) {
            if (!itemsMap.has(item.bill_id)) {
                itemsMap.set(item.bill_id, []);
            }
            itemsMap.get(item.bill_id).push(item);
        }

        for (let bill of bills) {
            const rawItems = itemsMap.get(bill.id) || [];
            bill.items = rawItems.map(item => {
                const clean = stripActualPrice(item);
                clean.qty = parseFloat(clean.received_qty !== undefined ? clean.received_qty : clean.qty) || 0;
                clean.received_qty = clean.qty;
                const isInterstate = bill.gst_type === 'INTERSTATE';
                const taxable = (parseFloat(clean.price) || 0) * clean.qty;
                const gstDiff = Math.max(0, (parseFloat(clean.price_after_gst) || 0) - taxable);
                if (isInterstate && (!clean.igst || parseFloat(clean.igst) === 0)) {
                    clean.igst = (parseFloat(clean.cgst || 0) + parseFloat(clean.sgst || 0)) || gstDiff;
                    clean.cgst = 0;
                    clean.sgst = 0;
                }
                return clean;
            });
        }

        res.status(200).json(bills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pakka purchases' });
    }
};

export const fetchActualPurchases = async (req, res) => {
    try {
        const [actualLedger] = await pool.query(`
            SELECT 
                lia.*, 
                b.id as bill_id, 
                b.bill_number, 
                b.bill_date, 
                s.name as supplier_name, 
                lia.net_godown_total as actual_total,
                b.destination, b.dispatch_through, b.supplier_gst, b.billing_address, b.extra_charges, b.extra_charge_name, b.insurance_amount, b.insurance_name
            FROM ledger_internal_actual lia
            LEFT JOIN supplier_bills b ON lia.voucher_no = b.voucher_no
            LEFT JOIN suppliers s ON lia.entity_id = s.id
            WHERE lia.entity_type = 'SUPPLIER'
            ORDER BY lia.created_at DESC
        `);

        for (const entry of actualLedger) {
            // Check for PENDING or REJECTED change request
            const [changeReq] = await pool.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [entry.bill_id]
            );

            let items;
            if (changeReq.length > 0) {
                const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                    ? JSON.parse(changeReq[0].old_actual_snapshot)
                    : changeReq[0].old_actual_snapshot;

                // Override details with baseline values
                entry.bill_number = snapshot.bill_number || entry.bill_number;
                entry.bill_date = snapshot.bill_date || entry.bill_date;
                entry.supplier_name = snapshot.supplier_name || entry.supplier_name;
                entry.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : entry.extra_charges;
                entry.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : entry.insurance_amount;

                items = (snapshot.items || []).map(item => {
                    const q = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
                    const p = parseFloat(item.price || 0);
                    const ap = parseFloat(item.actual_price || 0);
                    return {
                        shade_id: item.shade_id,
                        name: item.name || '—',
                        shade_label: item.shade_label || '',
                        qty: q,
                        received_qty: q,
                        price: p,
                        actual_price: ap,
                        actual_line_total: q * ap,
                        price_after_gst: q * ap
                    };
                });
            } else {
                const [dbItems] = await pool.query(`
                    SELECT sbi.*, sbi.received_qty as qty, sh.shade_id_label as shade_label
                    FROM supplier_bill_items sbi
                    LEFT JOIN item_shades sh ON sbi.shade_id = sh.id
                    WHERE sbi.bill_id = ?
                    ORDER BY sbi.item_index ASC
                `, [entry.bill_id]);

                items = dbItems.map(item => {
                    const actualPrice = (item.actual_price !== null && item.actual_price !== undefined) ? parseFloat(item.actual_price) : 0;
                    const qty = parseFloat(item.received_qty !== undefined ? item.received_qty : item.qty) || 0;
                    return {
                        ...item,
                        qty,
                        received_qty: qty,
                        actual_price: actualPrice,
                        price: parseFloat(item.price || 0),
                        actual_line_total: actualPrice * qty,
                        price_after_gst: actualPrice * qty
                    };
                });
            }

            entry.items = items;
            entry.actual_total = entry.net_godown_total;

            const [payRes] = await pool.query('SELECT SUM(actual_amount) as paid FROM cashbook_transactions WHERE related_id = ? AND type = "EXPENSE"', [entry.bill_id]);
            entry.actual_paid = parseFloat(payRes[0].paid || 0);
            entry.actual_balance = parseFloat(entry.actual_total) - entry.actual_paid;
        }

        res.status(200).json(actualLedger);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch actual purchases' });
    }
};

// ═══════════════════════════════════════════════════════════
// SHARED: Enrich sale with actual (godown) amounts from mappings
// ═══════════════════════════════════════════════════════════
async function enrichSaleWithActualAmounts(sale, mode = 'PAKKA') {
    const [items] = await pool.query(`
        SELECT si.*, sh.shade_id_label as shade_label 
        FROM sale_items si 
        LEFT JOIN item_shades sh ON si.shade_id = sh.id 
        WHERE si.sale_id = ? 
        ORDER BY si.item_index ASC
    `, [sale.id]);
    let totalCommission = 0;
    for (let item of items) {
        const [mappingInfo] = await pool.query(`
            SELECT c.actual_selling_price
            FROM customer_item_mapping c
            JOIN item_shades sh ON sh.item_id = c.item_id
            WHERE sh.id = ? AND c.customer_id = ?
        `, [item.shade_id, sale.customer_id]);

        const dbActualPrice = item.actual_price !== null && item.actual_price !== undefined ? parseFloat(item.actual_price) : null;
        const actualPrice = dbActualPrice !== null ? dbActualPrice : (mappingInfo.length > 0 ? parseFloat(mappingInfo[0].actual_selling_price) : 0);
        const qty = parseFloat(item.qty);

        if (mode === 'ACTUAL') {
            item.actual_selling_price = actualPrice;
            item.actual_price = actualPrice;
            item.actual_line_total = actualPrice * qty;
        } else {
            stripActualPrice(item);
        }

        totalCommission += 0;
    }

    sale.items = items;
    
    if (mode === 'ACTUAL') {
        const itemsTotal = items.reduce((acc, current) => acc + (current.actual_line_total || 0), 0);
        const extraCharges = parseFloat(sale.extra_charges || 0);
        const insuranceAmount = parseFloat(sale.insurance_amount || 0);
        sale.actual_total = itemsTotal + extraCharges + insuranceAmount;
        if (!sale.net_godown_total) {
            sale.net_godown_total = sale.actual_total;
        }
    } else {
        delete sale.actual_total;
    }
    sale.total_commission = 0;
}

// ═══════════════════════════════════════════════════════════
// FETCH ALL SALES
// ═══════════════════════════════════════════════════════════
export const fetchSales = async (req, res) => {
    const { mode = 'PAKKA' } = req.query;
    try {
        const [sales] = await pool.query(`
            SELECT s.*, c.name as customer_name_ref, lia.net_godown_total
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no
            ORDER BY s.created_at DESC
        `);
        for (let sale of sales) {
            await enrichSaleWithActualAmounts(sale, mode);
        }
        res.status(200).json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

// ═══════════════════════════════════════════════════════════
// FETCH SALES BY CUSTOMER
// ═══════════════════════════════════════════════════════════
export const fetchSalesByCustomer = async (req, res) => {
    const { id } = req.params;
    const { mode = 'PAKKA' } = req.query;
    try {
        const [sales] = await pool.query(`
            SELECT s.*, c.name as customer_name_ref, lia.net_godown_total
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
        `, [id]);
        
        for (let sale of sales) {
            const [changeReq] = await pool.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [sale.id]
            );

            if (mode === 'ACTUAL' && changeReq.length > 0) {
                const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                    ? JSON.parse(changeReq[0].old_actual_snapshot)
                    : changeReq[0].old_actual_snapshot;

                sale.invoice_number = snapshot.invoice_number || sale.invoice_number;
                sale.sale_date = snapshot.sale_date || sale.sale_date;
                sale.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : sale.extra_charges;
                sale.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : sale.insurance_amount;
                sale.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (sale.net_godown_total || sale.actual_total);
                sale.net_godown_total = sale.actual_total;

                sale.items = (snapshot.items || []).map(item => ({
                    sale_id: sale.id,
                    shade_id: item.shade_id,
                    name: item.name || '—',
                    qty: item.qty || 0,
                    price: item.price || 0,
                    cgst: 0,
                    sgst: 0,
                    gst_amount: 0,
                    price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                    actual_price: item.actual_price || 0,
                    actual_line_total: (item.qty || 0) * (item.actual_price || 0),
                    shade_label: item.shade_label || ''
                }));
            } else {
                await enrichSaleWithActualAmounts(sale, mode);
            }
        }
        res.status(200).json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customer sales' });
    }
};



// DELETED DUPLICATE PO FLOW



// ═══════════════════════════════════════════════════════════
// SHARED: Enrich bill with actual (godown) amounts from mappings
// ═══════════════════════════════════════════════════════════
async function enrichBillWithActualAmounts(bill, mode = 'PAKKA') {
    const [items] = await pool.query(`
        SELECT sbi.*, sbi.received_qty as qty, sh.shade_id_label as shade_label 
        FROM supplier_bill_items sbi 
        LEFT JOIN item_shades sh ON sbi.shade_id = sh.id 
        WHERE sbi.bill_id = ? 
        ORDER BY sbi.item_index ASC
    `, [bill.id]);
    let totalDeduction = 0;

    for (let item of items) {
        const [mappingInfo] = await pool.query(`
            SELECT s.kaccha_deduction_commission, s.pakka_buying_rate
            FROM supplier_item_mapping s
            JOIN item_shades sh ON sh.item_id = s.item_id
            WHERE sh.id = ? AND s.supplier_id = ?
        `, [item.shade_id, bill.supplier_id]);

        const deduction = mappingInfo.length > 0 ? parseFloat(mappingInfo[0].kaccha_deduction_commission) : 0;
        const qty = parseFloat(item.received_qty !== undefined ? item.received_qty : item.qty) || 0;
        item.qty = qty;
        item.received_qty = qty;
        const pakkaLineTotalAfterGst = parseFloat(item.price_after_gst || 0);

        const isInterstate = bill.gst_type === 'INTERSTATE';
        const taxable = (parseFloat(item.price) || 0) * qty;
        const gstDiff = Math.max(0, pakkaLineTotalAfterGst - taxable);
        if (isInterstate && (!item.igst || parseFloat(item.igst) === 0)) {
            item.igst = (parseFloat(item.cgst || 0) + parseFloat(item.sgst || 0)) || gstDiff;
            item.cgst = 0;
            item.sgst = 0;
        }

        const dbActualPrice = item.actual_price !== null && item.actual_price !== undefined ? parseFloat(item.actual_price) : null;

        item.kaccha_deduction = deduction;

        if (mode === 'ACTUAL') {
            item.actual_price = dbActualPrice !== null ? dbActualPrice : ((pakkaLineTotalAfterGst / (qty || 1)) + deduction);
            item.actual_line_total = item.actual_price * qty;
        } else {
            stripActualPrice(item);
        }

        totalDeduction += (deduction * qty);
    }

    bill.items = items;
    
    let pakkaTotal = 0;
    if (mode === 'ACTUAL') {
        const itemsTotal = items.reduce((acc, current) => acc + (current.actual_line_total || 0), 0);
        const extraCharges = parseFloat(bill.extra_charges || 0);
        const insuranceAmount = parseFloat(bill.insurance_amount || 0);
        bill.actual_total = itemsTotal + extraCharges + insuranceAmount;
        if (!bill.net_godown_total) {
            bill.net_godown_total = bill.actual_total;
        }
    } else {
        delete bill.actual_total;
    }
    bill.total_deduction = totalDeduction;
}

// ═══════════════════════════════════════════════════════════
// FETCH ALL PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════
export const fetchPurchaseOrders = async (req, res) => {
    const { mode = 'PAKKA' } = req.query;
    try {
        const [bills] = await pool.query(`
            SELECT b.*, s.name as supplier_name, lia.net_godown_total 
            FROM supplier_bills b
            JOIN suppliers s ON b.supplier_id = s.id
            LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no
            ORDER BY b.created_at DESC
        `);
        for (let bill of bills) {
            await enrichBillWithActualAmounts(bill, mode);
        }
        res.status(200).json(bills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
};


// ═══════════════════════════════════════════════════════════
// FETCH PURCHASE ORDERS BY SUPPLIER
// ═══════════════════════════════════════════════════════════
export const fetchPurchaseOrdersBySupplier = async (req, res) => {
    const { id } = req.params;
    const { mode = 'PAKKA' } = req.query;
    try {
        const [bills] = await pool.query(`
            SELECT b.*, s.name as supplier_name, lia.net_godown_total 
            FROM supplier_bills b
            JOIN suppliers s ON b.supplier_id = s.id
            LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no
            WHERE b.supplier_id = ?
            ORDER BY b.created_at DESC
        `, [id]);
        
        for (let bill of bills) {
            const [changeReq] = await pool.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [bill.id]
            );

            if (mode === 'ACTUAL' && changeReq.length > 0) {
                const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                    ? JSON.parse(changeReq[0].old_actual_snapshot)
                    : changeReq[0].old_actual_snapshot;

                bill.bill_number = snapshot.bill_number || bill.bill_number;
                bill.bill_date = snapshot.bill_date || bill.bill_date;
                bill.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : bill.extra_charges;
                bill.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : bill.insurance_amount;
                bill.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (bill.net_godown_total || bill.actual_total);
                bill.net_godown_total = bill.actual_total;

                bill.items = (snapshot.items || []).map(item => ({
                    bill_id: bill.id,
                    shade_id: item.shade_id,
                    name: item.name || '—',
                    qty: item.qty || 0,
                    price: item.price || 0,
                    cgst: 0,
                    sgst: 0,
                    price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                    actual_price: item.actual_price || 0,
                    actual_line_total: (item.qty || 0) * (item.actual_price || 0),
                    shade_label: item.shade_label || ''
                }));
            } else {
                await enrichBillWithActualAmounts(bill, mode);
            }
        }
        res.status(200).json(bills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch supplier purchase orders' });
    }
};

// ═══════════════════════════════════════════════════════════
// FETCH SALE ITEMS FOR RETURN
// ═══════════════════════════════════════════════════════════
export const fetchSaleItems = async (req, res) => {
    const { id } = req.params;
    const { mode = 'PAKKA' } = req.query;
    try {
        const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
        if (sale.length === 0) return res.status(404).json({ error: 'Sale not found' });
        
        // Check for PENDING or REJECTED change request
        const [changeReq] = await pool.query(
            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
            [id]
        );

        let items;
        const saleObj = sale[0];

        if (mode === 'ACTUAL' && changeReq.length > 0) {
            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                ? JSON.parse(changeReq[0].old_actual_snapshot)
                : changeReq[0].old_actual_snapshot;

            // Override details
            saleObj.invoice_number = snapshot.invoice_number || saleObj.invoice_number;
            saleObj.sale_date = snapshot.sale_date || saleObj.sale_date;
            saleObj.customer_name = snapshot.customer_name || saleObj.customer_name;
            saleObj.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : saleObj.extra_charges;
            saleObj.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : saleObj.insurance_amount;
            saleObj.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : saleObj.actual_total;
            saleObj.net_godown_total = saleObj.actual_total;

            items = await Promise.all((snapshot.items || []).map(async item => {
                const [sh] = await pool.query('SELECT available_qty FROM item_shades WHERE id = ?', [item.shade_id]);
                return {
                    shade_id: item.shade_id,
                    name: item.name || '—',
                    shade_label: item.shade_label || '',
                    qty: item.qty || 0,
                    price: item.price || 0,
                    actual_price: item.actual_price || 0,
                    available_qty: sh.length > 0 ? sh[0].available_qty : 0
                };
            }));
        } else {
            const [dbItems] = await pool.query(`
                SELECT si.*, sh.shade_id_label as shade_label, sh.available_qty 
                FROM sale_items si 
                JOIN item_shades sh ON si.shade_id = sh.id 
                WHERE si.sale_id = ?
                ORDER BY si.item_index ASC
            `, [id]);
            items = dbItems.map(item => {
                const clean = { ...item, price: item.price };
                if (mode !== 'ACTUAL') {
                    return stripActualPrice(clean);
                }
                return clean;
            });
        }
        
        res.status(200).json({ sale: saleObj, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sale items' });
    }
};

// ═══════════════════════════════════════════════════════════════════
// FETCH PURCHASE ITEMS FOR RETURN
// ═══════════════════════════════════════════════════════════
export const fetchPurchaseItems = async (req, res) => {
    const { id } = req.params;
    const { mode = 'PAKKA' } = req.query;
    try {
        const [bill] = await pool.query('SELECT * FROM supplier_bills WHERE id = ?', [id]);
        if (bill.length === 0) return res.status(404).json({ error: 'Purchase Order not found' });
        
        // Check for PENDING or REJECTED change request
        const [changeReq] = await pool.query(
            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
            [id]
        );

        let items;
        const billObj = bill[0];

        if (mode === 'ACTUAL' && changeReq.length > 0) {
            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                ? JSON.parse(changeReq[0].old_actual_snapshot)
                : changeReq[0].old_actual_snapshot;

            // Override details
            billObj.bill_number = snapshot.bill_number || billObj.bill_number;
            billObj.bill_date = snapshot.bill_date || billObj.bill_date;
            billObj.supplier_name = snapshot.supplier_name || billObj.supplier_name;
            billObj.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : billObj.extra_charges;
            billObj.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : billObj.insurance_amount;
            billObj.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : billObj.actual_total;
            billObj.net_godown_total = billObj.actual_total;

            items = await Promise.all((snapshot.items || []).map(async item => {
                const [sh] = await pool.query('SELECT available_qty FROM item_shades WHERE id = ?', [item.shade_id]);
                const q = parseFloat(item.qty !== undefined ? item.qty : item.received_qty) || 0;
                return {
                    shade_id: item.shade_id,
                    name: item.name || '—',
                    shade_label: item.shade_label || '',
                    qty: q,
                    received_qty: q,
                    price: item.price || 0,
                    actual_price: item.actual_price || 0,
                    available_qty: sh.length > 0 ? sh[0].available_qty : 0
                };
            }));
        } else {
            const [dbItems] = await pool.query(`
                SELECT sbi.*, sbi.received_qty as qty, sh.shade_id_label as shade_label, sh.available_qty 
                FROM supplier_bill_items sbi 
                JOIN item_shades sh ON sbi.shade_id = sh.id 
                WHERE sbi.bill_id = ?
                ORDER BY sbi.item_index ASC
            `, [id]);
            items = dbItems.map(item => {
                const clean = { ...item, price: item.price };
                clean.qty = parseFloat(clean.received_qty !== undefined ? clean.received_qty : clean.qty) || 0;
                clean.received_qty = clean.qty;
                const isInterstate = billObj.gst_type === 'INTERSTATE';
                const taxable = (parseFloat(clean.price) || 0) * clean.qty;
                const gstDiff = Math.max(0, (parseFloat(clean.price_after_gst) || 0) - taxable);
                if (isInterstate && (!clean.igst || parseFloat(clean.igst) === 0)) {
                    clean.igst = (parseFloat(clean.cgst || 0) + parseFloat(clean.sgst || 0)) || gstDiff;
                    clean.cgst = 0;
                    clean.sgst = 0;
                }
                if (mode !== 'ACTUAL') {
                    return stripActualPrice(clean);
                }
                return clean;
            });
        }
        
        res.status(200).json({ bill: billObj, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch purchase items' });
    }
};

// ═══════════════════════════════════════════════════════════
// SALES RETURN (Customer Returns)
// ═══════════════════════════════════════════════════════════
export const submitSalesReturn = async (req, res) => {
    const { sale_id, returned_shades, refund_amount, refund_method, refund_description } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [saleRows] = await connection.query('SELECT * FROM sales WHERE id = ?', [sale_id]);
        if (saleRows.length === 0) throw new Error('Sale invoice not found');
        const sale = saleRows[0];

        const returnVoucherNo = `RET/${Math.floor(Math.random() * 9000) + 1000}`;
        const returnDate = formatDateYYYYMMDD();

        let totalRefund = parseFloat(refund_amount || 0);

        // Calculate Actual Godown impact based on original items
        const returnId = uuidv4();
        let totalGodownImpact = 0;

        // Pre-calculate return item totals for accurate subtotal/GST
        let returnSubtotal = 0;
        let returnGST = 0;
        let returnActualTotal = 0;
        const processedItems = [];
        for (let item of returned_shades) {
            const qty = parseFloat(item.qty);
            const [origItems] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ? AND shade_id = ? LIMIT 1', [sale_id, item.shade_id]);
            if (origItems.length > 0) {
                const orig = origItems[0];
                const unitPrice = parseFloat(orig.price);
                const actualPrice = parseFloat(orig.actual_price || 0);
                const cgstPerUnit = parseFloat(orig.cgst) / parseFloat(orig.qty);
                const sgstPerUnit = parseFloat(orig.sgst) / parseFloat(orig.qty);
                const lineSubtotal = unitPrice * qty;
                const lineActualTotal = actualPrice * qty;
                const lineCGST = cgstPerUnit * qty;
                const lineSGST = sgstPerUnit * qty;
                returnSubtotal += lineSubtotal;
                returnActualTotal += lineActualTotal;
                returnGST += (lineCGST + lineSGST);
                processedItems.push({ ...item, orig, unitPrice, cgstPerUnit, sgstPerUnit, qty, actualPrice });
            }
        }
        const returnGrandTotal = returnSubtotal + returnGST;

        // 1. Create return ledger entries ( Pakka - Credit Note ) FIRST (Foreign Key parent for sales.voucher_no)
        await connection.query(
            'INSERT INTO ledger_formal_pakka (voucher_no, entity_type, entity_id, transaction_type, total_taxable_value, total_tax_computed, net_invoice_total, financial_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [returnVoucherNo, 'CUSTOMER', sale.customer_id, 'RETURN', -returnSubtotal, -returnGST, -returnGrandTotal, 'FY26-27']
        );

        // 2. Internal ledger (Actual)
        await connection.query(
            'INSERT INTO ledger_internal_actual (voucher_no, entity_type, entity_id, transaction_type, net_godown_total, split_reference) VALUES (?, ?, ?, ?, ?, ?)',
            [returnVoucherNo, 'CUSTOMER', sale.customer_id, 'RETURN', -returnActualTotal, 'CUST-RETURN']
        );

        // Generate unique return invoice number
        const [lastRet] = await connection.query("SELECT invoice_number FROM sales WHERE invoice_number LIKE 'RET-%' ORDER BY created_at DESC LIMIT 1");
        let returnInvoiceNumber = 'RET-0001';
        if (lastRet.length > 0) {
            const match = lastRet[0].invoice_number.match(/RET-(\d+)/);
            if (match) {
                returnInvoiceNumber = `RET-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
            }
        }

        // 3. Record return in sales table (Parent Foreign Key for sale_items)
        await connection.query(
            `INSERT INTO sales (id, invoice_number, voucher_no, customer_id, customer_name, sale_date, subtotal, total_gst_amount, total_amount, amount_paid, balance, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [returnId, returnInvoiceNumber, returnVoucherNo, sale.customer_id, sale.customer_name, returnDate, -returnSubtotal, -returnGST, -returnGrandTotal, 0, returnGrandTotal]
        );

        // 4. Process each returned shade and insert child items
        for (let i = 0; i < processedItems.length; i++) {
            let pItem = processedItems[i];
            // INCREMENT inventory (opposite of sale)
            await connection.query(
                'UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?',
                [pItem.qty, pItem.shade_id]
            );

            await connection.query(
                `INSERT INTO sale_items (id, sale_id, shade_id, name, hsn, qty, price, actual_price, cgst, sgst, gst_amount, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), returnId, pItem.shade_id, pItem.orig.name, pItem.orig.hsn, -pItem.qty, pItem.unitPrice, pItem.actualPrice, -(pItem.cgstPerUnit * pItem.qty), -(pItem.sgstPerUnit * pItem.qty), -((pItem.cgstPerUnit+pItem.sgstPerUnit)*pItem.qty), -((pItem.unitPrice + pItem.cgstPerUnit + pItem.sgstPerUnit)*pItem.qty), i]
            );
        }

        // 5. Mark original sales invoice as RETURNED
        await connection.query(
            'UPDATE sales SET payment_status = ? WHERE id = ?',
            ['RETURNED', sale_id]
        );

        // Create cashbook entry for refund
        if (totalRefund > 0 && refund_method !== 'CREDIT_NOTE') {
            await connection.query(
                `INSERT INTO cashbook_transactions 
                (id, transaction_date, type, category, amount, pakka_amount, actual_amount, payment_method, description, entity_name, related_type, related_id) 
                VALUES (?, ?, 'EXPENSE', 'SALES_RETURN', ?, ?, ?, ?, ?, ?, 'SALES_RETURN', ?)`,
                [uuidv4(), returnDate, totalRefund, totalRefund, totalRefund, refund_method || 'CASH', refund_description || 'Credit Note Refund', sale.customer_name, returnId]
            );
        }

        await connection.commit();
        res.status(200).json({
            message: 'Credit note processed — inventory restored, refund issued',
            voucher_no: returnVoucherNo,
            refund_amount: totalRefund
        });

    } catch (err) {
        await connection.rollback();
        console.error("Sales Return Failed", err);
        res.status(500).json({ error: err.message || 'Sales Return Failed' });
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// PURCHASE RETURN (Supplier Returns)
// ═══════════════════════════════════════════════════════════
export const submitPurchaseReturn = async (req, res) => {
    const { bill_id, returned_shades, refund_amount, refund_method, refund_description } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [billRows] = await connection.query('SELECT * FROM supplier_bills WHERE id = ?', [bill_id]);
        if (billRows.length === 0) throw new Error('Purchase Order not found');
        const bill = billRows[0];

        const returnVoucherNo = `PRET/${Math.floor(Math.random() * 9000) + 1000}`;
        const returnDate = formatDateYYYYMMDD();

        let totalRefund = parseFloat(refund_amount || 0);

        const returnId = uuidv4();

        // Pre-calculate return item totals for accurate subtotal/GST
        let returnSubtotal = 0;
        let returnGST = 0;
        let returnActualTotal = 0;
        const processedItems = [];
        for (let item of returned_shades) {
            const qty = parseFloat(item.qty);
            const [origItems] = await connection.query('SELECT * FROM supplier_bill_items WHERE bill_id = ? AND shade_id = ? LIMIT 1', [bill_id, item.shade_id]);
            if (origItems.length > 0) {
                const orig = origItems[0];
                const unitPrice = parseFloat(orig.price);
                const actualPrice = parseFloat(orig.actual_price || 0);
                const cgstPerUnit = parseFloat(orig.cgst) / parseFloat(orig.received_qty);
                const sgstPerUnit = parseFloat(orig.sgst) / parseFloat(orig.received_qty);
                const lineSubtotal = unitPrice * qty;
                const lineActualTotal = actualPrice * qty;
                const lineCGST = cgstPerUnit * qty;
                const lineSGST = sgstPerUnit * qty;
                returnSubtotal += lineSubtotal;
                returnActualTotal += lineActualTotal;
                returnGST += (lineCGST + lineSGST);
                processedItems.push({ ...item, orig, unitPrice, cgstPerUnit, sgstPerUnit, qty, actualPrice });
            }
        }
        const returnGrandTotal = returnSubtotal + returnGST;

        // 1. Create return ledger entries FIRST (Foreign Key parent for supplier_bills.voucher_no)
        await connection.query(
            'INSERT INTO ledger_formal_pakka (voucher_no, entity_type, entity_id, transaction_type, total_taxable_value, total_tax_computed, net_invoice_total, financial_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [returnVoucherNo, 'SUPPLIER', bill.supplier_id, 'RETURN', -returnSubtotal, -returnGST, -returnGrandTotal, 'FY26-27']
        );

        await connection.query(
            'INSERT INTO ledger_internal_actual (voucher_no, entity_type, entity_id, transaction_type, net_godown_total, split_reference) VALUES (?, ?, ?, ?, ?, ?)',
            [returnVoucherNo, 'SUPPLIER', bill.supplier_id, 'RETURN', -returnActualTotal, 'SUP-RETURN']
        );

        // Generate unique return bill number
        const [lastRet] = await connection.query("SELECT bill_number FROM supplier_bills WHERE bill_number LIKE 'PRET-%' ORDER BY created_at DESC LIMIT 1");
        let returnBillNumber = 'PRET-0001';
        if (lastRet.length > 0) {
            const match = lastRet[0].bill_number.match(/PRET-(\d+)/);
            if (match) {
                returnBillNumber = `PRET-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
            }
        }

        // 2. Record return in supplier_bills table (Parent Foreign Key for supplier_bill_items)
        await connection.query(
            `INSERT INTO supplier_bills (id, bill_number, voucher_no, supplier_id, bill_date, subtotal, total_gst_amount, total_amount, amount_paid, balance_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FULFILLED')`,
            [returnId, returnBillNumber, returnVoucherNo, bill.supplier_id, returnDate, -returnSubtotal, -returnGST, -returnGrandTotal, 0, returnGrandTotal]
        );

        // 3. Process each returned shade and insert child items
        for (let i = 0; i < processedItems.length; i++) {
            let pItem = processedItems[i];
            // DECREMENT inventory (opposite of purchase)
            await connection.query(
                'UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?',
                [pItem.qty, pItem.shade_id]
            );

            await connection.query(
                `INSERT INTO supplier_bill_items (id, bill_id, shade_id, name, hsn, received_qty, price, actual_price, cgst, sgst, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), returnId, pItem.shade_id, pItem.orig.name, pItem.orig.hsn, -pItem.qty, pItem.unitPrice, pItem.actualPrice, -(pItem.cgstPerUnit * pItem.qty), -(pItem.sgstPerUnit * pItem.qty), -((pItem.unitPrice + pItem.cgstPerUnit + pItem.sgstPerUnit)*pItem.qty), i]
            );
        }

        // 4. Mark original purchase bill as RETURNED
        await connection.query(
            'UPDATE supplier_bills SET status = ? WHERE id = ?',
            ['RETURNED', bill_id]
        );

        // Create cashbook entry for refund received
        if (totalRefund > 0 && refund_method !== 'CREDIT_NOTE') {
            await connection.query(
                `INSERT INTO cashbook_transactions 
                (id, transaction_date, type, category, amount, pakka_amount, actual_amount, payment_method, description, entity_name, related_type, related_id) 
                VALUES (?, ?, 'INCOME', 'PURCHASE_RETURN', ?, ?, ?, ?, ?, ?, 'PURCHASE_RETURN', ?)`,
                [uuidv4(), returnDate, totalRefund, totalRefund, totalRefund, refund_method || 'CASH', refund_description || 'Debit Note Refund', bill.supplier_name, returnId]
            );
        }

        await connection.commit();
        res.status(200).json({
            message: 'Debit note processed — inventory adjusted, refund received',
            voucher_no: returnVoucherNo,
            refund_amount: totalRefund
        });

    } catch (err) {
        await connection.rollback();
        console.error("Purchase Return Failed", err);
        res.status(500).json({ error: err.message || 'Purchase Return Failed' });
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// DETAILED LEDGER: CUSTOMER
// ═══════════════════════════════════════════════════════════
export const fetchCustomerDetailedLedger = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, mode = 'PAKKA' } = req.query;
    try {
        const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
        if (customer.length === 0) return res.status(404).json({ error: 'Customer not found' });

        // 1. Get Invoices (Sales)
        const [sales] = await pool.query(`
            SELECT s.* ${mode === 'ACTUAL' ? ', lia.net_godown_total as actual_total' : ''}
            FROM sales s
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no' : ''}
            WHERE s.customer_id = ?
        `, [id]);

        let itemsMap = {};
        if (sales.length > 0) {
            const saleIds = sales.map(s => s.id);
            const actualPriceCol = mode === 'ACTUAL' ? 'si.actual_price' : 'NULL as actual_price';
            const [items] = await pool.query(`
                SELECT si.sale_id, si.name, si.qty, si.price, ${actualPriceCol}, si.cgst, si.sgst, si.gst_amount, si.price_after_gst, sh.shade_id_label as shade_label 
                FROM sale_items si 
                LEFT JOIN item_shades sh ON si.shade_id = sh.id 
                WHERE si.sale_id IN (?) 
                ORDER BY si.item_index ASC
            `, [saleIds]);
            items.forEach(i => {
                if (!itemsMap[i.sale_id]) itemsMap[i.sale_id] = [];
                itemsMap[i.sale_id].push(i);
            });

            // ── FORMAL OVERRIDES: If in ACTUAL mode, override with baseline snapshot for PENDING/REJECTED changes ──
            if (mode === 'ACTUAL') {
                for (let s of sales) {
                    const [changeReq] = await pool.query(
                        "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                        [s.id]
                    );
                    if (changeReq.length > 0) {
                        const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                            ? JSON.parse(changeReq[0].old_actual_snapshot)
                            : changeReq[0].old_actual_snapshot;

                        // Override details
                        s.invoice_number = snapshot.invoice_number || s.invoice_number;
                        s.sale_date = snapshot.sale_date || s.sale_date;
                        s.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : s.extra_charges;
                        s.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : s.insurance_amount;
                        s.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : s.actual_total;

                        // Override items
                        itemsMap[s.id] = (snapshot.items || []).map(item => ({
                            sale_id: s.id,
                            name: item.name || '—',
                            qty: item.qty || 0,
                            price: item.price || 0,
                            cgst: 0,
                            sgst: 0,
                            gst_amount: 0,
                            price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                            actual_price: item.actual_price || 0,
                            shade_label: item.shade_label || ''
                        }));
                    }
                }
            }
        }

        // 2. Get Payments (Cashbook)
        const [payments] = await pool.query(`
            SELECT * FROM cashbook_transactions 
            WHERE (related_type = 'SALES' AND related_id IN (SELECT id FROM sales WHERE customer_id = ?))
            OR (entity_name = ?)
        `, [id, customer[0].name]);

        // 3. Combine and Sort
        let ledger = [];
        
        let pakkaOpening = parseFloat(customer[0].opening_balance_pakka || 0);
        let actualOpening = parseFloat(customer[0].opening_balance_actual || 0);

        let allTxns = [];

        for (let s of sales) {
            const isReturn = s.invoice_number.startsWith('RET-');
            const pAmt = s.sale_type === 'PAKKA' ? parseFloat(s.total_amount) : 0;
            const aAmt = parseFloat(s.actual_total || s.total_amount);

            if (mode === 'PAKKA' && pAmt === 0) continue;

            const txn = {
                date: s.sale_date,
                type: isReturn ? 'RETURN' : 'INVOICE',
                ref: s.invoice_number,
                description: `Sale ${isReturn ? 'Return' : 'Invoice'}`,
                pakka_dr: isReturn ? 0 : pAmt,
                pakka_cr: isReturn ? Math.abs(pAmt) : 0,
                items: mode === 'PAKKA' ? (itemsMap[s.id] || []).map(stripActualPrice) : (itemsMap[s.id] || []),
                sale_id: s.id,
                extra_charges: s.extra_charges,
                extra_charge_name: s.extra_charge_name,
                insurance_amount: s.insurance_amount,
                insurance_name: s.insurance_name
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isReturn ? 0 : aAmt;
                txn.actual_cr = isReturn ? Math.abs(aAmt) : 0;
            }
            allTxns.push(txn);
        }

        for (let p of payments) {
            const pAmt = parseFloat(p.pakka_amount || 0);
            const aAmt = parseFloat(p.actual_amount || 0);
            const trueAmt = pAmt > 0 ? pAmt : aAmt;

            if (mode === 'PAKKA' && pAmt <= 0) continue;
            if (mode === 'ACTUAL' && trueAmt <= 0) continue;

            const isExpense = p.type === 'EXPENSE';

            const txn = {
                date: p.transaction_date,
                type: isExpense ? 'REFUND/LOAN' : 'PAYMENT',
                ref: p.id.substring(0, 8),
                description: isExpense ? `Payment Given (${p.payment_method}) - ${p.description}` : `Payment Received (${p.payment_method}) - ${p.description}`,
                pakka_dr: isExpense ? pAmt : 0,
                pakka_cr: isExpense ? 0 : pAmt
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isExpense ? trueAmt : 0;
                txn.actual_cr = isExpense ? 0 : trueAmt;
            }
            allTxns.push(txn);
        }

        allTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calculate Running Balances & Filter
        let pakkaBal = pakkaOpening;
        let actualBal = actualOpening;
        
        let pakkaWindowOpening = pakkaOpening;
        let actualWindowOpening = actualOpening;
        
        for (let t of allTxns) {
            const tDate = new Date(t.date);
            let inRange = true;
            if (startDate && tDate < new Date(startDate)) inRange = false;
            if (endDate && tDate > new Date(endDate)) inRange = false;

            if (startDate && tDate < new Date(startDate)) {
                pakkaBal += (t.pakka_dr - t.pakka_cr);
                actualBal += (t.actual_dr - t.actual_cr);
                pakkaWindowOpening = pakkaBal;
                actualWindowOpening = actualBal;
            } else if (inRange) {
                pakkaBal += (t.pakka_dr - t.pakka_cr);
                actualBal += (t.actual_dr - t.actual_cr);
                if (mode === 'PAKKA') {
                    const entry = { ...t, pakka_bal: pakkaBal };
                    if (t.items && t.items.length > 0) entry.items = t.items.map(stripActualPrice);
                    ledger.push(entry);
                } else {
                    ledger.push({ ...t, pakka_bal: pakkaBal, actual_bal: actualBal });
                }
            }
        }

        const openingEntry = {
            date: startDate || customer[0].created_at,
            type: 'OPENING',
            ref: 'OPENING_BAL',
            description: startDate ? `Opening balance as of ${formatToDDMMYY(startDate)}` : 'Opening balance at onboarding',
            pakka_dr: pakkaWindowOpening > 0 ? pakkaWindowOpening : 0,
            pakka_cr: pakkaWindowOpening < 0 ? -pakkaWindowOpening : 0,
            pakka_bal: pakkaWindowOpening,
            items: []
        };
        if (mode === 'ACTUAL') {
            openingEntry.actual_dr = actualWindowOpening > 0 ? actualWindowOpening : 0;
            openingEntry.actual_cr = actualWindowOpening < 0 ? -actualWindowOpening : 0;
            openingEntry.actual_bal = actualWindowOpening;
        }
        ledger.unshift(openingEntry);

        res.status(200).json(ledger);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch detailed ledger' });
    }
};

// ═══════════════════════════════════════════════════════════
// DETAILED LEDGER: SUPPLIER
// ═══════════════════════════════════════════════════════════
export const fetchSupplierDetailedLedger = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, mode = 'PAKKA' } = req.query;
    try {
        const [supplier] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
        if (supplier.length === 0) return res.status(404).json({ error: 'Supplier not found' });

        // 1. Get Bills (Purchases)
        const [bills] = await pool.query(`
            SELECT b.* ${mode === 'ACTUAL' ? ', lia.net_godown_total as actual_total' : ''}
            FROM supplier_bills b
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no' : ''}
            WHERE b.supplier_id = ? AND b.status = 'FULFILLED'
        `, [id]);

        let itemsMap = {};
        if (bills.length > 0) {
            const billIds = bills.map(b => b.id);
            const actualPriceCol = mode === 'ACTUAL' ? 'sbi.actual_price' : 'NULL as actual_price';
            const [items] = await pool.query(`
                SELECT sbi.bill_id, sbi.name, sbi.received_qty as qty, sbi.price, ${actualPriceCol}, sbi.cgst, sbi.sgst, sbi.price_after_gst, sh.shade_id_label as shade_label 
                FROM supplier_bill_items sbi 
                LEFT JOIN item_shades sh ON sbi.shade_id = sh.id 
                WHERE sbi.bill_id IN (?) 
                ORDER BY sbi.item_index ASC
            `, [billIds]);
            items.forEach(i => {
                if (!itemsMap[i.bill_id]) itemsMap[i.bill_id] = [];
                itemsMap[i.bill_id].push(i);
            });

            // ── FORMAL OVERRIDES: If in ACTUAL mode, override with baseline snapshot for PENDING/REJECTED changes ──
            if (mode === 'ACTUAL') {
                for (let b of bills) {
                    const [changeReq] = await pool.query(
                        "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                        [b.id]
                    );
                    if (changeReq.length > 0) {
                        const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                            ? JSON.parse(changeReq[0].old_actual_snapshot)
                            : changeReq[0].old_actual_snapshot;

                        // Override details
                        b.bill_number = snapshot.bill_number || b.bill_number;
                        b.bill_date = snapshot.bill_date || b.bill_date;
                        b.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : b.extra_charges;
                        b.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : b.insurance_amount;
                        b.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : b.actual_total;

                        // Override items
                        itemsMap[b.id] = (snapshot.items || []).map(item => ({
                            bill_id: b.id,
                            name: item.name || '—',
                            qty: item.qty || 0,
                            price: item.price || 0,
                            cgst: 0,
                            sgst: 0,
                            price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                            actual_price: item.actual_price || 0,
                            shade_label: item.shade_label || ''
                        }));
                    }
                }
            }
        }

        // 2. Get Payments (Cashbook)
        const [payments] = await pool.query(`
            SELECT * FROM cashbook_transactions 
            WHERE (related_type = 'PURCHASE' AND related_id IN (SELECT id FROM supplier_bills WHERE supplier_id = ?))
            OR (entity_name = ?)
        `, [id, supplier[0].name]);

        // 3. Combine and Sort
        let ledger = [];
        let pakkaOpening = parseFloat(supplier[0].opening_balance_pakka || 0);
        let actualOpening = parseFloat(supplier[0].opening_balance_actual || 0);
        let allTxns = [];

        for (let b of bills) {
            const isReturn = b.bill_number.startsWith('PRET-');
            const pAmt = parseFloat(b.total_amount);
            const aAmt = parseFloat(b.actual_total || b.total_amount);

            if (mode === 'PAKKA' && pAmt === 0) continue;

            const txn = {
                date: b.bill_date,
                type: isReturn ? 'RETURN' : 'INVOICE',
                ref: b.bill_number,
                description: `Purchase ${isReturn ? 'Return' : 'Bill'}`,
                pakka_dr: isReturn ? Math.abs(pAmt) : 0,
                pakka_cr: isReturn ? 0 : pAmt,
                items: mode === 'PAKKA' ? (itemsMap[b.id] || []).map(stripActualPrice) : (itemsMap[b.id] || []),
                bill_id: b.id,
                extra_charges: b.extra_charges,
                extra_charge_name: b.extra_charge_name,
                insurance_amount: b.insurance_amount,
                insurance_name: b.insurance_name
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isReturn ? Math.abs(aAmt) : 0;
                txn.actual_cr = isReturn ? 0 : aAmt;
            }
            allTxns.push(txn);
        }

        for (let p of payments) {
            const pAmt = parseFloat(p.pakka_amount || 0);
            const aAmt = parseFloat(p.actual_amount || 0);
            const trueAmt = pAmt > 0 ? pAmt : aAmt;

            if (mode === 'PAKKA' && pAmt <= 0) continue;
            if (mode === 'ACTUAL' && trueAmt <= 0) continue;

            const isIncome = p.type === 'INCOME';

            const txn = {
                date: p.transaction_date,
                type: isIncome ? 'REFUND' : 'PAYMENT',
                ref: p.id.substring(0, 8),
                description: isIncome ? `Refund Received (${p.payment_method}) - ${p.description}` : `Payment Made (${p.payment_method}) - ${p.description}`,
                pakka_dr: isIncome ? 0 : pAmt,
                pakka_cr: isIncome ? pAmt : 0
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isIncome ? 0 : trueAmt;
                txn.actual_cr = isIncome ? trueAmt : 0;
            }
            allTxns.push(txn);
        }

        allTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calculate Running Balances & Filter
        let pakkaBal = pakkaOpening;
        let actualBal = actualOpening;
        let pakkaWindowOpening = pakkaOpening;
        let actualWindowOpening = actualOpening;
        
        for (let t of allTxns) {
            const tDate = new Date(t.date);
            let inRange = true;
            if (startDate && tDate < new Date(startDate)) inRange = false;
            if (endDate && tDate > new Date(endDate)) inRange = false;

            if (startDate && tDate < new Date(startDate)) {
                pakkaBal += (t.pakka_cr - t.pakka_dr);
                actualBal += (t.actual_cr - t.actual_dr);
                pakkaWindowOpening = pakkaBal;
                actualWindowOpening = actualBal;
            } else if (inRange) {
                pakkaBal += (t.pakka_cr - t.pakka_dr);
                actualBal += (t.actual_cr - t.actual_dr);
                if (mode === 'PAKKA') {
                    const entry = { ...t, pakka_bal: pakkaBal };
                    if (t.items && t.items.length > 0) entry.items = t.items.map(stripActualPrice);
                    ledger.push(entry);
                } else {
                    ledger.push({ ...t, pakka_bal: pakkaBal, actual_bal: actualBal });
                }
            }
        }

        const openingEntry = {
            date: startDate || supplier[0].created_at,
            type: 'OPENING',
            ref: 'OPENING_BAL',
            description: startDate ? `Opening balance as of ${formatToDDMMYY(startDate)}` : 'Opening balance at onboarding',
            pakka_dr: pakkaWindowOpening > 0 ? pakkaWindowOpening : 0,
            pakka_cr: pakkaWindowOpening < 0 ? -pakkaWindowOpening : 0,
            pakka_bal: pakkaWindowOpening,
            items: []
        };
        if (mode === 'ACTUAL') {
            openingEntry.actual_dr = actualWindowOpening > 0 ? actualWindowOpening : 0;
            openingEntry.actual_cr = actualWindowOpening < 0 ? -actualWindowOpening : 0;
            openingEntry.actual_bal = actualWindowOpening;
        }
        ledger.unshift(openingEntry);

        res.status(200).json(ledger);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch detailed supplier ledger' });
    }
};

export const deleteSale = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [sale] = await connection.query('SELECT voucher_no, invoice_number FROM sales WHERE id = ?', [id]);
        if (sale.length > 0) {
            const vNo = sale[0].voucher_no;
            const invoiceNumber = sale[0].invoice_number || '';
            const isReturn = invoiceNumber.startsWith('RET-');

            // Adjust inventory before deleting items
            const [items] = await connection.query('SELECT shade_id, qty FROM sale_items WHERE sale_id = ?', [id]);
            for (const item of items) {
                const qtyToRevert = parseFloat(item.qty) || 0;
                if (item.shade_id && qtyToRevert > 0) {
                    if (isReturn) {
                        // It was a return (qty added back to inventory). Deleting it means taking it out.
                        await connection.query('UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?', [qtyToRevert, item.shade_id]);
                    } else {
                        // Regular sale (qty taken from inventory). Deleting it means putting it back.
                        await connection.query('UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?', [qtyToRevert, item.shade_id]);
                    }
                }
            }

            // Clean up any automatic cashbook transaction created for this sale
            await connection.query(
                'DELETE FROM cashbook_transactions WHERE related_id = ? AND related_type = "SALES" AND is_automatic = TRUE',
                [id]
            );

            // Clean up any change requests
            await connection.query(
                'DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = "SALE"',
                [id]
            );

            await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);
            await connection.query('DELETE FROM sales WHERE id = ?', [id]);

            if (vNo) {
                await connection.query('DELETE FROM ledger_internal_actual WHERE voucher_no = ?', [vNo]);
                await connection.query('DELETE FROM ledger_formal_pakka WHERE voucher_no = ?', [vNo]);
            }
        }
        await connection.commit();
        res.status(200).json({ message: 'Sale and associated records deleted' });
    } catch (err) {
        console.error('Failed to delete sale:', err);
        await connection.rollback();
        res.status(500).json({ error: err.message || 'Failed to delete sale' });
    } finally {
        connection.release();
    }
};

export const deletePurchase = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [po] = await connection.query('SELECT voucher_no, bill_number FROM supplier_bills WHERE id = ?', [id]);
        if (po.length > 0) {
            const vNo = po[0].voucher_no;
            const billNumber = po[0].bill_number || '';
            const isReturn = billNumber.startsWith('PRET-');

            // Adjust inventory before deleting items (column is received_qty in supplier_bill_items)
            const [items] = await connection.query('SELECT shade_id, received_qty FROM supplier_bill_items WHERE bill_id = ?', [id]);
            for (const item of items) {
                const qtyToRevert = parseFloat(item.received_qty) || 0;
                if (item.shade_id && qtyToRevert > 0) {
                    if (isReturn) {
                        // It was a purchase return (qty removed from inventory). Deleting it means adding it back.
                        await connection.query('UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?', [qtyToRevert, item.shade_id]);
                    } else {
                        // Regular purchase (qty added to inventory). Deleting it means removing it.
                        await connection.query('UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?', [qtyToRevert, item.shade_id]);
                    }
                }
            }

            // Clean up any automatic cashbook transaction created for this purchase
            await connection.query(
                'DELETE FROM cashbook_transactions WHERE related_id = ? AND related_type = "PURCHASE" AND is_automatic = TRUE',
                [id]
            );

            // Clean up any change requests
            await connection.query(
                'DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = "PURCHASE"',
                [id]
            );

            await connection.query('DELETE FROM supplier_bill_items WHERE bill_id = ?', [id]);
            await connection.query('DELETE FROM supplier_bills WHERE id = ?', [id]);

            if (vNo) {
                await connection.query('DELETE FROM ledger_internal_actual WHERE voucher_no = ?', [vNo]);
                await connection.query('DELETE FROM ledger_formal_pakka WHERE voucher_no = ?', [vNo]);
            }
        }
        await connection.commit();
        res.status(200).json({ message: 'Purchase and associated records deleted' });
    } catch (err) {
        console.error('Failed to delete purchase:', err);
        await connection.rollback();
        res.status(500).json({ error: err.message || 'Failed to delete purchase' });
    } finally {
        connection.release();
    }
};


// Helper to increment setting sequence
const incrementSequenceSetting = async (connection, settingsKey, currentNumberStr) => {
    if (!settingsKey) return;
    const match = currentNumberStr.match(/(\d+)$/);
    if (match) {
        const currentNum = parseInt(match[1]);
        const nextNum = currentNum + 1;
        await connection.query(`
            INSERT INTO settings (\`key\`, value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE value = ?
        `, [settingsKey, nextNum.toString(), nextNum.toString()]);
    }
};

// Helper to get next sequential number based on settings or ANY last record
const getNextInvoiceNumber = async (connection, table, column, defaultPrefix = 'INV-', settingsKey = null) => {
    if (settingsKey) {
        const [settingRows] = await connection.query(`SELECT value FROM settings WHERE \`key\` = ?`, [settingsKey]);
        if (settingRows.length > 0 && settingRows[0].value) {
            const numStr = settingRows[0].value.toString();
            return `${defaultPrefix}${numStr.padStart(4, '0')}`;
        }
    }

    const [lastRow] = await connection.query(`SELECT ${column} FROM ${table} WHERE ${column} LIKE ? ORDER BY created_at DESC LIMIT 1`, [`${defaultPrefix}%`]);
    if (lastRow.length === 0) return `${defaultPrefix}0001`;

    const lastNo = lastRow[0][column];
    const match = lastNo.match(/^(.*?)(\d+)$/);
    if (!match) return `${lastNo}-0001`; // Fallback if no digits found

    const prefix = match[1];
    const numStr = match[2];
    const nextNum = (parseInt(numStr) + 1).toString().padStart(numStr.length, '0');
    return `${prefix}${nextNum}`;
};

// Helper for cascading numbering (Updates ALL subsequent based on chronological order)
const updateSequenceCascading = async (connection, table, column, startId, newNumber) => {
    // 1. Get all bills ordered by creation date
    const [allBills] = await connection.query(`SELECT id, created_at FROM ${table} ORDER BY created_at ASC`);
    
    // 2. Find the index of the edited bill
    const startIndex = allBills.findIndex(b => b.id === startId);
    if (startIndex === -1) return;

    // 3. Parse the new number
    const match = newNumber.match(/^(.*?)(\d+)$/);
    if (!match) return;

    const prefix = match[1];
    const numStr = match[2];
    let currentNum = parseInt(numStr);
    const padding = numStr.length;

    // 4. Update every bill AFTER the edited one in the chronological chain
    for (let i = startIndex + 1; i < allBills.length; i++) {
        currentNum++;
        const nextInvoiceNo = `${prefix}${currentNum.toString().padStart(padding, '0')}`;
        await connection.query(`UPDATE ${table} SET ${column} = ? WHERE id = ?`, [nextInvoiceNo, allBills[i].id]);
    }
};

export const updateSaleInvoiceNumber = async (req, res) => {
    const { id } = req.params;
    const { invoice_number } = req.body;
    if (!invoice_number) return res.status(400).json({ error: 'New invoice number required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE sales SET invoice_number = ? WHERE id = ?', [invoice_number, id]);
        await updateSequenceCascading(connection, 'sales', 'invoice_number', id, invoice_number);
        await connection.commit();
        res.status(200).json({ message: 'Sales sequence updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Sequence update failed' });
    } finally {
        connection.release();
    }
};

export const updatePurchaseBillNumber = async (req, res) => {
    const { id } = req.params;
    const { bill_number } = req.body;
    if (!bill_number) return res.status(400).json({ error: 'New bill number required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE supplier_bills SET bill_number = ? WHERE id = ?', [bill_number, id]);
        await updateSequenceCascading(connection, 'supplier_bills', 'bill_number', id, bill_number);
        await connection.commit();
        res.status(200).json({ message: 'Purchase sequence updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Sequence update failed' });
    } finally {
        connection.release();
    }
};
export const updateSaleDate = async (req, res) => {
    const { id } = req.params;
    const { sale_date } = req.body;
    if (!sale_date) return res.status(400).json({ error: 'New sale date required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const formattedDate = formatDateYYYYMMDD(sale_date);
        
        // 1. Update sales record
        await connection.query('UPDATE sales SET sale_date = ? WHERE id = ?', [formattedDate, id]);
        
        // 2. Sync with cashbook if there was an advance payment
        await connection.query('UPDATE cashbook_transactions SET transaction_date = ? WHERE related_id = ? AND related_type = "SALES" AND is_automatic = TRUE', [formattedDate, id]);
        
        await connection.commit();
        res.status(200).json({ message: 'Sale date updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Date update failed' });
    } finally {
        connection.release();
    }
};

export const updatePurchaseDate = async (req, res) => {
    const { id } = req.params;
    const { bill_date } = req.body;
    if (!bill_date) return res.status(400).json({ error: 'New bill date required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const formattedDate = formatDateYYYYMMDD(bill_date);
        
        // 1. Update supplier_bills record
        await connection.query('UPDATE supplier_bills SET bill_date = ? WHERE id = ?', [formattedDate, id]);
        
        // 2. Sync with cashbook if there was an advance payment
        await connection.query('UPDATE cashbook_transactions SET transaction_date = ? WHERE related_id = ? AND related_type = "PURCHASE" AND is_automatic = TRUE', [formattedDate, id]);
        
        await connection.commit();
        res.status(200).json({ message: 'Purchase date updated' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Date update failed' });
    } finally {
        connection.release();
    }
};

export const updateSaleFull = async (req, res) => {
    const { id } = req.params;
    const { items: new_items, sale_date, invoice_number, destination, extra_charges, extra_charge_name, insurance_amount, insurance_name, billing_address, customer_gst, dispatch_through, customer_id, customer_name, source } = req.body;
    const isFormalEdit = source === 'FORMAL';
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Fetch existing sale
        const [sale] = await connection.query('SELECT * FROM sales WHERE id = ?', [id]);
        if (sale.length === 0) throw new Error("Sale not found");
        const existingSale = sale[0];
        const vNo = existingSale.voucher_no;

        // ── FORMAL EDIT: Snapshot actual state BEFORE any changes ──
        let oldActualPriceMap = {};
        let oldActualNet = 0;
        let oldActualSnapshot = null;
        if (isFormalEdit) {
            // Check if there is already a PENDING or REJECTED change request for this bill
            const [existingPending] = await connection.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [id, 'SALE']
            );

            if (existingPending.length > 0) {
                // Reuse the old snapshot because it represents the actual state before ANY unaccepted edits
                oldActualSnapshot = typeof existingPending[0].old_actual_snapshot === 'string'
                    ? JSON.parse(existingPending[0].old_actual_snapshot)
                    : existingPending[0].old_actual_snapshot;
                
                // Populate oldActualPriceMap so we can still preserve the old actual prices in sale_items
                (oldActualSnapshot.items || []).forEach(item => {
                    oldActualPriceMap[item.shade_id] = parseFloat(item.actual_price || 0);
                });
                oldActualNet = parseFloat(oldActualSnapshot.old_actual_net || 0);
            } else {
                // No pending request, capture the current state as the baseline
                const [prevItems] = await connection.query('SELECT shade_id, actual_price FROM sale_items WHERE sale_id = ?', [id]);
                prevItems.forEach(i => { oldActualPriceMap[i.shade_id] = parseFloat(i.actual_price || 0); });
                const [prevLedger] = await connection.query('SELECT net_godown_total FROM ledger_internal_actual WHERE voucher_no = ?', [vNo]);
                if (prevLedger.length > 0) oldActualNet = parseFloat(prevLedger[0].net_godown_total || 0);

                // Fetch old items with quantities and formal prices
                const [oldItemsDetails] = await connection.query(`
                    SELECT si.shade_id, si.qty, si.price as formal_price, si.actual_price, sh.shade_id_label as shade_label, si.name
                    FROM sale_items si
                    LEFT JOIN item_shades sh ON si.shade_id = sh.id
                    WHERE si.sale_id = ?
                    ORDER BY si.item_index ASC
                `, [id]);

                oldActualSnapshot = {
                    old_actual_net: oldActualNet,
                    invoice_number: existingSale.invoice_number,
                    sale_date: existingSale.sale_date,
                    customer_name: existingSale.customer_name,
                    extra_charges: parseFloat(existingSale.extra_charges || 0),
                    insurance_amount: parseFloat(existingSale.insurance_amount || 0),
                    items: oldItemsDetails.map(i => ({
                        shade_id: i.shade_id,
                        name: i.name,
                        shade_label: i.shade_label || '',
                        qty: parseFloat(i.qty || 0),
                        price: parseFloat(i.formal_price || 0),
                        actual_price: parseFloat(i.actual_price || 0)
                    }))
                };
            }
        }

        // Fetch old items
        const [oldItems] = await connection.query('SELECT shade_id, qty, price, actual_price FROM sale_items WHERE sale_id = ?', [id]);

        // Revert old stock
        for (let oldItem of oldItems) {
            await connection.query('UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?', [oldItem.qty, oldItem.shade_id]);
        }

        // Delete old items
        await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

        // Recalculate totals and apply new items
        const parsedExtraCharges = extra_charges !== undefined ? parseFloat(extra_charges || 0) : parseFloat(existingSale.extra_charges || 0);
        const parsedInsuranceAmount = insurance_amount !== undefined ? parseFloat(insurance_amount || 0) : parseFloat(existingSale.insurance_amount || 0);
        let formalSubtotal = 0;
        let actualNet = parsedExtraCharges + parsedInsuranceAmount;
        let totalGstAmount = 0;
        const lineItems = [];

        for (let entry of new_items) {
            const [itemInfo] = await connection.query(`
                SELECT i.id as item_id, i.name, i.hsn_code, i.base_pakka_selling_rate, i.tax_bracket_percent, sh.shade_category, sh.shade_id_label
                FROM items i
                JOIN item_shades sh ON sh.id = ?
                WHERE i.id = sh.item_id
            `, [entry.shade_id]);

            if (itemInfo.length === 0) throw new Error(`Item for shade ${entry.shade_id} not found.`);
            const rule = itemInfo[0];
            
            // Check Mapping for Godown Pricing
            const [mappingInfo] = await connection.query(`
                SELECT actual_selling_price FROM customer_item_mapping 
                WHERE customer_id = ? AND item_id = ?
            `, [existingSale.customer_id, rule.item_id]);

            const basePakka = (entry.price !== undefined && entry.price !== null) ? parseFloat(entry.price) : (entry.pakka_price ? parseFloat(entry.pakka_price) : parseFloat(rule.base_pakka_selling_rate));
            
            const actualPrice = (entry.actual_price !== undefined && entry.actual_price !== null)
                ? parseFloat(entry.actual_price)
                : ((entry.actualPrice !== undefined && entry.actualPrice !== null)
                    ? parseFloat(entry.actualPrice)
                    : (mappingInfo.length > 0 ? parseFloat(mappingInfo[0].actual_selling_price) : basePakka));

            // Computed actual price (from mapping or explicit) — used for the change request snapshot
            let computedActualPrice;
            if (isFormalEdit) {
                computedActualPrice = mappingInfo.length > 0 ? parseFloat(mappingInfo[0].actual_selling_price) : basePakka;
            } else {
                computedActualPrice = actualPrice;
            }

            // For FORMAL edits: preserve old actual_price in sale_items so godown portal is unchanged until accepted
            const preservedActualPrice = isFormalEdit
                ? (oldActualPriceMap.hasOwnProperty(entry.shade_id) ? oldActualPriceMap[entry.shade_id] : computedActualPrice)
                : computedActualPrice;

            const qty = parseFloat(entry.qty);
            const taxRate = parseFloat(rule.tax_bracket_percent);
            const lineSubtotal = basePakka * qty;
            const lineGst = lineSubtotal * (taxRate / 100);
            const lineTotalAfterGst = lineSubtotal + lineGst;

            formalSubtotal += lineSubtotal;
            totalGstAmount += lineGst;
            actualNet += (computedActualPrice * qty); // Always compute what new actual WOULD be

            // Deduct Stock
            await connection.query('UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?', [qty, entry.shade_id]);

            lineItems.push({
                shade_id: entry.shade_id,
                shade_category: rule.shade_category || 'GENERAL',
                shade_label: rule.shade_id_label || '',
                name: rule.name,
                hsn: rule.hsn_code,
                qty,
                price: basePakka,
                actual_price: preservedActualPrice,     // Saved to sale_items (old value preserved for FORMAL)
                computed_actual_price: computedActualPrice, // For the change request snapshot
                standard_formal_price: parseFloat(rule.base_pakka_selling_rate || 0),
                standard_actual_price: mappingInfo.length > 0 ? parseFloat(mappingInfo[0].actual_selling_price) : parseFloat(rule.base_pakka_selling_rate || 0),
                cgst: lineGst / 2,
                sgst: lineGst / 2,
                gst_amount: lineGst,
                price_after_gst: lineTotalAfterGst
            });
        }

        const insuranceGst = parsedInsuranceAmount * 0.18;
        totalGstAmount += insuranceGst;
        const exactFormalTotal = formalSubtotal + totalGstAmount + parsedExtraCharges + parsedInsuranceAmount;
        const formalTotal = Math.round(exactFormalTotal);
        const roundOff = formalTotal - exactFormalTotal;
        const advAmt = parseFloat(existingSale.amount_paid || 0);
        const finalBalance = formalTotal - advAmt;
        const pStatus = finalBalance <= 0 ? 'PAID' : (advAmt > 0 ? 'PARTIALLY_PAID' : 'PENDING');
        const rawSaleDate = sale_date || existingSale.sale_date;
        const sdObj = new Date(rawSaleDate);
        const formattedDate = typeof rawSaleDate === 'string' && rawSaleDate.includes('-')
            ? rawSaleDate.split('T')[0]
            : `${sdObj.getFullYear()}-${String(sdObj.getMonth()+1).padStart(2,'0')}-${String(sdObj.getDate()).padStart(2,'0')}`;

        // Update sales table (always — formal data applies immediately)
        await connection.query(
            `UPDATE sales SET 
             invoice_number = ?, sale_date = ?, subtotal = ?, total_gst_amount = ?, total_amount = ?, balance = ?, payment_status = ?, destination = ?, extra_charges = ?, extra_charge_name = ?, insurance_amount = ?, insurance_name = ?, billing_address = ?, customer_gst = ?, dispatch_through = ?, round_off = ?, customer_id = ?, customer_name = ?
             WHERE id = ?`,
            [
                invoice_number || existingSale.invoice_number, 
                formattedDate, 
                formalSubtotal, 
                totalGstAmount, 
                formalTotal, 
                finalBalance, 
                pStatus, 
                destination !== undefined ? destination : existingSale.destination, 
                parsedExtraCharges, 
                extra_charge_name !== undefined ? extra_charge_name : existingSale.extra_charge_name,
                parsedInsuranceAmount,
                insurance_name !== undefined ? insurance_name : existingSale.insurance_name,
                billing_address !== undefined ? billing_address : existingSale.billing_address,
                customer_gst !== undefined ? customer_gst : existingSale.customer_gst,
                dispatch_through !== undefined ? dispatch_through : existingSale.dispatch_through,
                roundOff,
                customer_id || existingSale.customer_id,
                customer_name || existingSale.customer_name,
                id
            ]
        );

        if (customer_id && customer_id !== existingSale.customer_id) {
            await connection.query('UPDATE ledger_formal_pakka SET entity_id = ? WHERE voucher_no = ?', [customer_id, vNo]);
            if (!isFormalEdit) await connection.query('UPDATE ledger_internal_actual SET entity_id = ? WHERE voucher_no = ?', [customer_id, vNo]);
            await connection.query('UPDATE cashbook_transactions SET entity_name = ? WHERE related_id = ? AND related_type = "SALES"', [customer_name || 'Customer', id]);
        }

        // Update ledger_formal_pakka (always)
        await connection.query(
            `UPDATE ledger_formal_pakka SET 
             total_taxable_value = ?, total_tax_computed = ?, net_invoice_total = ? 
             WHERE voucher_no = ?`,
            [formalSubtotal, totalGstAmount, formalTotal, vNo]
        );

        // Update cashbook if date changed
        if (sale_date) {
            await connection.query('UPDATE cashbook_transactions SET transaction_date = ? WHERE related_id = ? AND related_type = "SALES" AND is_automatic = TRUE', [formattedDate, id]);
        }

        // Insert new items (actual_price is preserved old value for FORMAL edits)
        for (let i = 0; i < lineItems.length; i++) {
            let item = lineItems[i];
            await connection.query(
                `INSERT INTO sale_items (id, sale_id, shade_id, shade_category, name, hsn, qty, price, actual_price, cgst, sgst, gst_amount, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), id, item.shade_id, item.shade_category, item.name, item.hsn, item.qty, item.price, item.actual_price, item.cgst, item.sgst, item.gst_amount, item.price_after_gst, i]
            );
        }

        if (isFormalEdit) {
            // ── FORMAL PATH: Create/overwrite pending change request, don't update actual ledger ──
            const newFormalSnapshot = {
                new_actual_net: actualNet,
                invoice_number: invoice_number || existingSale.invoice_number,
                sale_date: formattedDate,
                customer_name: customer_name || existingSale.customer_name,
                extra_charges: parsedExtraCharges,
                insurance_amount: parsedInsuranceAmount,
                prev_formal_items: oldItems.map(i => ({
                    shade_id: i.shade_id,
                    qty: parseFloat(i.qty || 0),
                    price: parseFloat(i.price || 0),
                    actual_price: parseFloat(i.actual_price || 0)
                })),
                items: lineItems.map(item => ({
                    shade_id: item.shade_id,
                    name: item.name,
                    shade_label: item.shade_label,
                    qty: item.qty,
                    price: item.price,
                    actual_price: item.computed_actual_price,
                    standard_formal_price: item.standard_formal_price,
                    standard_actual_price: item.standard_actual_price
                }))
            };
            // (oldActualSnapshot is captured comprehensively at the top of the function)
            // Upsert: delete existing PENDING for this bill, then insert fresh request
            await connection.query(
                "DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED')",
                [id, 'SALE']
            );
            await connection.query(
                `INSERT INTO bill_change_requests (id, bill_type, formal_id, voucher_no, status, old_actual_snapshot, new_actual_snapshot, changed_by)
                 VALUES (?, 'SALE', ?, ?, 'PENDING', ?, ?, ?)`,
                [uuidv4(), id, vNo, JSON.stringify(oldActualSnapshot), JSON.stringify(newFormalSnapshot), req.user?.id || 'FORMAL_PORTAL']
            );
            // ledger_internal_actual is NOT updated — godown portal stays unchanged until they accept
        } else {
            // ── ACTUAL / DUAL PATH: Update actual ledger immediately, clear any pending request ──
            await connection.query(
                'UPDATE ledger_internal_actual SET net_godown_total = ? WHERE voucher_no = ?',
                [actualNet, vNo]
            );
            // Actual portal edit overrides any pending formal change request
            await connection.query(
                "DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED')",
                [id, 'SALE']
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Sale updated successfully' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("updateSaleFull FAILED", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

export const updatePurchaseFull = async (req, res) => {
    const { id } = req.params;
    const { items: new_items, bill_date, bill_number, billing_address, supplier_gst, dispatch_through, destination, extra_charges, extra_charge_name, insurance_amount, insurance_name, gst_type, supplier_id, supplier_name, source } = req.body;
    const isFormalEdit = source === 'FORMAL';
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Fetch existing purchase
        const [purchase] = await connection.query('SELECT * FROM supplier_bills WHERE id = ?', [id]);
        if (purchase.length === 0) throw new Error("Purchase not found");
        const existingPurchase = purchase[0];
        const vNo = existingPurchase.voucher_no;
        const isFulfilled = existingPurchase.status === 'FULFILLED';

        // ── FORMAL EDIT: Snapshot actual state BEFORE any changes ──
        let oldActualPriceMap = {};
        let oldActualNet = 0;
        let oldActualSnapshot = null;
        if (isFormalEdit) {
            // Check if there is already a PENDING or REJECTED change request
            const [existingPending] = await connection.query(
                "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                [id, 'PURCHASE']
            );

            if (existingPending.length > 0) {
                oldActualSnapshot = typeof existingPending[0].old_actual_snapshot === 'string'
                    ? JSON.parse(existingPending[0].old_actual_snapshot)
                    : existingPending[0].old_actual_snapshot;

                (oldActualSnapshot.items || []).forEach(item => {
                    oldActualPriceMap[item.shade_id] = parseFloat(item.actual_price || 0);
                });
                oldActualNet = parseFloat(oldActualSnapshot.old_actual_net || 0);
            } else {
                const [prevItems] = await connection.query('SELECT shade_id, actual_price FROM supplier_bill_items WHERE bill_id = ?', [id]);
                prevItems.forEach(i => { oldActualPriceMap[i.shade_id] = parseFloat(i.actual_price || 0); });
                if (vNo) {
                    const [prevLedger] = await connection.query('SELECT net_godown_total FROM ledger_internal_actual WHERE voucher_no = ?', [vNo]);
                    if (prevLedger.length > 0) oldActualNet = parseFloat(prevLedger[0].net_godown_total || 0);
                }

                // Fetch old items with quantities and formal prices
                const [oldItemsDetails] = await connection.query(`
                    SELECT sbi.shade_id, sbi.received_qty as qty, sbi.price as formal_price, sbi.actual_price, sh.shade_id_label as shade_label, sbi.name
                    FROM supplier_bill_items sbi
                    LEFT JOIN item_shades sh ON sbi.shade_id = sh.id
                    WHERE sbi.bill_id = ?
                    ORDER BY sbi.item_index ASC
                `, [id]);

                oldActualSnapshot = {
                    old_actual_net: oldActualNet,
                    bill_number: existingPurchase.bill_number,
                    bill_date: existingPurchase.bill_date,
                    supplier_name: existingPurchase.supplier_name,
                    extra_charges: parseFloat(existingPurchase.extra_charges || 0),
                    insurance_amount: parseFloat(existingPurchase.insurance_amount || 0),
                    items: oldItemsDetails.map(i => ({
                        shade_id: i.shade_id,
                        name: i.name,
                        shade_label: i.shade_label || '',
                        qty: parseFloat(i.qty || 0),
                        price: parseFloat(i.formal_price || 0),
                        actual_price: parseFloat(i.actual_price || 0)
                    }))
                };
            }
        }

        // Fetch old items
        const [oldItems] = await connection.query('SELECT shade_id, received_qty as qty, price, actual_price FROM supplier_bill_items WHERE bill_id = ?', [id]);

        // Revert old stock if fulfilled
        if (isFulfilled) {
            for (let oldItem of oldItems) {
                await connection.query('UPDATE item_shades SET available_qty = available_qty - ? WHERE id = ?', [oldItem.qty, oldItem.shade_id]);
            }
        }

        // Delete old items
        await connection.query('DELETE FROM supplier_bill_items WHERE bill_id = ?', [id]);

        // Recalculate totals and apply new items
        const parsedExtraCharges = extra_charges !== undefined ? parseFloat(extra_charges || 0) : parseFloat(existingPurchase.extra_charges || 0);
        const parsedInsuranceAmount = insurance_amount !== undefined ? parseFloat(insurance_amount || 0) : parseFloat(existingPurchase.insurance_amount || 0);
        let formalSubtotal = 0;
        let actualNet = parsedExtraCharges + parsedInsuranceAmount;
        let totalGstAmount = 0;
        const lineItems = [];

        for (let entry of new_items) {
            const [itemInfo] = await connection.query(`
                SELECT i.id as item_id, i.name, i.hsn_code, i.base_pakka_purchase_rate, i.tax_bracket_percent, sh.shade_category, sh.shade_id_label
                FROM items i
                JOIN item_shades sh ON sh.id = ?
                WHERE i.id = sh.item_id
            `, [entry.shade_id]);

            if (itemInfo.length === 0) throw new Error(`Item for shade ${entry.shade_id} not found.`);
            const rule = itemInfo[0];

            const [mappingInfo] = await connection.query(`
                SELECT pakka_buying_rate, kaccha_deduction_commission FROM supplier_item_mapping 
                WHERE supplier_id = ? AND item_id = ?
            `, [supplier_id || existingPurchase.supplier_id, rule.item_id]);
            const map = mappingInfo[0] || { pakka_buying_rate: 0, kaccha_deduction_commission: 0 };
            const deduction = parseFloat(map.kaccha_deduction_commission || 0);

            const basePakka = (entry.price !== undefined && entry.price !== null) ? parseFloat(entry.price) : (entry.pakka_price ? parseFloat(entry.pakka_price) : parseFloat(rule.base_pakka_purchase_rate));
            
            const actualPrice = (entry.actual_price !== undefined && entry.actual_price !== null)
                ? parseFloat(entry.actual_price)
                : ((entry.actualPrice !== undefined && entry.actualPrice !== null)
                    ? parseFloat(entry.actualPrice)
                    : (basePakka + deduction));

            let computedActualPrice;
            if (isFormalEdit) {
                computedActualPrice = basePakka + deduction;
            } else {
                computedActualPrice = actualPrice;
            }

            // For FORMAL edits: preserve old actual_price in supplier_bill_items
            const preservedActualPrice = isFormalEdit
                ? (oldActualPriceMap.hasOwnProperty(entry.shade_id) ? oldActualPriceMap[entry.shade_id] : computedActualPrice)
                : computedActualPrice;

            const qty = parseFloat(entry.qty);
            const taxRate = parseFloat(rule.tax_bracket_percent);
            const lineSubtotal = basePakka * qty;
            const lineGst = lineSubtotal * (taxRate / 100);
            const lineTotalAfterGst = lineSubtotal + lineGst;

            formalSubtotal += lineSubtotal;
            totalGstAmount += lineGst;
            actualNet += (computedActualPrice * qty);

            // Add Stock if fulfilled
            if (isFulfilled) {
                await connection.query('UPDATE item_shades SET available_qty = available_qty + ? WHERE id = ?', [qty, entry.shade_id]);
            }

            const isInterstate = (gst_type || existingPurchase.gst_type || 'LOCAL') === 'INTERSTATE';
            const cgst = isInterstate ? 0 : (lineGst / 2);
            const sgst = isInterstate ? 0 : (lineGst / 2);
            const igst = isInterstate ? lineGst : 0;

            lineItems.push({
                shade_id: entry.shade_id,
                shade_category: rule.shade_category || 'GENERAL',
                shade_label: rule.shade_id_label || '',
                name: rule.name,
                hsn: rule.hsn_code,
                qty,
                price: basePakka,
                actual_price: preservedActualPrice,
                computed_actual_price: computedActualPrice,
                standard_formal_price: parseFloat(rule.base_pakka_purchase_rate || 0),
                standard_actual_price: basePakka + deduction,
                cgst,
                sgst,
                igst,
                gst_amount: lineGst,
                price_after_gst: lineTotalAfterGst
            });
        }

        const insuranceGst = parsedInsuranceAmount * 0.18;
        totalGstAmount += insuranceGst;
        const exactFormalTotal = formalSubtotal + totalGstAmount + parsedExtraCharges + parsedInsuranceAmount;
        const formalTotal = Math.round(exactFormalTotal);
        const roundOff = formalTotal - exactFormalTotal;
        const advAmt = parseFloat(existingPurchase.amount_paid || 0);
        const finalBalance = formalTotal - advAmt;
        const pStatus = finalBalance <= 0 ? 'PAID' : (advAmt > 0 ? 'PARTIALLY_PAID' : 'PENDING');
        const rawBillDate = bill_date || existingPurchase.bill_date;
        const bdObj = new Date(rawBillDate);
        const formattedDate = typeof rawBillDate === 'string' && rawBillDate.includes('-')
            ? rawBillDate.split('T')[0]
            : `${bdObj.getFullYear()}-${String(bdObj.getMonth()+1).padStart(2,'0')}-${String(bdObj.getDate()).padStart(2,'0')}`;

        // Update supplier_bills table (always — formal data applies immediately)
        await connection.query(
            `UPDATE supplier_bills SET 
             bill_number = ?, bill_date = ?, subtotal = ?, total_gst_amount = ?, total_amount = ?, balance_amount = ?, round_off = ?, billing_address = ?, supplier_gst = ?, dispatch_through = ?, destination = ?, extra_charges = ?, extra_charge_name = ?, insurance_amount = ?, insurance_name = ?, gst_type = ?, supplier_id = ? 
             WHERE id = ?`,
            [
                bill_number || existingPurchase.bill_number, 
                formattedDate, 
                formalSubtotal, 
                totalGstAmount, 
                formalTotal, 
                finalBalance, 
                roundOff,
                billing_address !== undefined ? billing_address : existingPurchase.billing_address,
                supplier_gst !== undefined ? supplier_gst : existingPurchase.supplier_gst,
                dispatch_through !== undefined ? dispatch_through : existingPurchase.dispatch_through,
                destination !== undefined ? destination : existingPurchase.destination,
                parsedExtraCharges,
                extra_charge_name !== undefined ? extra_charge_name : existingPurchase.extra_charge_name,
                parsedInsuranceAmount,
                insurance_name !== undefined ? insurance_name : existingPurchase.insurance_name,
                gst_type || existingPurchase.gst_type || 'LOCAL',
                supplier_id || existingPurchase.supplier_id,
                id
            ]
        );

        if (supplier_id && supplier_id !== existingPurchase.supplier_id) {
            if (vNo) {
                await connection.query('UPDATE ledger_formal_pakka SET entity_id = ? WHERE voucher_no = ?', [supplier_id, vNo]);
                if (!isFormalEdit) await connection.query('UPDATE ledger_internal_actual SET entity_id = ? WHERE voucher_no = ?', [supplier_id, vNo]);
            }
            await connection.query('UPDATE cashbook_transactions SET entity_name = ? WHERE related_id = ? AND related_type = "PURCHASE"', [supplier_name || 'Supplier', id]);
        }

        // Update formal ledger (always)
        if (vNo) {
            await connection.query(
                `UPDATE ledger_formal_pakka SET 
                 total_taxable_value = ?, total_tax_computed = ?, net_invoice_total = ? 
                 WHERE voucher_no = ?`,
                [formalSubtotal, totalGstAmount, formalTotal, vNo]
            );
        }

        // Update cashbook if date changed
        if (bill_date) {
            await connection.query('UPDATE cashbook_transactions SET transaction_date = ? WHERE related_id = ? AND related_type = "PURCHASE" AND is_automatic = TRUE', [formattedDate, id]);
        }

        // Insert new items (actual_price is preserved old value for FORMAL edits)
        for (let i = 0; i < lineItems.length; i++) {
            let item = lineItems[i];
            await connection.query(
                `INSERT INTO supplier_bill_items (id, bill_id, shade_id, shade_category, name, hsn, received_qty, price, actual_price, cgst, sgst, igst, price_after_gst, item_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), id, item.shade_id, item.shade_category, item.name, item.hsn, item.qty, item.price, item.actual_price, item.cgst, item.sgst, item.igst, item.price_after_gst, i]
            );
        }

        if (isFormalEdit) {
            // ── FORMAL PATH: Create/overwrite pending change request, don't update actual ledger ──
            const newFormalSnapshot = {
                new_actual_net: actualNet,
                bill_number: bill_number || existingPurchase.bill_number,
                bill_date: formattedDate,
                supplier_name: supplier_name || existingPurchase.supplier_name || '',
                extra_charges: parsedExtraCharges,
                insurance_amount: parsedInsuranceAmount,
                prev_formal_items: oldItems.map(i => ({
                    shade_id: i.shade_id,
                    qty: parseFloat(i.qty || 0),
                    price: parseFloat(i.price || 0),
                    actual_price: parseFloat(i.actual_price || 0)
                })),
                items: lineItems.map(item => ({
                    shade_id: item.shade_id,
                    name: item.name,
                    shade_label: item.shade_label,
                    qty: item.qty,
                    price: item.price,
                    actual_price: item.computed_actual_price,
                    standard_formal_price: item.standard_formal_price,
                    standard_actual_price: item.standard_actual_price
                }))
            };
            // (oldActualSnapshot is captured comprehensively at the top of the function)
            await connection.query(
                "DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED')",
                [id, 'PURCHASE']
            );
            await connection.query(
                `INSERT INTO bill_change_requests (id, bill_type, formal_id, voucher_no, status, old_actual_snapshot, new_actual_snapshot, changed_by)
                 VALUES (?, 'PURCHASE', ?, ?, 'PENDING', ?, ?, ?)`,
                [uuidv4(), id, vNo, JSON.stringify(oldActualSnapshot), JSON.stringify(newFormalSnapshot), req.user?.id || 'FORMAL_PORTAL']
            );
            // ledger_internal_actual is NOT updated — godown portal stays unchanged until they accept
        } else {
            // ── ACTUAL / DUAL PATH: Update actual ledger immediately ──
            if (vNo) {
                await connection.query(
                    'UPDATE ledger_internal_actual SET net_godown_total = ? WHERE voucher_no = ?',
                    [actualNet, vNo]
                );
            }
            await connection.query(
                "DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status IN ('PENDING', 'REJECTED')",
                [id, 'PURCHASE']
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Purchase updated successfully' });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// CHANGE REQUEST: Fetch all pending formal→actual change requests
// ═══════════════════════════════════════════════════════════
export const fetchPendingChanges = async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT 
                bcr.*,
                CASE WHEN bcr.bill_type = 'SALE' THEN s.invoice_number ELSE sb.bill_number END as bill_ref,
                CASE WHEN bcr.bill_type = 'SALE' THEN s.sale_date ELSE sb.bill_date END as bill_date,
                CASE WHEN bcr.bill_type = 'SALE' THEN c.name ELSE sup.name END as entity_name
            FROM bill_change_requests bcr
            LEFT JOIN sales s ON bcr.bill_type = 'SALE' AND bcr.formal_id = s.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN supplier_bills sb ON bcr.bill_type = 'PURCHASE' AND bcr.formal_id = sb.id
            LEFT JOIN suppliers sup ON sb.supplier_id = sup.id
            WHERE bcr.status = 'PENDING'
            ORDER BY bcr.created_at DESC
        `);
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pending changes' });
    }
};

// ═══════════════════════════════════════════════════════════
// CHANGE REQUEST: Accept — apply new formal data to actual portal
// ═══════════════════════════════════════════════════════════
export const approveBillChange = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reqs] = await connection.query('SELECT * FROM bill_change_requests WHERE id = ? AND status = ?', [id, 'PENDING']);
        if (reqs.length === 0) return res.status(404).json({ error: 'Change request not found or already resolved' });
        const changeReq = reqs[0];

        const newSnapshot = typeof changeReq.new_actual_snapshot === 'string'
            ? JSON.parse(changeReq.new_actual_snapshot)
            : changeReq.new_actual_snapshot;

        // Update ledger_internal_actual with new computed actual net
        if (changeReq.voucher_no) {
            await connection.query(
                'UPDATE ledger_internal_actual SET net_godown_total = ? WHERE voucher_no = ?',
                [newSnapshot.new_actual_net, changeReq.voucher_no]
            );
        }

        // Update per-item actual prices
        if (changeReq.bill_type === 'SALE') {
            for (const item of (newSnapshot.items || [])) {
                await connection.query(
                    'UPDATE sale_items SET actual_price = ? WHERE sale_id = ? AND shade_id = ?',
                    [item.actual_price, changeReq.formal_id, item.shade_id]
                );
            }
        } else {
            for (const item of (newSnapshot.items || [])) {
                await connection.query(
                    'UPDATE supplier_bill_items SET actual_price = ? WHERE bill_id = ? AND shade_id = ?',
                    [item.actual_price, changeReq.formal_id, item.shade_id]
                );
            }
        }

        await connection.query(
            'UPDATE bill_change_requests SET status = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ?',
            ['ACCEPTED', req.user?.id || 'GODOWN', id]
        );

        await connection.query(
            "DELETE FROM bill_change_requests WHERE formal_id = ? AND bill_type = ? AND status = 'REJECTED'",
            [changeReq.formal_id, changeReq.bill_type]
        );

        await connection.commit();
        res.json({ message: 'Changes accepted. Actual portal updated successfully.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to approve change request' });
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// CHANGE REQUEST: Reject — keep actual portal unchanged
// ═══════════════════════════════════════════════════════════
export const rejectBillChange = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'UPDATE bill_change_requests SET status = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ? AND status = ?',
            ['REJECTED', req.user?.id || 'GODOWN', id, 'PENDING']
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Change request not found or already resolved' });
        res.json({ message: 'Changes rejected. Actual portal data remains unchanged.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reject change request' });
    }
};

// ═══════════════════════════════════════════════════════════
// DETAILED LEDGER: DUAL ENTITY (COMBINED CUSTOMER & SUPPLIER)
// ═══════════════════════════════════════════════════════════
export const fetchDualDetailedLedger = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, mode = 'PAKKA' } = req.query;
    try {
        // 1. Identify link and party IDs
        const [links] = await pool.query(
            'SELECT * FROM dual_entity_links WHERE customer_id = ? OR supplier_id = ? OR id = ? LIMIT 1',
            [id, id, id]
        );

        let customerId = null;
        let supplierId = null;

        if (links.length > 0) {
            customerId = links[0].customer_id;
            supplierId = links[0].supplier_id;
        } else {
            const [cust] = await pool.query('SELECT id FROM customers WHERE id = ?', [id]);
            if (cust.length > 0) {
                customerId = cust[0].id;
                const [suppLink] = await pool.query('SELECT supplier_id FROM dual_entity_links WHERE customer_id = ?', [customerId]);
                if (suppLink.length > 0) supplierId = suppLink[0].supplier_id;
            } else {
                const [supp] = await pool.query('SELECT id FROM suppliers WHERE id = ?', [id]);
                if (supp.length > 0) {
                    supplierId = supp[0].id;
                    const [custLink] = await pool.query('SELECT customer_id FROM dual_entity_links WHERE supplier_id = ?', [supplierId]);
                    if (custLink.length > 0) customerId = custLink[0].customer_id;
                }
            }
        }

        if (!customerId || !supplierId) {
            return res.status(404).json({ error: 'Dual linked entity not found for this party' });
        }

        const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
        const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [supplierId]);

        if (customers.length === 0 || suppliers.length === 0) {
            return res.status(404).json({ error: 'Customer or Supplier record missing for dual entity' });
        }

        const customer = customers[0];
        const supplier = suppliers[0];

        // 2. Fetch Customer Sales
        const [sales] = await pool.query(`
            SELECT s.* ${mode === 'ACTUAL' ? ', lia.net_godown_total as actual_total' : ''}
            FROM sales s
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no' : ''}
            WHERE s.customer_id = ?
        `, [customerId]);

        let saleItemsMap = {};
        if (sales.length > 0) {
            const saleIds = sales.map(s => s.id);
            const actualPriceCol = mode === 'ACTUAL' ? 'si.actual_price' : 'NULL as actual_price';
            const [items] = await pool.query(`
                SELECT si.sale_id, si.name, si.qty, si.price, ${actualPriceCol}, si.cgst, si.sgst, si.gst_amount, si.price_after_gst, sh.shade_id_label as shade_label 
                FROM sale_items si 
                LEFT JOIN item_shades sh ON si.shade_id = sh.id 
                WHERE si.sale_id IN (?) 
                ORDER BY si.item_index ASC
            `, [saleIds]);
            items.forEach(i => {
                if (!saleItemsMap[i.sale_id]) saleItemsMap[i.sale_id] = [];
                saleItemsMap[i.sale_id].push(i);
            });

            if (mode === 'ACTUAL') {
                for (let s of sales) {
                    const [changeReq] = await pool.query(
                        "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                        [s.id]
                    );
                    if (changeReq.length > 0) {
                        const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                            ? JSON.parse(changeReq[0].old_actual_snapshot)
                            : changeReq[0].old_actual_snapshot;

                        s.invoice_number = snapshot.invoice_number || s.invoice_number;
                        s.sale_date = snapshot.sale_date || s.sale_date;
                        s.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : s.extra_charges;
                        s.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : s.insurance_amount;
                        s.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : s.actual_total;

                        saleItemsMap[s.id] = (snapshot.items || []).map(item => ({
                            sale_id: s.id,
                            name: item.name || '—',
                            qty: item.qty || 0,
                            price: item.price || 0,
                            cgst: 0,
                            sgst: 0,
                            gst_amount: 0,
                            price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                            actual_price: item.actual_price || 0,
                            shade_label: item.shade_label || ''
                        }));
                    }
                }
            }
        }

        // 3. Fetch Customer Payments
        const [customerPayments] = await pool.query(`
            SELECT * FROM cashbook_transactions 
            WHERE (related_type = 'SALES' AND related_id IN (SELECT id FROM sales WHERE customer_id = ?))
            OR (entity_name = ?)
        `, [customerId, customer.name]);

        // 4. Fetch Supplier Bills (Purchases)
        const [bills] = await pool.query(`
            SELECT b.* ${mode === 'ACTUAL' ? ', lia.net_godown_total as actual_total' : ''}
            FROM supplier_bills b
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no' : ''}
            WHERE b.supplier_id = ? AND b.status = 'FULFILLED'
        `, [supplierId]);

        let billItemsMap = {};
        if (bills.length > 0) {
            const billIds = bills.map(b => b.id);
            const actualPriceCol = mode === 'ACTUAL' ? 'sbi.actual_price' : 'NULL as actual_price';
            const [bItems] = await pool.query(`
                SELECT sbi.bill_id, sbi.name, sbi.received_qty as qty, sbi.price, ${actualPriceCol}, sbi.cgst, sbi.sgst, sbi.price_after_gst, sh.shade_id_label as shade_label 
                FROM supplier_bill_items sbi 
                LEFT JOIN item_shades sh ON sbi.shade_id = sh.id 
                WHERE sbi.bill_id IN (?) 
                ORDER BY sbi.item_index ASC
            `, [billIds]);
            bItems.forEach(i => {
                if (!billItemsMap[i.bill_id]) billItemsMap[i.bill_id] = [];
                billItemsMap[i.bill_id].push(i);
            });

            if (mode === 'ACTUAL') {
                for (let b of bills) {
                    const [changeReq] = await pool.query(
                        "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                        [b.id]
                    );
                    if (changeReq.length > 0) {
                        const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                            ? JSON.parse(changeReq[0].old_actual_snapshot)
                            : changeReq[0].old_actual_snapshot;

                        b.bill_number = snapshot.bill_number || b.bill_number;
                        b.bill_date = snapshot.bill_date || b.bill_date;
                        b.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : b.extra_charges;
                        b.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : b.insurance_amount;
                        b.actual_total = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : b.actual_total;

                        billItemsMap[b.id] = (snapshot.items || []).map(item => ({
                            bill_id: b.id,
                            name: item.name || '—',
                            qty: item.qty || 0,
                            price: item.price || 0,
                            cgst: 0,
                            sgst: 0,
                            price_after_gst: (item.qty || 0) * (item.actual_price || 0),
                            actual_price: item.actual_price || 0,
                            shade_label: item.shade_label || ''
                        }));
                    }
                }
            }
        }

        // 5. Fetch Supplier Payments
        const [supplierPayments] = await pool.query(`
            SELECT * FROM cashbook_transactions 
            WHERE (related_type = 'PURCHASE' AND related_id IN (SELECT id FROM supplier_bills WHERE supplier_id = ?))
            OR (entity_name = ?)
        `, [supplierId, supplier.name]);

        // 6. Assemble Combined Transactions
        let allTxns = [];

        // Sales -> Debits (+)
        for (let s of sales) {
            const isReturn = s.invoice_number.startsWith('RET-');
            const pAmt = s.sale_type === 'PAKKA' ? parseFloat(s.total_amount) : 0;
            const aAmt = parseFloat(s.actual_total || s.total_amount);

            if (mode === 'PAKKA' && pAmt === 0) continue;

            const txn = {
                date: s.sale_date,
                type: isReturn ? 'SALE_RETURN' : 'SALE',
                source_type: 'CUSTOMER',
                ref: s.invoice_number,
                description: `Sale ${isReturn ? 'Return' : 'Invoice'}`,
                pakka_dr: isReturn ? 0 : pAmt,
                pakka_cr: isReturn ? Math.abs(pAmt) : 0,
                items: mode === 'PAKKA' ? (saleItemsMap[s.id] || []).map(stripActualPrice) : (saleItemsMap[s.id] || []),
                sale_id: s.id,
                extra_charges: s.extra_charges,
                extra_charge_name: s.extra_charge_name,
                insurance_amount: s.insurance_amount,
                insurance_name: s.insurance_name
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isReturn ? 0 : aAmt;
                txn.actual_cr = isReturn ? Math.abs(aAmt) : 0;
            }
            allTxns.push(txn);
        }

        // Customer Payments -> Credits (-)
        for (let p of customerPayments) {
            const pAmt = parseFloat(p.pakka_amount || 0);
            const aAmt = parseFloat(p.actual_amount || 0);
            const trueAmt = pAmt > 0 ? pAmt : aAmt;

            if (mode === 'PAKKA' && pAmt <= 0) continue;
            if (mode === 'ACTUAL' && trueAmt <= 0) continue;

            const isExpense = p.type === 'EXPENSE';

            const txn = {
                date: p.transaction_date,
                type: isExpense ? 'REFUND/LOAN' : 'PAYMENT_RECEIVED',
                source_type: 'CUSTOMER',
                ref: p.id.substring(0, 8),
                description: isExpense ? `Payment Given to Cust (${p.payment_method}) - ${p.description}` : `Payment Recv from Cust (${p.payment_method}) - ${p.description}`,
                pakka_dr: isExpense ? pAmt : 0,
                pakka_cr: isExpense ? 0 : pAmt
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isExpense ? trueAmt : 0;
                txn.actual_cr = isExpense ? 0 : trueAmt;
            }
            allTxns.push(txn);
        }

        // Supplier Purchases -> Credits (-) in Net Book
        for (let b of bills) {
            const isReturn = b.bill_number.startsWith('PRET-');
            const pAmt = parseFloat(b.total_amount);
            const aAmt = parseFloat(b.actual_total || b.total_amount);

            if (mode === 'PAKKA' && pAmt === 0) continue;

            const txn = {
                date: b.bill_date,
                type: isReturn ? 'PURCHASE_RETURN' : 'PURCHASE',
                source_type: 'SUPPLIER',
                ref: b.bill_number,
                description: `Purchase ${isReturn ? 'Return' : 'Bill'}`,
                pakka_dr: isReturn ? Math.abs(pAmt) : 0,
                pakka_cr: isReturn ? 0 : pAmt,
                items: mode === 'PAKKA' ? (billItemsMap[b.id] || []).map(stripActualPrice) : (billItemsMap[b.id] || []),
                bill_id: b.id,
                extra_charges: b.extra_charges,
                extra_charge_name: b.extra_charge_name,
                insurance_amount: b.insurance_amount,
                insurance_name: b.insurance_name
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isReturn ? Math.abs(aAmt) : 0;
                txn.actual_cr = isReturn ? 0 : aAmt;
            }
            allTxns.push(txn);
        }

        // Supplier Payments -> Debits (+) in Net Book (reduces liability to them)
        for (let p of supplierPayments) {
            const pAmt = parseFloat(p.pakka_amount || 0);
            const aAmt = parseFloat(p.actual_amount || 0);
            const trueAmt = pAmt > 0 ? pAmt : aAmt;

            if (mode === 'PAKKA' && pAmt <= 0) continue;
            if (mode === 'ACTUAL' && trueAmt <= 0) continue;

            const isExpense = p.type === 'EXPENSE';

            const txn = {
                date: p.transaction_date,
                type: isExpense ? 'PAYMENT_PAID' : 'REFUND_RECV',
                source_type: 'SUPPLIER',
                ref: p.id.substring(0, 8),
                description: isExpense ? `Payment Given to Supp (${p.payment_method}) - ${p.description}` : `Refund Recv from Supp (${p.payment_method}) - ${p.description}`,
                pakka_dr: isExpense ? pAmt : 0,
                pakka_cr: isExpense ? 0 : pAmt
            };
            if (mode === 'ACTUAL') {
                txn.actual_dr = isExpense ? trueAmt : 0;
                txn.actual_cr = isExpense ? 0 : trueAmt;
            }
            allTxns.push(txn);
        }

        allTxns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 7. Calculate Net Opening & Running Balances
        const custPakkaOp = parseFloat(customer.opening_balance_pakka || 0);
        const custActualOp = parseFloat(customer.opening_balance_actual || 0);
        const suppPakkaOp = parseFloat(supplier.opening_balance_pakka || 0);
        const suppActualOp = parseFloat(supplier.opening_balance_actual || 0);

        let pakkaBal = custPakkaOp - suppPakkaOp;
        let actualBal = custActualOp - suppActualOp;

        let pakkaWindowOpening = pakkaBal;
        let actualWindowOpening = actualBal;

        let ledger = [];

        for (let t of allTxns) {
            const tDate = new Date(t.date);
            let inRange = true;
            if (startDate && tDate < new Date(startDate)) inRange = false;
            if (endDate && tDate > new Date(endDate)) inRange = false;

            const pakkaImpact = t.pakka_dr - t.pakka_cr;
            const actualImpact = (t.actual_dr || 0) - (t.actual_cr || 0);

            if (startDate && tDate < new Date(startDate)) {
                pakkaBal += pakkaImpact;
                actualBal += actualImpact;
                pakkaWindowOpening = pakkaBal;
                actualWindowOpening = actualBal;
            } else if (inRange) {
                pakkaBal += pakkaImpact;
                actualBal += actualImpact;
                if (mode === 'PAKKA') {
                    const entry = { ...t, pakka_bal: pakkaBal };
                    if (t.items && t.items.length > 0) entry.items = t.items.map(stripActualPrice);
                    ledger.push(entry);
                } else {
                    ledger.push({ ...t, pakka_bal: pakkaBal, actual_bal: actualBal });
                }
            }
        }

        const openingEntry = {
            date: startDate || customer.created_at,
            type: 'OPENING',
            source_type: 'DUAL',
            ref: 'NET_OPENING',
            description: startDate ? `Net Opening balance as of ${formatToDDMMYY(startDate)}` : 'Net Opening balance at onboarding',
            pakka_dr: pakkaWindowOpening > 0 ? pakkaWindowOpening : 0,
            pakka_cr: pakkaWindowOpening < 0 ? -pakkaWindowOpening : 0,
            pakka_bal: pakkaWindowOpening,
            items: []
        };
        if (mode === 'ACTUAL') {
            openingEntry.actual_dr = actualWindowOpening > 0 ? actualWindowOpening : 0;
            openingEntry.actual_cr = actualWindowOpening < 0 ? -actualWindowOpening : 0;
            openingEntry.actual_bal = actualWindowOpening;
        }
        ledger.unshift(openingEntry);

        res.status(200).json(ledger);
    } catch (err) {
        console.error('fetchDualDetailedLedger error:', err);
        res.status(500).json({ error: 'Failed to fetch combined dual ledger' });
    }
};

export const linkDualEntities = async (req, res) => {
    const { customer_id, supplier_id, notes } = req.body;
    if (!customer_id || !supplier_id) {
        return res.status(400).json({ error: 'customer_id and supplier_id are required' });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const linkId = uuidv4();
        await conn.query(
            'INSERT INTO dual_entity_links (id, customer_id, supplier_id, notes, created_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE supplier_id = VALUES(supplier_id), notes = VALUES(notes)',
            [linkId, customer_id, supplier_id, notes || null, req.user?.id || null]
        );
        await conn.commit();
        res.status(200).json({ message: 'Dual entities linked successfully', link_id: linkId });
    } catch (err) {
        await conn.rollback();
        console.error('linkDualEntities error:', err);
        res.status(500).json({ error: 'Failed to link entities' });
    } finally {
        conn.release();
    }
};

export const unlinkDualEntities = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'DELETE FROM dual_entity_links WHERE id = ? OR customer_id = ? OR supplier_id = ?',
            [id, id, id]
        );
        res.status(200).json({ message: 'Dual link removed successfully' });
    } catch (err) {
        console.error('unlinkDualEntities error:', err);
        res.status(500).json({ error: 'Failed to unlink entities' });
    }
};

export const fetchSuggestedDualMatches = async (req, res) => {
    try {
        const [alreadyLinked] = await pool.query('SELECT customer_id, supplier_id FROM dual_entity_links');
        const linkedCustIds = new Set(alreadyLinked.map(l => l.customer_id));
        const linkedSuppIds = new Set(alreadyLinked.map(l => l.supplier_id));

        // 1. GST Matches (Highest confidence)
        const [gstMatches] = await pool.query(`
            SELECT 
                c.id as customer_id, c.name as customer_name, c.gstNumber as customer_gst, c.mobile as customer_mobile, c.state as customer_state,
                c.opening_balance_pakka as customer_op_pakka, c.opening_balance_actual as customer_op_actual,
                s.id as supplier_id, s.name as supplier_name, s.gstNumber as supplier_gst, s.mobile as supplier_mobile, s.state as supplier_state,
                s.opening_balance_pakka as supplier_op_pakka, s.opening_balance_actual as supplier_op_actual
            FROM customers c
            JOIN suppliers s ON UPPER(TRIM(c.gstNumber)) = UPPER(TRIM(s.gstNumber))
            WHERE c.gstNumber IS NOT NULL AND TRIM(c.gstNumber) != '' AND LENGTH(TRIM(c.gstNumber)) >= 10
        `);

        // 2. Mobile Matches
        const [mobileMatches] = await pool.query(`
            SELECT 
                c.id as customer_id, c.name as customer_name, c.gstNumber as customer_gst, c.mobile as customer_mobile, c.state as customer_state,
                c.opening_balance_pakka as customer_op_pakka, c.opening_balance_actual as customer_op_actual,
                s.id as supplier_id, s.name as supplier_name, s.gstNumber as supplier_gst, s.mobile as supplier_mobile, s.state as supplier_state,
                s.opening_balance_pakka as supplier_op_pakka, s.opening_balance_actual as supplier_op_actual
            FROM customers c
            JOIN suppliers s ON TRIM(c.mobile) = TRIM(s.mobile)
            WHERE c.mobile IS NOT NULL AND TRIM(c.mobile) != '' 
                AND TRIM(c.mobile) NOT IN ('Not Provided', '0', '0000000000', '1234567890', 'NA', 'N/A', '-')
                AND LENGTH(TRIM(c.mobile)) >= 8
        `);

        // 3. Name Matches
        const [nameMatches] = await pool.query(`
            SELECT 
                c.id as customer_id, c.name as customer_name, c.gstNumber as customer_gst, c.mobile as customer_mobile, c.state as customer_state,
                c.opening_balance_pakka as customer_op_pakka, c.opening_balance_actual as customer_op_actual,
                s.id as supplier_id, s.name as supplier_name, s.gstNumber as supplier_gst, s.mobile as supplier_mobile, s.state as supplier_state,
                s.opening_balance_pakka as supplier_op_pakka, s.opening_balance_actual as supplier_op_actual
            FROM customers c
            JOIN suppliers s ON LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]', '')) = LOWER(REGEXP_REPLACE(s.name, '[^a-zA-Z0-9]', ''))
            WHERE LENGTH(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]', '')) >= 5
        `);

        const suggestionsMap = new Map();

        const addMatch = (row, reason, type, confidence) => {
            if (linkedCustIds.has(row.customer_id) || linkedSuppIds.has(row.supplier_id)) return;
            const key = `${row.customer_id}_${row.supplier_id}`;
            if (!suggestionsMap.has(key)) {
                suggestionsMap.set(key, {
                    customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    customer_gst: row.customer_gst,
                    customer_mobile: row.customer_mobile,
                    customer_state: row.customer_state,
                    customer_op_pakka: parseFloat(row.customer_op_pakka || 0),
                    customer_op_actual: parseFloat(row.customer_op_actual || 0),
                    supplier_id: row.supplier_id,
                    supplier_name: row.supplier_name,
                    supplier_gst: row.supplier_gst,
                    supplier_mobile: row.supplier_mobile,
                    supplier_state: row.supplier_state,
                    supplier_op_pakka: parseFloat(row.supplier_op_pakka || 0),
                    supplier_op_actual: parseFloat(row.supplier_op_actual || 0),
                    match_reason: reason,
                    match_type: type,
                    confidence: confidence
                });
            }
        };

        gstMatches.forEach(m => addMatch(m, `Identical GSTIN (${m.customer_gst})`, 'GST', 100));
        mobileMatches.forEach(m => addMatch(m, `Matching Phone (${m.customer_mobile})`, 'PHONE', 90));
        nameMatches.forEach(m => addMatch(m, `Matching Name (${m.customer_name})`, 'NAME', 80));

        const suggestions = Array.from(suggestionsMap.values());
        res.status(200).json(suggestions);
    } catch (err) {
        console.error('fetchSuggestedDualMatches error:', err);
        res.status(500).json({ error: 'Failed to fetch suggested dual matches' });
    }
};

export const fetchApprovedDualEntities = async (req, res) => {
    try {
        const [links] = await pool.query(`
            SELECT 
                l.id as link_id, l.customer_id, l.supplier_id, l.notes, l.created_at as linked_at,
                c.name as customer_name, c.gstNumber as customer_gst, c.mobile as customer_mobile, c.state as customer_state,
                c.opening_balance_pakka as customer_op_pakka, c.opening_balance_actual as customer_op_actual,
                s.name as supplier_name, s.gstNumber as supplier_gst, s.mobile as supplier_mobile, s.state as supplier_state,
                s.opening_balance_pakka as supplier_op_pakka, s.opening_balance_actual as supplier_op_actual
            FROM dual_entity_links l
            JOIN customers c ON l.customer_id = c.id
            JOIN suppliers s ON l.supplier_id = s.id
            ORDER BY l.created_at DESC
        `);

        const results = await Promise.all(links.map(async (link) => {
            // Customer formal ledger & payments
            const [[custBilledPakka]] = await pool.query('SELECT COALESCE(SUM(net_invoice_total), 0) as total FROM ledger_formal_pakka WHERE entity_id = ? AND entity_type = "CUSTOMER"', [link.customer_id]);
            const [[custBilledActual]] = await pool.query('SELECT COALESCE(SUM(net_godown_total), 0) as total FROM ledger_internal_actual WHERE entity_id = ? AND entity_type = "CUSTOMER"', [link.customer_id]);
            const [[custIncome]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM cashbook_transactions WHERE entity_name = ? AND type = "INCOME"', [link.customer_name]);

            // Supplier formal ledger & payments
            const [[suppBilledPakka]] = await pool.query('SELECT COALESCE(SUM(net_invoice_total), 0) as total FROM ledger_formal_pakka WHERE entity_id = ? AND entity_type = "SUPPLIER"', [link.supplier_id]);
            const [[suppBilledActual]] = await pool.query('SELECT COALESCE(SUM(net_godown_total), 0) as total FROM ledger_internal_actual WHERE entity_id = ? AND entity_type = "SUPPLIER"', [link.supplier_id]);
            const [[suppExpense]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM cashbook_transactions WHERE entity_name = ? AND type = "EXPENSE"', [link.supplier_name]);

            const custBalPakka = (parseFloat(link.customer_op_pakka || 0) + parseFloat(custBilledPakka.total)) - parseFloat(custIncome.total);
            const suppBalPakka = (parseFloat(link.supplier_op_pakka || 0) + parseFloat(suppBilledPakka.total)) - parseFloat(suppExpense.total);
            const netBalPakka = custBalPakka - suppBalPakka;

            const custBalActual = (parseFloat(link.customer_op_actual || 0) + parseFloat(custBilledActual.total)) - parseFloat(custIncome.total);
            const suppBalActual = (parseFloat(link.supplier_op_actual || 0) + parseFloat(suppBilledActual.total)) - parseFloat(suppExpense.total);
            const netBalActual = custBalActual - suppBalActual;

            return {
                ...link,
                customer_balance_pakka: custBalPakka,
                supplier_balance_pakka: suppBalPakka,
                net_balance_pakka: netBalPakka,
                customer_balance_actual: custBalActual,
                supplier_balance_actual: suppBalActual,
                net_balance_actual: netBalActual
            };
        }));

        res.status(200).json(results);
    } catch (err) {
        console.error('fetchApprovedDualEntities error:', err);
        res.status(500).json({ error: 'Failed to fetch approved dual entities' });
    }
};

