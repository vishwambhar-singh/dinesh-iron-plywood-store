import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const getBankAccounts = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bank_accounts ORDER BY created_at ASC');
        res.status(200).json(rows);
    } catch (err) {
        console.error("Fetch Bank Accounts Error:", err);
        res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
};

export const addBankAccount = async (req, res) => {
    const { bank_name, account_name, account_number, ifsc_code, branch, opening_balance_pakka, opening_balance_actual } = req.body;
    try {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO bank_accounts (id, bank_name, account_name, account_number, ifsc_code, branch, opening_balance_pakka, opening_balance_actual) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, bank_name, account_name, account_number, ifsc_code || null, branch || null, opening_balance_pakka || 0, opening_balance_actual || 0]
        );
        res.status(201).json({ message: 'Bank account created successfully', id });
    } catch (err) {
        console.error("Create Bank Account Error:", err);
        res.status(500).json({ error: 'Failed to create bank account' });
    }
};

export const updateBankAccount = async (req, res) => {
    const { id } = req.params;
    const { bank_name, account_name, account_number, ifsc_code, branch, opening_balance_pakka, opening_balance_actual } = req.body;
    try {
        await pool.query(
            `UPDATE bank_accounts 
             SET bank_name=?, account_name=?, account_number=?, ifsc_code=?, branch=?, opening_balance_pakka=?, opening_balance_actual=? 
             WHERE id=?`,
            [bank_name, account_name, account_number, ifsc_code || null, branch || null, opening_balance_pakka || 0, opening_balance_actual || 0, id]
        );
        res.status(200).json({ message: 'Bank account updated successfully' });
    } catch (err) {
        console.error("Update Bank Account Error:", err);
        res.status(500).json({ error: 'Failed to update bank account' });
    }
};

export const deleteBankAccount = async (req, res) => {
    const { id } = req.params;
    try {
        // Optional: Check if transactions exist before deleting, or just set bank_account_id to NULL
        await pool.query('UPDATE cashbook_transactions SET bank_account_id = NULL WHERE bank_account_id = ?', [id]);
        await pool.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
        res.status(200).json({ message: 'Bank account deleted successfully' });
    } catch (err) {
        console.error("Delete Bank Account Error:", err);
        res.status(500).json({ error: 'Failed to delete bank account' });
    }
};
