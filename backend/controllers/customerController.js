import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const createCustomer = async (req, res) => {
    const { 
        name, email, mobile, gst_number, opening_balance_pakka, opening_balance_actual, 
        closing_balance, address, state, country, registration_type, pan,
        is_also_supplier, link_supplier_id, supplier_opening_balance_pakka, supplier_opening_balance_actual
    } = req.body;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const customerId = uuidv4();
        await conn.query(
            'INSERT INTO customers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [customerId, name || 'Unnamed Customer', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, opening_balance_pakka || 0, opening_balance_actual || 0, closing_balance || 0]
        );

        let linkedSupplierId = null;
        if (is_also_supplier) {
            if (link_supplier_id) {
                linkedSupplierId = link_supplier_id;
            } else {
                // Auto-create matching supplier
                linkedSupplierId = uuidv4();
                await conn.query(
                    'INSERT INTO suppliers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [linkedSupplierId, name || 'Unnamed Supplier', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, supplier_opening_balance_pakka || 0, supplier_opening_balance_actual || 0, 0]
                );
            }

            // Create link
            const linkId = uuidv4();
            await conn.query(
                'INSERT INTO dual_entity_links (id, customer_id, supplier_id, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE supplier_id = VALUES(supplier_id)',
                [linkId, customerId, linkedSupplierId, req.user?.id || null]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Customer created successfully', id: customerId, linked_supplier_id: linkedSupplierId });
    } catch (err) {
        await conn.rollback();
        console.error('createCustomer error:', err);
        res.status(500).json({ error: 'Failed to create customer' });
    } finally {
        conn.release();
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const { page, limit, search, sort, dir, statusFilter, showInactive } = req.query;
        let filterClause = '';
        if (statusFilter === 'INACTIVE') {
            filterClause = 'c.is_active = 0';
        } else if (statusFilter === 'ALL' || showInactive === 'true') {
            filterClause = '';
        } else {
            filterClause = 'c.is_active = 1';
        }

        const baseSelect = `
            SELECT c.*, 
                   del.id as dual_link_id, 
                   del.supplier_id as linked_supplier_id, 
                   s.name as linked_supplier_name
            FROM customers c
            LEFT JOIN dual_entity_links del ON c.id = del.customer_id
            LEFT JOIN suppliers s ON del.supplier_id = s.id
        `;

        // If no pagination requested, return all (for dropdowns)
        if (!page) {
            let query = baseSelect;
            if (filterClause) {
                query += ' WHERE ' + filterClause;
            }
            query += ' ORDER BY c.created_at DESC';
            const [rows] = await pool.query(query);
            return res.status(200).json(rows);
        }

        // Pagination mode
        let query = baseSelect;
        let countQuery = 'SELECT COUNT(*) as total FROM customers c';
        let params = [];
        
        let whereClauses = [];
        if (filterClause) {
            whereClauses.push(filterClause);
        }
        if (search) {
            whereClauses.push('(c.name LIKE ? OR c.mobile LIKE ? OR c.email LIKE ? OR c.gstNumber LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
        
        if (whereClauses.length > 0) {
            const whereStr = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStr;
            countQuery += whereStr;
        }

        const validSortCols = ['name', 'mobile', 'email', 'gstNumber', 'closing_balance', 'created_at'];
        const sortCol = validSortCols.includes(sort) ? `c.${sort}` : 'c.created_at';
        const sortDir = dir === 'asc' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY ${sortCol} ${sortDir}`;

        // Get total count
        const [countResult] = await pool.query(countQuery, params);
        const total = countResult[0].total;

        // Add limit and offset
        const parsedLimit = parseInt(limit) || 10;
        const parsedPage = parseInt(page) || 1;
        query += ' LIMIT ? OFFSET ?';
        params.push(parsedLimit, (parsedPage - 1) * parsedLimit);

        const [rows] = await pool.query(query, params);
        res.status(200).json({ data: rows, total });
    } catch (err) {
        console.error('getAllCustomers error:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

const getCustomerById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
                   del.id as dual_link_id, 
                   del.supplier_id as linked_supplier_id, 
                   s.name as linked_supplier_name
            FROM customers c
            LEFT JOIN dual_entity_links del ON c.id = del.customer_id
            LEFT JOIN suppliers s ON del.supplier_id = s.id
            WHERE c.id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('getCustomerById error:', err);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { 
        name, email, mobile, gst_number, opening_balance_pakka, opening_balance_actual, 
        closing_balance, address, state, country, registration_type, pan, is_active,
        is_also_supplier, link_supplier_id, supplier_opening_balance_pakka, supplier_opening_balance_actual
    } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const isActive = is_active === undefined ? 1 : (is_active ? 1 : 0);
        await conn.query(
            'UPDATE customers SET name = ?, email = ?, mobile = ?, gstNumber = ?, address = ?, state = ?, country = ?, registration_type = ?, pan = ?, opening_balance_pakka = ?, opening_balance_actual = ?, closing_balance = ?, is_active = ? WHERE id = ?',
            [name || 'Unnamed Customer', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, opening_balance_pakka || 0, opening_balance_actual || 0, closing_balance || 0, isActive, id]
        );

        // Handle dual linking
        if (is_also_supplier !== undefined) {
            if (is_also_supplier) {
                let targetSupplierId = link_supplier_id;
                if (!targetSupplierId) {
                    // Check if already linked
                    const [existingLink] = await conn.query('SELECT supplier_id FROM dual_entity_links WHERE customer_id = ?', [id]);
                    if (existingLink.length > 0) {
                        targetSupplierId = existingLink[0].supplier_id;
                    } else {
                        // Create supplier
                        targetSupplierId = uuidv4();
                        await conn.query(
                            'INSERT INTO suppliers (id, name, email, mobile, gstNumber, address, state, country, registration_type, pan, opening_balance_pakka, opening_balance_actual, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [targetSupplierId, name || 'Unnamed Supplier', email || null, mobile || 'Not Provided', gst_number || null, address || null, state || null, country || 'India', registration_type || 'Regular', pan || null, supplier_opening_balance_pakka || 0, supplier_opening_balance_actual || 0, 0]
                        );
                    }
                }

                const linkId = uuidv4();
                await conn.query(
                    'INSERT INTO dual_entity_links (id, customer_id, supplier_id, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE supplier_id = VALUES(supplier_id)',
                    [linkId, id, targetSupplierId, req.user?.id || null]
                );
            } else {
                // If explicitly unchecked, remove link
                await conn.query('DELETE FROM dual_entity_links WHERE customer_id = ?', [id]);
            }
        }

        await conn.commit();
        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('updateCustomer error:', err);
        res.status(500).json({ error: 'Failed to update customer' });
    } finally {
        conn.release();
    }
};

const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        // Check for sales invoices
        const [salesRes] = await pool.query('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?', [id]);
        // Check for actual ledger entries
        const [liaRes] = await pool.query('SELECT COUNT(*) as count FROM ledger_internal_actual WHERE entity_id = ?', [id]);
        
        const hasSales = salesRes[0].count > 0;
        const hasLia = liaRes[0].count > 0;
        
        if (hasSales || hasLia) {
            // Associated ledger exists - mark inactive
            await pool.query('UPDATE customers SET is_active = 0 WHERE id = ?', [id]);
            res.status(200).json({ message: 'Customer marked inactive because they have associated ledger transactions.', markedInactive: true });
        } else {
            // Safe to delete
            await pool.query('DELETE FROM customers WHERE id = ?', [id]);
            res.status(200).json({ message: 'Customer deleted successfully.' });
        }
    } catch (err) {
        console.error('deleteCustomer error:', err);
        res.status(500).json({ error: 'Failed to process customer deletion' });
    }
};

export default { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };
