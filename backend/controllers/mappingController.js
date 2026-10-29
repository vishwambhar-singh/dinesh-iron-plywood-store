import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const mapSupplierToItem = async (req, res) => {
    const { supplier_id, item_id, pakka_buying_rate, kaccha_deduction_commission } = req.body;

    try {
        const id = uuidv4();
        await pool.query(
            'INSERT INTO supplier_item_mapping (id, supplier_id, item_id, pakka_buying_rate, kaccha_deduction_commission) VALUES (?, ?, ?, ?, ?)',
            [id, supplier_id, item_id, pakka_buying_rate, kaccha_deduction_commission]
        );
        res.status(201).json({ message: 'Supplier constraint successfully mapped' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'This Item is already strictly mapped to this Supplier.' });
        }
        res.status(500).json({ error: 'Failed to construct relationship matrix' });
    }
};

export const fetchSupplierMappings = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, s.name as supplier_name, i.name as item_name, i.hsn_code, i.base_pakka_purchase_rate
            FROM supplier_item_mapping m
            JOIN suppliers s ON m.supplier_id = s.id
            JOIN items i ON m.item_id = i.id
            ORDER BY i.name ASC, s.name ASC
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('fetchSupplierMappings error:', err);
        res.status(500).json({ error: 'Mapping retrieval failed' });
    }
};

export const updateSupplierMapping = async (req, res) => {
    const { id } = req.params;
    const { pakka_buying_rate, kaccha_deduction_commission } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [oldRows] = await connection.query('SELECT pakka_buying_rate, kaccha_deduction_commission FROM supplier_item_mapping WHERE id = ?', [id]);
        if (oldRows.length > 0) {
            const oldPakka = parseFloat(oldRows[0].pakka_buying_rate);
            const newPakka = parseFloat(pakka_buying_rate);
            const oldDed = parseFloat(oldRows[0].kaccha_deduction_commission);
            const newDed = parseFloat(kaccha_deduction_commission);

            if (oldPakka !== newPakka) {
                await connection.query('INSERT INTO price_change_log (entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?)', 
                    ['SUPPLIER_PAKKA_BUY', id, oldPakka, newPakka]);
            }
            if (oldDed !== newDed) {
                await connection.query('INSERT INTO price_change_log (entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?)', 
                    ['SUPPLIER_ACTUAL_DEDUCTION', id, oldDed, newDed]);
            }
        }

        await connection.query(
            'UPDATE supplier_item_mapping SET pakka_buying_rate = ?, kaccha_deduction_commission = ? WHERE id = ?',
            [pakka_buying_rate, kaccha_deduction_commission, id]
        );
        await connection.commit();
        res.status(200).json({ message: 'Supplier parameters securely updated and audited' });
    } catch (err) {
        await connection.rollback();
        console.error('updateSupplierMapping error:', err);
        res.status(500).json({ error: 'Failed to update mapping' });
    } finally {
        connection.release();
    }
};

export const mapCustomerToItem = async (req, res) => {
    const { customer_id, item_id, actual_selling_price } = req.body;

    try {
        const id = uuidv4();
        await pool.query(
            'INSERT INTO customer_item_mapping (id, customer_id, item_id, actual_selling_price) VALUES (?, ?, ?, ?)',
            [id, customer_id, item_id, actual_selling_price]
        );
        res.status(201).json({ message: 'Customer increment logic mapped successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Customer specific constraints already exist for this item.' });
        }
        console.error('mapCustomerToItem error:', err);
        res.status(500).json({ error: 'Failed to construct customer constraint' });
    }
};

export const fetchCustomerMappings = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, c.name as customer_name, i.name as item_name, i.hsn_code, i.base_pakka_selling_rate 
            FROM customer_item_mapping m
            JOIN customers c ON m.customer_id = c.id
            JOIN items i ON m.item_id = i.id
            ORDER BY i.name ASC, c.name ASC
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('fetchCustomerMappings error:', err);
        res.status(500).json({ error: 'Customer Mapping retrieval failed' });
    }
};

export const updateCustomerMapping = async (req, res) => {
    const { id } = req.params;
    const { actual_selling_price } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [oldRows] = await connection.query('SELECT actual_selling_price FROM customer_item_mapping WHERE id = ?', [id]);
        if (oldRows.length > 0) {
            const oldPrice = parseFloat(oldRows[0].actual_selling_price);
            const newPrice = parseFloat(actual_selling_price);
            if (oldPrice !== newPrice) {
                await connection.query('INSERT INTO price_change_log (entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?)', 
                    ['CUSTOMER_ACTUAL_SALE', id, oldPrice, newPrice]);
            }
        }

        await connection.query(
            'UPDATE customer_item_mapping SET actual_selling_price = ? WHERE id = ?',
            [actual_selling_price, id]
        );
        await connection.commit();
        res.status(200).json({ message: 'Customer increment securely updated and audited' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to update customer mapping' });
    } finally {
        connection.release();
    }
};

export const deleteSupplierMapping = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM supplier_item_mapping WHERE id = ?', [id]);
        res.status(200).json({ message: 'Supplier mapping deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete mapping' });
    }
};

export const deleteCustomerMapping = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM customer_item_mapping WHERE id = ?', [id]);
        res.status(200).json({ message: 'Customer mapping deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete mapping' });
    }
};

export const bulkMapSuppliersToItem = async (req, res) => {
    const { item_id, mappings } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const map of mappings) {
            const id = uuidv4();
            await connection.query(`
                INSERT INTO supplier_item_mapping (id, supplier_id, item_id, pakka_buying_rate, kaccha_deduction_commission)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                pakka_buying_rate = VALUES(pakka_buying_rate),
                kaccha_deduction_commission = VALUES(kaccha_deduction_commission)
            `, [id, map.supplier_id, item_id, map.pakka_buying_rate, map.kaccha_deduction_commission]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Bulk supplier mappings updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('bulkMapSuppliersToItem error:', err);
        res.status(500).json({ error: 'Failed to bulk update mappings' });
    } finally {
        connection.release();
    }
};

export const bulkMapCustomersToItem = async (req, res) => {
    const { item_id, mappings } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const map of mappings) {
            const id = uuidv4();
            await connection.query(`
                INSERT INTO customer_item_mapping (id, customer_id, item_id, actual_selling_price)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                actual_selling_price = VALUES(actual_selling_price)
            `, [id, map.customer_id, item_id, map.actual_selling_price]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Bulk customer mappings updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('bulkMapCustomersToItem error:', err);
        res.status(500).json({ error: 'Failed to bulk update mappings' });
    } finally {
        connection.release();
    }
};

