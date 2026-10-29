import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const getStaffMembers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM staff_members ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch staff members' });
    }
};

export const createStaffMember = async (req, res) => {
    const { name, mobile, role, salary_pakka, salary_actual } = req.body;
    try {
        const id = uuidv4();
        await pool.query(
            'INSERT INTO staff_members (id, name, mobile, role, salary_pakka, salary_actual) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, mobile, role || 'STAFF', salary_pakka || 0, salary_actual || 0]
        );
        res.status(201).json({ message: 'Staff member created successfully', id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create staff member' });
    }
};

export const updateStaffMember = async (req, res) => {
    const { id } = req.params;
    const { name, mobile, role, salary_pakka, salary_actual } = req.body;
    try {
        await pool.query(
            'UPDATE staff_members SET name=?, mobile=?, role=?, salary_pakka=?, salary_actual=? WHERE id=?',
            [name, mobile, role, salary_pakka, salary_actual, id]
        );
        res.status(200).json({ message: 'Staff member updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
};

export const getStaffLedger = async (req, res) => {
    const { id } = req.params;
    const { ledger_type } = req.query; // 'PAKKA' or 'ACTUAL'
    try {
        const query = ledger_type 
            ? 'SELECT * FROM staff_ledgers WHERE staff_id = ? AND ledger_type = ? ORDER BY transaction_date DESC, created_at DESC'
            : 'SELECT * FROM staff_ledgers WHERE staff_id = ? ORDER BY transaction_date DESC, created_at DESC';
        const params = ledger_type ? [id, ledger_type] : [id];
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch staff ledger' });
    }
};

export const addLedgerEntry = async (req, res) => {
    const { id } = req.params;
    const { transaction_date, ledger_type, transaction_type, amount, description } = req.body;
    try {
        const entryId = uuidv4();
        await pool.query(
            'INSERT INTO staff_ledgers (id, staff_id, transaction_date, ledger_type, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [entryId, id, transaction_date, ledger_type, transaction_type, amount, description]
        );
        res.status(201).json({ message: 'Ledger entry added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add ledger entry' });
    }
};

export const updateLedgerEntry = async (req, res) => {
    const { entryId } = req.params;
    const { transaction_date, transaction_type, amount, description } = req.body;
    try {
        await pool.query(
            'UPDATE staff_ledgers SET transaction_date=?, transaction_type=?, amount=?, description=? WHERE id=?',
            [transaction_date, transaction_type, amount, description, entryId]
        );
        res.status(200).json({ message: 'Ledger entry updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update ledger entry' });
    }
};

export const deleteLedgerEntry = async (req, res) => {
    const { entryId } = req.params;
    try {
        await pool.query('DELETE FROM staff_ledgers WHERE id=?', [entryId]);
        res.status(200).json({ message: 'Ledger entry deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete ledger entry' });
    }
};
