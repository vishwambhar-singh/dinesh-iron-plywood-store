import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Fetch all transactions
export const getTransactions = async (req, res) => {
    const { mode } = req.query; // 'PAKKA' or 'ACTUAL'
    try {
        let query = 'SELECT c.*, b.bank_name FROM cashbook_transactions c LEFT JOIN bank_accounts b ON c.bank_account_id = b.id';
        let params = [];
        
        if (mode === 'PAKKA') {
            query += ' WHERE c.pakka_amount > 0';
        }
        
        query += ' ORDER BY c.transaction_date DESC, c.created_at DESC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Cashbook Fetch Error:", err);
        res.status(500).json({ error: 'Failed to fetch cashbook records' });
    }
};

// Fetch summary (Total Income, Total Expense, Balance)
export const getSummary = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense,
                SUM(CASE WHEN type = 'INCOME' THEN pakka_amount ELSE 0 END) as pakka_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN pakka_amount ELSE 0 END) as pakka_expense,
                SUM(CASE WHEN type = 'INCOME' THEN actual_amount ELSE 0 END) as actual_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN actual_amount ELSE 0 END) as actual_expense
            FROM cashbook_transactions
        `);
        const income = parseFloat(rows[0].total_income || 0);
        const expense = parseFloat(rows[0].total_expense || 0);

        res.status(200).json({
            total_income: income,
            total_expense: expense,
            balance: income - expense,
            pakka: { income: parseFloat(rows[0].pakka_income || 0), expense: parseFloat(rows[0].pakka_expense || 0) },
            actual: { income: parseFloat(rows[0].actual_income || 0), expense: parseFloat(rows[0].actual_expense || 0) }
        });
    } catch (err) {
        console.error("Cashbook Summary Error:", err);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
};

// Fetch related orders for selection in Cashbook (Sales or Purchase)
export const getRelatedOrders = async (req, res) => {
    const { type } = req.query; // 'SALES', 'PURCHASE'
    try {
        let rows = [];
        if (type === 'SALES') {
            [rows] = await pool.query('SELECT id, invoice_number as label, balance as remaining FROM sales WHERE balance > 0 AND invoice_number NOT LIKE "RET-%" ORDER BY created_at DESC');
        } else if (type === 'PURCHASE') {
            [rows] = await pool.query('SELECT id, bill_number as label, balance_amount as remaining FROM supplier_bills WHERE balance_amount > 0 AND bill_number NOT LIKE "RET-%" ORDER BY created_at DESC');
        } else if (type === 'SALES_RETURN') {
            [rows] = await pool.query('SELECT id, invoice_number as label, balance as remaining FROM sales WHERE invoice_number LIKE "RET-%" AND balance > 0 ORDER BY created_at DESC');
        } else if (type === 'PURCHASE_RETURN') {
            [rows] = await pool.query('SELECT id, bill_number as label, balance_amount as remaining FROM supplier_bills WHERE bill_number LIKE "RET-%" AND balance_amount > 0 ORDER BY created_at DESC');
        }
        res.status(200).json(rows);
    } catch (err) {
        console.error("Fetch Orders Error:", err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Fetch history of cashbook entries for a specific order
export const getOrderHistory = async (req, res) => {
    const { orderId } = req.params;
    try {
        const [rows] = await pool.query('SELECT c.*, b.bank_name FROM cashbook_transactions c LEFT JOIN bank_accounts b ON c.bank_account_id = b.id WHERE c.related_id = ? ORDER BY transaction_date DESC', [orderId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Order History Fetch Error:", err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

// Add new manual transaction
export const addTransaction = async (req, res) => {
    const { 
        transaction_date, type, category, amount, payment_method, 
        description, entity_name, related_type, related_id,
        pakka_amount, actual_amount, is_split, bank_account_id 
    } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const totalAmt = parseFloat(amount || 0);
        if (totalAmt <= 0) return res.status(400).json({ error: 'Invalid amount entered.' });

        const pAmt = parseFloat(pakka_amount || 0);
        const aAmt = parseFloat(actual_amount || 0);

        const id = uuidv4();
        await connection.query(
            `INSERT INTO cashbook_transactions 
            (id, transaction_date, type, category, amount, payment_method, description, entity_name, related_type, related_id, pakka_amount, actual_amount, is_automatic, bank_account_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, transaction_date, type, category, totalAmt, payment_method, description, entity_name || null, related_type || 'INTERNAL', related_id || null, pAmt, aAmt, !!is_split, bank_account_id || null]
        );

        // If it's against an order, update the order's balance
        if (related_type === 'SALES' && related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid + ?, balance = balance - ?, payment_status = CASE WHEN balance <= 0 THEN "PAID" ELSE "PARTIALLY_PAID" END WHERE id = ?',
                [parseFloat(amount), parseFloat(amount), related_id]
            );
        } else if (related_type === 'PURCHASE' && related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid + ?, balance_amount = balance_amount - ? WHERE id = ?',
                [parseFloat(amount), parseFloat(amount), related_id]
            );
        } else if (related_type === 'SALES_RETURN' && related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid + ?, balance = GREATEST(balance - ?, 0) WHERE id = ?',
                [parseFloat(amount), parseFloat(amount), related_id]
            );
        } else if (related_type === 'PURCHASE_RETURN' && related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid + ?, balance_amount = GREATEST(balance_amount - ?, 0) WHERE id = ?',
                [parseFloat(amount), parseFloat(amount), related_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Transaction safely committed to Cashbook and balance updated.' });
    } catch (err) {
        await connection.rollback();
        console.error("Cashbook Insert Error:", err);
        res.status(500).json({ error: 'Failed to log transaction' });
    } finally {
        connection.release();
    }
};

export const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [txRows] = await connection.query('SELECT * FROM cashbook_transactions WHERE id = ?', [id]);
        if (txRows.length === 0) throw new Error('Transaction not found');
        const tx = txRows[txRows.length - 1]; // Just in case of duplicates or error, take last

        // Reverse balance updates
        const amount = parseFloat(tx.amount);
        if (tx.related_type === 'SALES' && tx.related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid - ?, balance = balance + ?, payment_status = CASE WHEN balance <= 0 THEN "PAID" ELSE "PARTIALLY_PAID" END WHERE id = ?',
                [amount, amount, tx.related_id]
            );
        } else if (tx.related_type === 'PURCHASE' && tx.related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid - ?, balance_amount = balance_amount + ? WHERE id = ?',
                [amount, amount, tx.related_id]
            );
        } else if (tx.related_type === 'SALES_RETURN' && tx.related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid - ?, balance = balance + ? WHERE id = ?',
                [amount, amount, tx.related_id]
            );
        } else if (tx.related_type === 'PURCHASE_RETURN' && tx.related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid - ?, balance_amount = balance_amount + ? WHERE id = ?',
                [amount, amount, tx.related_id]
            );
        }

        await connection.query('DELETE FROM cashbook_transactions WHERE id = ?', [id]);

        await connection.commit();
        res.status(200).json({ message: 'Transaction reversed and deleted' });
    } catch (err) {
        await connection.rollback();
        console.error("Delete Transaction Error:", err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    } finally {
        connection.release();
    }
};

// Fetch Consolidated Party Summaries (Net Balance across all orders)
export const updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { 
        transaction_date, type, category, amount, payment_method, 
        description, entity_name, related_type, related_id,
        pakka_amount, actual_amount, is_split, bank_account_id 
    } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [txRows] = await connection.query('SELECT * FROM cashbook_transactions WHERE id = ?', [id]);
        if (txRows.length === 0) throw new Error('Transaction not found');
        const oldTx = txRows[0];

        // Reverse old balance updates
        const oldAmount = parseFloat(oldTx.amount);
        if (oldTx.related_type === 'SALES' && oldTx.related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid - ?, balance = balance + ?, payment_status = CASE WHEN balance <= 0 THEN "PAID" ELSE "PARTIALLY_PAID" END WHERE id = ?',
                [oldAmount, oldAmount, oldTx.related_id]
            );
        } else if (oldTx.related_type === 'PURCHASE' && oldTx.related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid - ?, balance_amount = balance_amount + ? WHERE id = ?',
                [oldAmount, oldAmount, oldTx.related_id]
            );
        } else if (oldTx.related_type === 'SALES_RETURN' && oldTx.related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid - ?, balance = balance + ? WHERE id = ?',
                [oldAmount, oldAmount, oldTx.related_id]
            );
        } else if (oldTx.related_type === 'PURCHASE_RETURN' && oldTx.related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid - ?, balance_amount = balance_amount + ? WHERE id = ?',
                [oldAmount, oldAmount, oldTx.related_id]
            );
        }

        const newTotalAmt = parseFloat(amount || 0);
        if (newTotalAmt <= 0) throw new Error('Invalid amount entered.');

        const pAmt = parseFloat(pakka_amount || 0);
        const aAmt = parseFloat(actual_amount || 0);

        // Update the transaction
        await connection.query(
            `UPDATE cashbook_transactions SET 
            transaction_date = ?, type = ?, category = ?, amount = ?, payment_method = ?, description = ?, entity_name = ?, related_type = ?, related_id = ?, pakka_amount = ?, actual_amount = ?, is_automatic = ?, bank_account_id = ?
            WHERE id = ?`,
            [transaction_date, type, category, newTotalAmt, payment_method, description, entity_name || null, related_type || 'INTERNAL', related_id || null, pAmt, aAmt, !!is_split, bank_account_id || null, id]
        );

        // Apply new balance updates
        if (related_type === 'SALES' && related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid + ?, balance = balance - ?, payment_status = CASE WHEN balance <= 0 THEN "PAID" ELSE "PARTIALLY_PAID" END WHERE id = ?',
                [newTotalAmt, newTotalAmt, related_id]
            );
        } else if (related_type === 'PURCHASE' && related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid + ?, balance_amount = balance_amount - ? WHERE id = ?',
                [newTotalAmt, newTotalAmt, related_id]
            );
        } else if (related_type === 'SALES_RETURN' && related_id) {
            await connection.query(
                'UPDATE sales SET amount_paid = amount_paid + ?, balance = GREATEST(balance - ?, 0) WHERE id = ?',
                [newTotalAmt, newTotalAmt, related_id]
            );
        } else if (related_type === 'PURCHASE_RETURN' && related_id) {
            await connection.query(
                'UPDATE supplier_bills SET amount_paid = amount_paid + ?, balance_amount = GREATEST(balance_amount - ?, 0) WHERE id = ?',
                [newTotalAmt, newTotalAmt, related_id]
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Transaction safely updated and balances recalculated.' });
    } catch (err) {
        await connection.rollback();
        console.error("Update Transaction Error:", err);
        res.status(500).json({ error: err.message || 'Failed to update transaction' });
    } finally {
        connection.release();
    }
};

// Fetch Consolidated Party Summaries (Net Balance across all orders)
export const getPartySummaries = async (req, res) => {
    try {
        let startDate = req.query.startDate;
        let endDate = req.query.endDate;

        if (startDate === 'null' || startDate === 'undefined' || startDate === '') {
            startDate = null;
        }
        if (endDate === 'null' || endDate === 'undefined' || endDate === '') {
            endDate = null;
        }

        const buildPartyQuery = (entityType, tableName) => {
            const params = [];
            
            const billedBeforePakkaSub = `SELECT COALESCE(SUM(net_invoice_total), 0) FROM ledger_formal_pakka WHERE entity_id = e.id AND entity_type = '${entityType}'`;
            const billedBeforeActualSub = `SELECT COALESCE(SUM(net_godown_total), 0) FROM ledger_internal_actual WHERE entity_id = e.id AND entity_type = '${entityType}'`;
            
            const relatedTypes = entityType === 'CUSTOMER' ? "('SALES', 'INTERNAL')" : "('PURCHASE', 'INTERNAL')";
            
            const incomeBeforeSub = `SELECT COALESCE(SUM(amount), 0) FROM cashbook_transactions WHERE entity_name = e.name AND related_type IN ${relatedTypes} AND type = 'INCOME'`;
            const expenseBeforeSub = `SELECT COALESCE(SUM(amount), 0) FROM cashbook_transactions WHERE entity_name = e.name AND related_type IN ${relatedTypes} AND type = 'EXPENSE'`;

            const billedDuringPakkaSub = `SELECT COALESCE(SUM(net_invoice_total), 0) FROM ledger_formal_pakka WHERE entity_id = e.id AND entity_type = '${entityType}'`;
            const billedDuringActualSub = `SELECT COALESCE(SUM(net_godown_total), 0) FROM ledger_internal_actual WHERE entity_id = e.id AND entity_type = '${entityType}'`;
            
            const incomeDuringSub = `SELECT COALESCE(SUM(amount), 0) FROM cashbook_transactions WHERE entity_name = e.name AND related_type IN ${relatedTypes} AND type = 'INCOME'`;
            const expenseDuringSub = `SELECT COALESCE(SUM(amount), 0) FROM cashbook_transactions WHERE entity_name = e.name AND related_type IN ${relatedTypes} AND type = 'EXPENSE'`;

            let beforeCond = '';
            if (startDate) {
                beforeCond = ' AND DATE(created_at) < DATE(?)';
                params.push(startDate, startDate, startDate, startDate);
            } else {
                beforeCond = ' AND 1 = 0';
            }

            let duringCond = '';
            if (startDate) {
                duringCond += ' AND DATE(created_at) >= DATE(?)';
            }
            if (endDate) {
                duringCond += ' AND DATE(created_at) <= DATE(?)';
            }

            // Push parameters for during conditions
            for (let i = 0; i < 4; i++) {
                if (startDate) params.push(startDate);
                if (endDate) params.push(endDate);
            }

            const query = `
                SELECT 
                    e.id, e.name, '${entityType}' as type,
                    e.opening_balance_pakka, e.opening_balance_actual,
                    (${billedBeforePakkaSub}${beforeCond}) as billed_before_pakka,
                    (${billedBeforeActualSub}${beforeCond}) as billed_before_actual,
                    (${incomeBeforeSub}${beforeCond}) as income_before,
                    (${expenseBeforeSub}${beforeCond}) as expense_before,
                    (${billedDuringPakkaSub}${duringCond}) as billed_during_pakka,
                    (${billedDuringActualSub}${duringCond}) as billed_during_actual,
                    (${incomeDuringSub}${duringCond}) as income_during,
                    (${expenseDuringSub}${duringCond}) as expense_during
                FROM ${tableName} e
            `;
            return { query, params };
        };

        const custObj = buildPartyQuery('CUSTOMER', 'customers');
        const [customerStats] = await pool.query(custObj.query, custObj.params);

        const suppObj = buildPartyQuery('SUPPLIER', 'suppliers');
        const [supplierStats] = await pool.query(suppObj.query, suppObj.params);

        // Combine
        const result = [...customerStats, ...supplierStats];
        res.status(200).json(result);
    } catch (err) {
        console.error("Party Summary Error:", err);
        res.status(500).json({ error: 'Failed to fetch party-wise ledgers' });
    }
};

export const getAccountLedgers = async (req, res) => {
    try {
        const [accounts] = await pool.query('SELECT * FROM bank_accounts ORDER BY bank_name ASC');
        res.status(200).json(accounts);
    } catch (err) {
        console.error("Account Ledgers Error:", err);
        res.status(500).json({ error: 'Failed to fetch account ledgers' });
    }
};


export const bulkDeleteTransactions = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ error: 'No transaction IDs provided' });
        
        await pool.query('DELETE FROM cashbook_transactions WHERE id IN (?)', [ids]);
        res.json({ message: 'Transactions deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error deleting transactions' });
    }
};
