import pool from '../config/db.js';

// ═══════════════════════════════════════════════════════════
// ACTUAL PRICE IS SECRET — In the statement generator below,
// only include si.actual_price / sbi.actual_price when
// isActual === 'true'. Formal statements must never expose
// actual prices.
// ═══════════════════════════════════════════════════════════

export const getDashboardStats = async (req, res) => {
    try {
        const [empCount] = await pool.query('SELECT COUNT(*) as c FROM employees');
        const [custCount] = await pool.query('SELECT COUNT(*) as c FROM customers');
        const [suppCount] = await pool.query('SELECT COUNT(*) as c FROM suppliers');
        const [itemCount] = await pool.query('SELECT COUNT(*) as c FROM items');
        const [shadeCount] = await pool.query('SELECT COUNT(*) as c FROM item_shades');
        
        // Sales sums
        const [salesSum] = await pool.query('SELECT SUM(total_amount) as total_pakka, COUNT(*) as txn_count FROM sales WHERE invoice_number NOT LIKE "RET-%"');
        // Actual net from internal ledger for sales (including returns which are negative)
        const [salesActual] = await pool.query('SELECT SUM(net_godown_total) as total_actual FROM ledger_internal_actual WHERE entity_type = "CUSTOMER"');

        // Purchasing sums
        const [purchSum] = await pool.query('SELECT SUM(total_amount) as total_pakka, COUNT(*) as txn_count FROM supplier_bills WHERE status = "FULFILLED" AND bill_number NOT LIKE "PRET-%"');
        const [purchActual] = await pool.query('SELECT SUM(net_godown_total) as total_actual FROM ledger_internal_actual WHERE entity_type = "SUPPLIER"');

        // Low stock shades
        const [lowStock] = await pool.query(`
            SELECT s.shade_id_label, s.available_qty, i.name as item_name 
            FROM item_shades s 
            JOIN items i ON s.item_id = i.id 
            WHERE s.available_qty < 10 
            ORDER BY s.available_qty ASC 
            LIMIT 5
        `);

        // Recent Activity
        const [recentSales] = await pool.query('SELECT invoice_number as ref, total_amount as amount, sale_date as date, "SALE" as type FROM sales WHERE invoice_number NOT LIKE "RET-%" ORDER BY created_at DESC LIMIT 5');
        const [recentPurchases] = await pool.query('SELECT bill_number as ref, total_amount as amount, bill_date as date, "PURCHASE" as type FROM supplier_bills WHERE status = "FULFILLED" AND bill_number NOT LIKE "PRET-%" ORDER BY created_at DESC LIMIT 5');

        const recent_activity = [...recentSales, ...recentPurchases].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        // Pending Balances (Incorporating Opening Balances)
        const [recvSum] = await pool.query('SELECT SUM(balance) as total_recv FROM sales WHERE balance > 0 AND invoice_number NOT LIKE "RET-%"');
        const [custOpening] = await pool.query('SELECT SUM(opening_balance_pakka) as total_op FROM customers');
        const [paySum] = await pool.query('SELECT SUM(balance_amount) as total_pay FROM supplier_bills WHERE balance_amount > 0 AND bill_number NOT LIKE "PRET-%"');
        const [suppOpening] = await pool.query('SELECT SUM(opening_balance_pakka) as total_op FROM suppliers');

        res.json({
            employees: empCount[0].c,
            customers: custCount[0].c,
            suppliers: suppCount[0].c,
            items: itemCount[0].c,
            shades: shadeCount[0].c,
            payable: (paySum[0].total_pay || 0) + (suppOpening[0].total_op || 0),
            receivable: (recvSum[0].total_recv || 0) + (custOpening[0].total_op || 0),
            sales: {
                pakka_volume: salesSum[0].total_pakka || 0,
                actual_volume: salesActual[0].total_actual || 0,
                count: salesSum[0].txn_count || 0
            },
            purchases: {
                pakka_volume: purchSum[0].total_pakka || 0,
                actual_volume: purchActual[0].total_actual || 0,
                count: purchSum[0].txn_count || 0
            },
            lowStock: lowStock,
            recent_activity: recent_activity
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to extract dashboard telemetry' });
    }
};


export const getLedgerDetails = async (req, res) => {
    const { mode = 'FORMAL' } = req.query;
    try {
        const [customerLedgers] = await pool.query(`
            SELECT 
                c.id as entity_id,
                c.name as entity_name,
                c.opening_balance_pakka,
                c.opening_balance_actual,
                SUM(s.total_amount) as pakka_total,
                SUM(s.balance) as pakka_pending,
                ${mode === 'ACTUAL' ? 'SUM(lia.net_godown_total) as actual_total' : '0 as actual_total'}
            FROM customers c
            LEFT JOIN sales s ON c.id = s.customer_id
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no' : ''}
            GROUP BY c.id, c.name, c.opening_balance_pakka, c.opening_balance_actual
        `);

        const [supplierLedgers] = await pool.query(`
            SELECT 
                p.id as entity_id,
                p.name as entity_name,
                p.opening_balance_pakka,
                p.opening_balance_actual,
                SUM(b.total_amount) as pakka_total,
                SUM(b.balance_amount) as pakka_pending,
                ${mode === 'ACTUAL' ? 'SUM(lia.net_godown_total) as actual_total' : '0 as actual_total'}
            FROM suppliers p
            LEFT JOIN supplier_bills b ON p.id = b.supplier_id
            ${mode === 'ACTUAL' ? 'LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no' : ''}
            GROUP BY p.id, p.name, p.opening_balance_pakka, p.opening_balance_actual
        `);

        const formatLedger = (rows) => {
            return rows.map(r => {
                const pakka_op = parseFloat(r.opening_balance_pakka || 0);
                const actual_op = parseFloat(r.opening_balance_actual || 0);

                const pakka_total = parseFloat(r.pakka_total || 0) + pakka_op;
                const pakka_pending = parseFloat(r.pakka_pending || 0) + pakka_op;
                const pakka_paid = pakka_total - pakka_pending;
                
                const entry = {
                    entity_id: r.entity_id,
                    entity_name: r.entity_name,
                    pakka_total,
                    pakka_pending,
                    pakka_paid
                };
                if (mode === 'ACTUAL') {
                    const actual_total = parseFloat(r.actual_total || 0) + actual_op;
                    entry.actual_total = actual_total;
                    entry.actual_pending = actual_total - pakka_paid;
                    entry.actual_paid = pakka_paid;
                }
                return entry;
            });
        };

        res.json({
            receivables: formatLedger(customerLedgers),
            payables: formatLedger(supplierLedgers)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to extract detailed ledgers' });
    }
};

export const getEntityStatement = async (req, res) => {
    const { entityId, entityType, startDate, endDate, isActual } = req.query; // entityType: CUSTOMER or SUPPLIER

    try {
        let opening = 0;
        let info = {};
        let txns = [];
        let itemsMap = {};

        if (entityType === 'CUSTOMER') {
            const opCol = isActual === 'true' ? 'opening_balance_actual' : 'opening_balance_pakka';
            const amountColSale = isActual === 'true' ? 'actual_amount' : 'total_amount';
            const amountColCash = isActual === 'true' ? 'actual_amount' : 'pakka_amount';

            const [c] = await pool.query(`SELECT name, ${opCol} as op FROM customers WHERE id = ?`, [entityId]);
            if (!c[0]) return res.status(404).json({ error: 'Body not found in matrix.' });
            info = c[0];
            opening = parseFloat(c[0].op || 0);

            // Fetch Sales
            const salesQuery = isActual === 'true' 
                ? `SELECT s.id, s.sale_date as date, s.invoice_number as ref, 
                          CASE WHEN s.invoice_number LIKE 'RET-%' THEN 0 ELSE lia.net_godown_total END as debit, 
                          CASE WHEN s.invoice_number LIKE 'RET-%' THEN ABS(lia.net_godown_total) ELSE 0 END as credit, 
                          s.extra_charges, s.extra_charge_name, s.insurance_amount, s.insurance_name 
                   FROM sales s LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no 
                   WHERE s.customer_id = ?`
                : `SELECT id, sale_date as date, invoice_number as ref, 
                          CASE WHEN invoice_number LIKE 'RET-%' THEN 0 ELSE total_amount END as debit, 
                          CASE WHEN invoice_number LIKE 'RET-%' THEN ABS(total_amount) ELSE 0 END as credit 
                   FROM sales WHERE customer_id = ? AND sale_type = 'PAKKA'`;
            
            const [sales] = await pool.query(salesQuery, [entityId]);
            
            if (sales.length > 0) {
                const saleIds = sales.map(s => s.id);
                const actualPriceCol = isActual === 'true' ? 'si.actual_price' : 'NULL as actual_price';
                const [items] = await pool.query(`SELECT si.sale_id, si.name, si.qty, si.price, ${actualPriceCol}, si.cgst, si.sgst, si.gst_amount, si.price_after_gst, sh.shade_id_label as shade_label FROM sale_items si LEFT JOIN item_shades sh ON si.shade_id = sh.id WHERE si.sale_id IN (?)`, [saleIds]);
                items.forEach(i => {
                    if (!itemsMap[i.sale_id]) itemsMap[i.sale_id] = [];
                    itemsMap[i.sale_id].push(i);
                });

                if (isActual === 'true') {
                    for (let s of sales) {
                        const [changeReq] = await pool.query(
                            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                            [s.id]
                        );
                        if (changeReq.length > 0) {
                            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                                ? JSON.parse(changeReq[0].old_actual_snapshot)
                                : changeReq[0].old_actual_snapshot;

                            s.ref = snapshot.invoice_number || s.ref;
                            s.date = snapshot.sale_date || s.date;
                            s.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : s.extra_charges;
                            s.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : s.insurance_amount;
                            
                            const oldNet = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (s.debit !== 0 ? s.debit : s.credit);
                            if (s.debit !== 0) s.debit = oldNet;
                            if (s.credit !== 0) s.credit = oldNet;

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

            // Fetch Payments
            const actualAmountSql = isActual === 'true' ? 'GREATEST(COALESCE(ct.actual_amount, 0), COALESCE(ct.pakka_amount, 0))' : 'COALESCE(ct.pakka_amount, 0)';
            
            const [payments] = await pool.query(`
                SELECT ct.transaction_date as date, ct.description as ref, 
                       CASE WHEN ct.type = 'EXPENSE' THEN ${actualAmountSql} ELSE 0 END as debit, 
                       CASE WHEN ct.type = 'INCOME' THEN ${actualAmountSql} ELSE 0 END as credit 
                FROM cashbook_transactions ct
                LEFT JOIN sales s ON ct.related_id = s.id
                WHERE (s.customer_id = ?) OR (ct.entity_name = ?)
            `, [entityId, info.name]);
            
            txns = [...sales, ...payments];
        } else if (entityType === 'DUAL') {
            const [links] = await pool.query(
                'SELECT * FROM dual_entity_links WHERE customer_id = ? OR supplier_id = ? OR id = ? LIMIT 1',
                [entityId, entityId, entityId]
            );
            let customerId = null;
            let supplierId = null;
            if (links.length > 0) {
                customerId = links[0].customer_id;
                supplierId = links[0].supplier_id;
            } else {
                const [cust] = await pool.query('SELECT id FROM customers WHERE id = ?', [entityId]);
                if (cust.length > 0) {
                    customerId = cust[0].id;
                    const [suppLink] = await pool.query('SELECT supplier_id FROM dual_entity_links WHERE customer_id = ?', [customerId]);
                    if (suppLink.length > 0) supplierId = suppLink[0].supplier_id;
                } else {
                    const [supp] = await pool.query('SELECT id FROM suppliers WHERE id = ?', [entityId]);
                    if (supp.length > 0) {
                        supplierId = supp[0].id;
                        const [custLink] = await pool.query('SELECT customer_id FROM dual_entity_links WHERE supplier_id = ?', [supplierId]);
                        if (custLink.length > 0) customerId = custLink[0].customer_id;
                    }
                }
            }

            if (!customerId || !supplierId) return res.status(404).json({ error: 'Dual linked entity not found.' });

            const opCol = isActual === 'true' ? 'opening_balance_actual' : 'opening_balance_pakka';
            const [c] = await pool.query(`SELECT name, ${opCol} as op FROM customers WHERE id = ?`, [customerId]);
            const [s] = await pool.query(`SELECT name, ${opCol} as op FROM suppliers WHERE id = ?`, [supplierId]);
            if (!c[0] || !s[0]) return res.status(404).json({ error: 'Party not found in matrix.' });

            info = { name: `${c[0].name} (Combined / Dual Account)` };
            const custOp = parseFloat(c[0].op || 0);
            const suppOp = parseFloat(s[0].op || 0);
            opening = custOp - suppOp;

            // Fetch Sales
            const salesQuery = isActual === 'true' 
                ? `SELECT s.id, s.sale_date as date, s.invoice_number as ref, 
                          CASE WHEN s.invoice_number LIKE 'RET-%' THEN 0 ELSE lia.net_godown_total END as debit, 
                          CASE WHEN s.invoice_number LIKE 'RET-%' THEN ABS(lia.net_godown_total) ELSE 0 END as credit, 
                          s.extra_charges, s.extra_charge_name, s.insurance_amount, s.insurance_name 
                   FROM sales s LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no 
                   WHERE s.customer_id = ?`
                : `SELECT id, sale_date as date, invoice_number as ref, 
                          CASE WHEN invoice_number LIKE 'RET-%' THEN 0 ELSE total_amount END as debit, 
                          CASE WHEN invoice_number LIKE 'RET-%' THEN ABS(total_amount) ELSE 0 END as credit 
                   FROM sales WHERE customer_id = ? AND sale_type = 'PAKKA'`;
            const [sales] = await pool.query(salesQuery, [customerId]);

            if (sales.length > 0) {
                const saleIds = sales.map(s => s.id);
                const actualPriceCol = isActual === 'true' ? 'si.actual_price' : 'NULL as actual_price';
                const [items] = await pool.query(`SELECT si.sale_id, si.name, si.qty, si.price, ${actualPriceCol}, si.cgst, si.sgst, si.gst_amount, si.price_after_gst, sh.shade_id_label as shade_label FROM sale_items si LEFT JOIN item_shades sh ON si.shade_id = sh.id WHERE si.sale_id IN (?)`, [saleIds]);
                items.forEach(i => {
                    if (!itemsMap[i.sale_id]) itemsMap[i.sale_id] = [];
                    itemsMap[i.sale_id].push(i);
                });
                if (isActual === 'true') {
                    for (let sl of sales) {
                        const [changeReq] = await pool.query(
                            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'SALE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                            [sl.id]
                        );
                        if (changeReq.length > 0) {
                            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                                ? JSON.parse(changeReq[0].old_actual_snapshot)
                                : changeReq[0].old_actual_snapshot;
                            sl.ref = snapshot.invoice_number || sl.ref;
                            sl.date = snapshot.sale_date || sl.date;
                            sl.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : sl.extra_charges;
                            sl.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : sl.insurance_amount;
                            const oldNet = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (sl.debit !== 0 ? sl.debit : sl.credit);
                            if (sl.debit !== 0) sl.debit = oldNet;
                            if (sl.credit !== 0) sl.credit = oldNet;
                            itemsMap[sl.id] = (snapshot.items || []).map(item => ({
                                sale_id: sl.id,
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

            const actualAmountSql = isActual === 'true' ? 'GREATEST(COALESCE(ct.actual_amount, 0), COALESCE(ct.pakka_amount, 0))' : 'COALESCE(ct.pakka_amount, 0)';
            const [custPayments] = await pool.query(`
                SELECT ct.transaction_date as date, ct.description as ref, 
                       CASE WHEN ct.type = 'EXPENSE' THEN ${actualAmountSql} ELSE 0 END as debit, 
                       CASE WHEN ct.type = 'INCOME' THEN ${actualAmountSql} ELSE 0 END as credit 
                FROM cashbook_transactions ct
                LEFT JOIN sales s ON ct.related_id = s.id
                WHERE (s.customer_id = ?) OR (ct.entity_name = ?)
            `, [customerId, c[0].name]);

            // Fetch Bills
            const billsQuery = isActual === 'true' 
                ? `SELECT sb.id, sb.bill_date as date, sb.bill_number as ref, 
                          CASE WHEN sb.bill_number LIKE 'PRET-%' THEN ABS(lia.net_godown_total) ELSE 0 END as debit, 
                          CASE WHEN sb.bill_number LIKE 'PRET-%' THEN 0 ELSE lia.net_godown_total END as credit 
                   FROM supplier_bills sb LEFT JOIN ledger_internal_actual lia ON sb.voucher_no = lia.voucher_no 
                   WHERE sb.supplier_id = ?`
                : `SELECT id, bill_date as date, bill_number as ref, 
                          CASE WHEN bill_number LIKE 'PRET-%' THEN ABS(total_amount) ELSE 0 END as debit, 
                          CASE WHEN bill_number LIKE 'PRET-%' THEN 0 ELSE total_amount END as credit 
                   FROM supplier_bills WHERE supplier_id = ?`;
            const [bills] = await pool.query(billsQuery, [supplierId]);

            if (bills.length > 0) {
                const billIds = bills.map(p => p.id);
                const actualPriceCol = isActual === 'true' ? 'sbi.actual_price' : 'NULL as actual_price';
                const [items] = await pool.query(`SELECT sbi.bill_id, sbi.name, sbi.received_qty as qty, sbi.price, ${actualPriceCol}, sbi.cgst, sbi.sgst, sbi.price_after_gst, sh.shade_id_label as shade_label FROM supplier_bill_items sbi LEFT JOIN item_shades sh ON sbi.shade_id = sh.id WHERE sbi.bill_id IN (?)`, [billIds]);
                items.forEach(i => {
                    if (!itemsMap[i.bill_id]) itemsMap[i.bill_id] = [];
                    itemsMap[i.bill_id].push(i);
                });
                if (isActual === 'true') {
                    for (let b of bills) {
                        const [changeReq] = await pool.query(
                            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                            [b.id]
                        );
                        if (changeReq.length > 0) {
                            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                                ? JSON.parse(changeReq[0].old_actual_snapshot)
                                : changeReq[0].old_actual_snapshot;
                            b.ref = snapshot.bill_number || b.ref;
                            b.date = snapshot.bill_date || b.date;
                            b.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : b.extra_charges;
                            b.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : b.insurance_amount;
                            const oldNet = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (b.debit !== 0 ? b.debit : b.credit);
                            if (b.debit !== 0) b.debit = oldNet;
                            if (b.credit !== 0) b.credit = oldNet;
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

            const [suppPayments] = await pool.query(`
                SELECT ct.transaction_date as date, ct.description as ref, 
                       CASE WHEN ct.type = 'EXPENSE' THEN ${actualAmountSql} ELSE 0 END as debit,
                       CASE WHEN ct.type = 'INCOME' THEN ${actualAmountSql} ELSE 0 END as credit
                FROM cashbook_transactions ct
                LEFT JOIN supplier_bills sb ON ct.related_id = sb.id
                WHERE (sb.supplier_id = ?) OR (ct.entity_name = ?)
            `, [supplierId, s[0].name]);

            txns = [...sales, ...custPayments, ...bills, ...suppPayments];
        } else {
            const opCol = isActual === 'true' ? 'opening_balance_actual' : 'opening_balance_pakka';
            const amountColBill = isActual === 'true' ? 'actual_amount' : 'total_amount';
            const amountColCash = isActual === 'true' ? 'actual_amount' : 'pakka_amount';

            const [s] = await pool.query(`SELECT name, ${opCol} as op FROM suppliers WHERE id = ?`, [entityId]);
            if (!s[0]) return res.status(404).json({ error: 'Source not found in matrix.' });
            info = s[0];
            opening = parseFloat(s[0].op || 0);

            // Fetch Bills
            const billsQuery = isActual === 'true' 
                ? `SELECT sb.id, sb.bill_date as date, sb.bill_number as ref, 
                          CASE WHEN sb.bill_number LIKE 'PRET-%' THEN ABS(lia.net_godown_total) ELSE 0 END as debit, 
                          CASE WHEN sb.bill_number LIKE 'PRET-%' THEN 0 ELSE lia.net_godown_total END as credit 
                    FROM supplier_bills sb LEFT JOIN ledger_internal_actual lia ON sb.voucher_no = lia.voucher_no 
                    WHERE sb.supplier_id = ?`
                : `SELECT id, bill_date as date, bill_number as ref, 
                          CASE WHEN bill_number LIKE 'PRET-%' THEN ABS(total_amount) ELSE 0 END as debit, 
                          CASE WHEN bill_number LIKE 'PRET-%' THEN 0 ELSE total_amount END as credit 
                    FROM supplier_bills WHERE supplier_id = ?`;
            
            const [bills] = await pool.query(billsQuery, [entityId]);
            
            if (bills.length > 0) {
                const billIds = bills.map(p => p.id);
                const actualPriceCol = isActual === 'true' ? 'sbi.actual_price' : 'NULL as actual_price';
                const [items] = await pool.query(`SELECT sbi.bill_id, sbi.name, sbi.received_qty as qty, sbi.price, ${actualPriceCol}, sbi.cgst, sbi.sgst, sbi.price_after_gst, sh.shade_id_label as shade_label FROM supplier_bill_items sbi LEFT JOIN item_shades sh ON sbi.shade_id = sh.id WHERE sbi.bill_id IN (?)`, [billIds]);
                items.forEach(i => {
                    if (!itemsMap[i.bill_id]) itemsMap[i.bill_id] = [];
                    itemsMap[i.bill_id].push(i);
                });

                if (isActual === 'true') {
                    for (let b of bills) {
                        const [changeReq] = await pool.query(
                            "SELECT old_actual_snapshot FROM bill_change_requests WHERE formal_id = ? AND bill_type = 'PURCHASE' AND status IN ('PENDING', 'REJECTED') ORDER BY created_at DESC LIMIT 1",
                            [b.id]
                        );
                        if (changeReq.length > 0) {
                            const snapshot = typeof changeReq[0].old_actual_snapshot === 'string'
                                ? JSON.parse(changeReq[0].old_actual_snapshot)
                                : changeReq[0].old_actual_snapshot;

                            b.ref = snapshot.bill_number || b.ref;
                            b.date = snapshot.bill_date || b.date;
                            b.extra_charges = snapshot.extra_charges !== undefined ? snapshot.extra_charges : b.extra_charges;
                            b.insurance_amount = snapshot.insurance_amount !== undefined ? snapshot.insurance_amount : b.insurance_amount;
                            
                            const oldNet = snapshot.old_actual_net !== undefined ? snapshot.old_actual_net : (b.debit !== 0 ? b.debit : b.credit);
                            if (b.debit !== 0) b.debit = oldNet;
                            if (b.credit !== 0) b.credit = oldNet;

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

            // Fetch Payments
            const actualAmountSql = isActual === 'true' ? 'GREATEST(COALESCE(ct.actual_amount, 0), COALESCE(ct.pakka_amount, 0))' : 'COALESCE(ct.pakka_amount, 0)';

            const [payments] = await pool.query(`
                SELECT ct.transaction_date as date, ct.description as ref, 
                       CASE WHEN ct.type = 'EXPENSE' THEN ${actualAmountSql} ELSE 0 END as debit,
                       CASE WHEN ct.type = 'INCOME' THEN ${actualAmountSql} ELSE 0 END as credit
                FROM cashbook_transactions ct
                LEFT JOIN supplier_bills sb ON ct.related_id = sb.id
                WHERE (sb.supplier_id = ?) OR (ct.entity_name = ?)
            `, [entityId, info.name]);

            txns = [...bills, ...payments];
        }

        // Sort by date ascending
        txns.sort((a,b) => new Date(a.date) - new Date(b.date));

        let running = opening;
        let openingForWindow = opening;
        let filteredTxns = [];

        for (let t of txns) {
            if (t.id && itemsMap[t.id]) {
                t.items = itemsMap[t.id];
            }

            const tDate = new Date(t.date);
            let inRange = true;
            if (startDate && tDate < new Date(startDate)) inRange = false;
            if (endDate && tDate > new Date(endDate)) inRange = false;

            const impact = (entityType === 'CUSTOMER' || entityType === 'DUAL') 
                ? (parseFloat(t.debit || 0) - parseFloat(t.credit || 0)) 
                : (parseFloat(t.credit || 0) - parseFloat(t.debit || 0));

            if (startDate && tDate < new Date(startDate)) {
                // Accumulate to window opening
                running += impact;
                openingForWindow = running;
            } else if (inRange) {
                // In range, add to filtered list
                running += impact;
                filteredTxns.push({ ...t, running_balance: running });
            } else {
                // After range, just accumulate to total running
                running += impact;
            }
        }

        let closingForWindow = openingForWindow;
        if (filteredTxns.length > 0) {
            closingForWindow = filteredTxns[filteredTxns.length - 1].running_balance;
        }

        res.json({
            entity_name: info.name,
            opening_balance: openingForWindow,
            transactions: filteredTxns,
            closing_balance: closingForWindow,
            overall_closing_balance: running
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate statement chain.' });
    }
};


export const getDashboardFinancials = async (req, res) => {
    const { mode = 'FORMAL', startDate, endDate } = req.query;
    const cleanStartDate = startDate && typeof startDate === 'string' && startDate.trim() ? startDate.trim() : null;
    const cleanEndDate = endDate && typeof endDate === 'string' && endDate.trim() ? endDate.trim() : null;

    try {
        let revenue = 0, cogs = 0;

        if (mode === 'FORMAL') {
            let salesQuery = `
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM sales
                WHERE invoice_number NOT LIKE 'RET-%'
                  AND sale_type = 'PAKKA'
            `;
            const salesParams = [];
            if (cleanStartDate) {
                salesQuery += ` AND sale_date >= ?`;
                salesParams.push(cleanStartDate);
            }
            if (cleanEndDate) {
                salesQuery += ` AND sale_date <= ?`;
                salesParams.push(cleanEndDate);
            }
            const [salesRes] = await pool.query(salesQuery, salesParams);
            revenue = parseFloat(salesRes[0].total || 0);

            let purchQuery = `
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM supplier_bills
                WHERE bill_number NOT LIKE 'PRET-%'
                  AND status = 'FULFILLED'
            `;
            const purchParams = [];
            if (cleanStartDate) {
                purchQuery += ` AND bill_date >= ?`;
                purchParams.push(cleanStartDate);
            }
            if (cleanEndDate) {
                purchQuery += ` AND bill_date <= ?`;
                purchParams.push(cleanEndDate);
            }
            const [purchRes] = await pool.query(purchQuery, purchParams);
            cogs = parseFloat(purchRes[0].total || 0);

        } else {
            let actSalesQuery = `
                SELECT COALESCE(SUM(lia.net_godown_total), 0) as total
                FROM ledger_internal_actual lia
                JOIN sales s ON lia.voucher_no = s.voucher_no
                WHERE lia.entity_type = 'CUSTOMER'
                  AND lia.transaction_type NOT IN ('RETURN', 'PAYMENT')
            `;
            const actSalesParams = [];
            if (cleanStartDate) {
                actSalesQuery += ` AND s.sale_date >= ?`;
                actSalesParams.push(cleanStartDate);
            }
            if (cleanEndDate) {
                actSalesQuery += ` AND s.sale_date <= ?`;
                actSalesParams.push(cleanEndDate);
            }
            const [actSalesRes] = await pool.query(actSalesQuery, actSalesParams);
            revenue = parseFloat(actSalesRes[0].total || 0);

            let actPurchQuery = `
                SELECT COALESCE(SUM(lia.net_godown_total), 0) as total
                FROM ledger_internal_actual lia
                JOIN supplier_bills sb ON lia.voucher_no = sb.voucher_no
                WHERE lia.entity_type = 'SUPPLIER'
                  AND lia.transaction_type NOT IN ('RETURN', 'PAYMENT')
            `;
            const actPurchParams = [];
            if (cleanStartDate) {
                actPurchQuery += ` AND sb.bill_date >= ?`;
                actPurchParams.push(cleanStartDate);
            }
            if (cleanEndDate) {
                actPurchQuery += ` AND sb.bill_date <= ?`;
                actPurchParams.push(cleanEndDate);
            }
            const [actPurchRes] = await pool.query(actPurchQuery, actPurchParams);
            cogs = parseFloat(actPurchRes[0].total || 0);
        }

        const amountCol = mode === 'FORMAL' ? 'pakka_amount' : 'actual_amount';

        let expQuery = `
            SELECT COALESCE(SUM(${amountCol}), 0) as total
            FROM cashbook_transactions
            WHERE type = 'EXPENSE' AND related_type = 'INTERNAL'
        `;
        const expParams = [];
        if (cleanStartDate) {
            expQuery += ` AND transaction_date >= ?`;
            expParams.push(cleanStartDate);
        }
        if (cleanEndDate) {
            expQuery += ` AND transaction_date <= ?`;
            expParams.push(cleanEndDate);
        }
        const [expRes] = await pool.query(expQuery, expParams);
        const opExpenses = parseFloat(expRes[0].total || 0);

        let collectedQuery = `
            SELECT COALESCE(SUM(${amountCol}), 0) as total
            FROM cashbook_transactions WHERE type = 'INCOME'
        `;
        const collectedParams = [];
        if (cleanStartDate) {
            collectedQuery += ` AND transaction_date >= ?`;
            collectedParams.push(cleanStartDate);
        }
        if (cleanEndDate) {
            collectedQuery += ` AND transaction_date <= ?`;
            collectedParams.push(cleanEndDate);
        }
        const [collectedRes] = await pool.query(collectedQuery, collectedParams);
        const totalCollected = parseFloat(collectedRes[0].total || 0);

        let paidQuery = `
            SELECT COALESCE(SUM(${amountCol}), 0) as total
            FROM cashbook_transactions WHERE type = 'EXPENSE'
        `;
        const paidParams = [];
        if (cleanStartDate) {
            paidQuery += ` AND transaction_date >= ?`;
            paidParams.push(cleanStartDate);
        }
        if (cleanEndDate) {
            paidQuery += ` AND transaction_date <= ?`;
            paidParams.push(cleanEndDate);
        }
        const [paidRes] = await pool.query(paidQuery, paidParams);
        const totalPaidOut = parseFloat(paidRes[0].total || 0);

        let catQuery = `
            SELECT category, COALESCE(SUM(${amountCol}), 0) as total
            FROM cashbook_transactions
            WHERE type = 'EXPENSE'
        `;
        const catParams = [];
        if (cleanStartDate) {
            catQuery += ` AND transaction_date >= ?`;
            catParams.push(cleanStartDate);
        }
        if (cleanEndDate) {
            catQuery += ` AND transaction_date <= ?`;
            catParams.push(cleanEndDate);
        }
        catQuery += ` GROUP BY category ORDER BY total DESC`;
        const [catBreakdown] = await pool.query(catQuery, catParams);

        let actualReceivable = 0;
        let actualPayable = 0;

        // Only compute actualReceivable / actualPayable if mode is NOT FORMAL
        if (mode !== 'FORMAL') {
            const [customerLedgers] = await pool.query(`
                SELECT 
                    c.opening_balance_actual,
                    SUM(s.total_amount) as pakka_total,
                    SUM(s.balance) as pakka_pending,
                    SUM(lia.net_godown_total) as actual_total
                FROM customers c
                LEFT JOIN sales s ON c.id = s.customer_id
                LEFT JOIN ledger_internal_actual lia ON s.voucher_no = lia.voucher_no
                GROUP BY c.id, c.opening_balance_actual
            `);

            customerLedgers.forEach(r => {
                const actual_op = parseFloat(r.opening_balance_actual || 0);
                const pakka_total = parseFloat(r.pakka_total || 0);
                const pakka_pending = parseFloat(r.pakka_pending || 0);
                const pakka_paid = pakka_total - pakka_pending;
                
                const actual_total = parseFloat(r.actual_total || r.pakka_total || 0) + actual_op;
                const actual_pending = actual_total - pakka_paid;
                actualReceivable += actual_pending;
            });

            const [supplierLedgers] = await pool.query(`
                SELECT 
                    p.opening_balance_actual,
                    SUM(b.total_amount) as pakka_total,
                    SUM(b.balance_amount) as pakka_pending,
                    SUM(lia.net_godown_total) as actual_total
                FROM suppliers p
                LEFT JOIN supplier_bills b ON p.id = b.supplier_id
                LEFT JOIN ledger_internal_actual lia ON b.voucher_no = lia.voucher_no
                GROUP BY p.id, p.opening_balance_actual
            `);

            supplierLedgers.forEach(r => {
                const actual_op = parseFloat(r.opening_balance_actual || 0);
                const pakka_total = parseFloat(r.pakka_total || 0);
                const pakka_pending = parseFloat(r.pakka_pending || 0);
                const pakka_paid = pakka_total - pakka_pending;
                
                const actual_total = parseFloat(r.actual_total || r.pakka_total || 0) + actual_op;
                const actual_pending = actual_total - pakka_paid;
                actualPayable += actual_pending;
            });
        }

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - opExpenses;

        res.json({
            mode,
            revenue,
            cogs,
            grossProfit,
            opExpenses,
            netProfit,
            totalCollected,
            totalPaidOut,
            expenseBreakdown: catBreakdown,
            actualReceivable,
            actualPayable,
        });

    } catch (err) {
        console.error('getDashboardFinancials error:', err);
        res.status(500).json({ error: 'Failed to compute financial metrics' });
    }
};
