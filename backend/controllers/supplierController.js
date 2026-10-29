import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const createSupplier = async (req, res) => {
    const { 
        name, email, mobile, gst_number, opening_balance_pakka, opening_balance_actual, 
        closing_balance, address, state, country, registration_type, pan,
        is_also_customer, link_customer_id, customer_opening_balance_pakka, customer_opening_balance_actual
    } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const supplierId = uuidv4();
        await conn.query(
            'INSERT INTO suppliers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [supplierId, name || 'Unnamed Supplier', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, opening_balance_pakka || 0, opening_balance_actual || 0, closing_balance || 0]
        );

        let linkedCustomerId = null;
        if (is_also_customer) {
            if (link_customer_id) {
                linkedCustomerId = link_customer_id;
            } else {
                // Auto-create matching customer
                linkedCustomerId = uuidv4();
                await conn.query(
                    'INSERT INTO customers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [linkedCustomerId, name || 'Unnamed Customer', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, customer_opening_balance_pakka || 0, customer_opening_balance_actual || 0, 0]
                );
            }

            // Create link
            const linkId = uuidv4();
            await conn.query(
                'INSERT INTO dual_entity_links (id, customer_id, supplier_id, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)',
                [linkId, linkedCustomerId, supplierId, req.user?.id || null]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Supplier created successfully', id: supplierId, linked_customer_id: linkedCustomerId });
    } catch (err) {
        await conn.rollback();
        console.error('createSupplier error:', err);
        res.status(500).json({ error: 'Failed to create supplier' });
    } finally {
        conn.release();
    }
};

const getAllSuppliers = async (req, res) => {
    try {
        const { statusFilter, showInactive } = req.query;
        let filterClause = '';
        if (statusFilter === 'INACTIVE') {
            filterClause = 's.is_active = 0';
        } else if (statusFilter === 'ALL' || showInactive === 'true') {
            filterClause = '';
        } else {
            filterClause = 's.is_active = 1';
        }
        let query = `
            SELECT s.*, 
                   del.id as dual_link_id, 
                   del.customer_id as linked_customer_id, 
                   c.name as linked_customer_name
            FROM suppliers s
            LEFT JOIN dual_entity_links del ON s.id = del.supplier_id
            LEFT JOIN customers c ON del.customer_id = c.id
        `;
        if (filterClause) {
            query += ' WHERE ' + filterClause;
        }
        query += ' ORDER BY s.created_at DESC';
        const [rows] = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('getAllSuppliers error:', err);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};

const getSupplierById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT s.*, 
                   del.id as dual_link_id, 
                   del.customer_id as linked_customer_id, 
                   c.name as linked_customer_name
            FROM suppliers s
            LEFT JOIN dual_entity_links del ON s.id = del.supplier_id
            LEFT JOIN customers c ON del.customer_id = c.id
            WHERE s.id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Supplier not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('getSupplierById error:', err);
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
};

const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { 
        name, email, mobile, gst_number, opening_balance_pakka, opening_balance_actual, 
        closing_balance, address, state, country, registration_type, pan, is_active,
        is_also_customer, link_customer_id, customer_opening_balance_pakka, customer_opening_balance_actual
    } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const isActive = is_active === undefined ? 1 : (is_active ? 1 : 0);
        await conn.query(
            'UPDATE suppliers SET name = ?, email = ?, mobile = ?, gstNumber = ?, address = ?, state = ?, country = ?, registration_type = ?, pan = ?, opening_balance_pakka = ?, opening_balance_actual = ?, closing_balance = ?, is_active = ? WHERE id = ?',
            [name || 'Unnamed Supplier', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, opening_balance_pakka || 0, opening_balance_actual || 0, closing_balance || 0, isActive, id]
        );

        // Handle dual linking
        if (is_also_customer !== undefined) {
            if (is_also_customer) {
                let targetCustomerId = link_customer_id;
                if (!targetCustomerId) {
                    const [existingLink] = await conn.query('SELECT customer_id FROM dual_entity_links WHERE supplier_id = ?', [id]);
                    if (existingLink.length > 0) {
                        targetCustomerId = existingLink[0].customer_id;
                    } else {
                        targetCustomerId = uuidv4();
                        await conn.query(
                            'INSERT INTO customers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [targetCustomerId, name || 'Unnamed Customer', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, customer_opening_balance_pakka || 0, customer_opening_balance_actual || 0, 0]
                        );
                    }
                }

                const linkId = uuidv4();
                await conn.query(
                    'INSERT INTO dual_entity_links (id, customer_id, supplier_id, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)',
                    [linkId, targetCustomerId, id, req.user?.id || null]
                );
            } else {
                await conn.query('DELETE FROM dual_entity_links WHERE supplier_id = ?', [id]);
            }
        }

        await conn.commit();
        res.status(200).json({ message: 'Supplier updated successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('updateSupplier error:', err);
        res.status(500).json({ error: 'Failed to update supplier' });
    } finally {
        conn.release();
    }
};

const deleteSupplier = async (req, res) => {
    const { id } = req.params;
    try {
        // Check for supplier bills
        const [billsRes] = await pool.query('SELECT COUNT(*) as count FROM supplier_bills WHERE supplier_id = ?', [id]);
        // Check for actual ledger entries
        const [liaRes] = await pool.query('SELECT COUNT(*) as count FROM ledger_internal_actual WHERE entity_id = ?', [id]);
        
        const hasBills = billsRes[0].count > 0;
        const hasLia = liaRes[0].count > 0;
        
        if (hasBills || hasLia) {
            // Associated ledger exists - mark inactive
            await pool.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
            res.status(200).json({ message: 'Supplier marked inactive because they have associated ledger transactions.', markedInactive: true });
        } else {
            // Safe to delete
            await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
            res.status(200).json({ message: 'Supplier deleted successfully.' });
        }
    } catch (err) {
        console.error('deleteSupplier error:', err);
        res.status(500).json({ error: 'Failed to process supplier deletion' });
    }
};

export default { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier };
