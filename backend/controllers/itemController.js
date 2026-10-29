import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import xlsx from 'xlsx';

export const createItem = async (req, res) => {
    const { name, hsn_code, base_pakka_selling_rate, base_pakka_purchase_rate, shades } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const itemId = uuidv4();
        await connection.query(
            'INSERT INTO items (id, name, hsn_code, base_pakka_selling_rate, base_pakka_purchase_rate, tax_bracket_percent) VALUES (?, ?, ?, ?, ?, ?)',
            [itemId, name, hsn_code, base_pakka_selling_rate, base_pakka_purchase_rate || 0, 18.00]
        );

        if (shades && Array.isArray(shades)) {
            for (const shade of shades) {
                // Support both string ['S1', 'S2'] and object [{category: 'A', label: 'S1'}] formats
                const label = typeof shade === 'string' ? shade.trim() : (shade.label || shade.shade_id_label || '').trim();
                const category = typeof shade === 'object' ? (shade.category || 'GENERAL').trim() : 'GENERAL';

                if (label !== '') {
                    const shadeId = uuidv4();
                    await connection.query(
                        'INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty, base_pakka_selling_rate, base_pakka_purchase_rate) VALUES (?, ?, ?, ?, 0.00, ?, ?)',
                        [shadeId, itemId, category, label, parseFloat(base_pakka_selling_rate), parseFloat(base_pakka_purchase_rate || 0)]
                    );

                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Item created successfully.', id: itemId });

    } catch (err) {
        await connection.rollback();
        console.error("Transaction Error during Item Gen:", err);
        res.status(500).json({ error: 'Failed to generate item: ' + err.message });
    } finally {
        connection.release();
    }
};

export const updateItem = async (req, res) => {
    const { id } = req.params;
    const { name, hsn_code, base_pakka_selling_rate, base_pakka_purchase_rate } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch old price for audit
        const [oldRows] = await connection.query('SELECT base_pakka_selling_rate FROM items WHERE id = ?', [id]);
        const newPrice = parseFloat(base_pakka_selling_rate || 0);
        const newPurchasePrice = parseFloat(base_pakka_purchase_rate || 0);

        if (oldRows.length > 0 && !isNaN(newPrice)) {
            const oldPrice = parseFloat(oldRows[0].base_pakka_selling_rate || 0);

            if (oldPrice !== newPrice) {
                await connection.query(
                    'INSERT INTO price_change_log (entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?)',
                    ['ITEM_PAKKA_SALE', id, oldPrice, newPrice]
                );
            }
        }

        // 2. Perform Update on Parent Item
        await connection.query(
            'UPDATE items SET name = ?, hsn_code = ?, base_pakka_selling_rate = ?, base_pakka_purchase_rate = ? WHERE id = ?',
            [name, hsn_code, isNaN(newPrice) ? 0 : newPrice, isNaN(newPurchasePrice) ? 0 : newPurchasePrice, id]
        );

        // 3. Propagate to all Shades
        await connection.query(
            'UPDATE item_shades SET base_pakka_selling_rate = ?, base_pakka_purchase_rate = ? WHERE item_id = ?',
            [isNaN(newPrice) ? 0 : newPrice, isNaN(newPurchasePrice) ? 0 : newPurchasePrice, id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Item details updated safely and audited' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to patch item' });
    } finally {
        connection.release();
    }
};

export const addShadeToItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { shade_label, shade_category } = req.body;
        if (!shade_label) return res.status(400).json({ error: 'Shade label required' });

        const shadeId = uuidv4();
        const [itemRows] = await pool.query('SELECT base_pakka_selling_rate, base_pakka_purchase_rate FROM items WHERE id = ?', [id]);
        const baseRate = itemRows.length > 0 ? itemRows[0].base_pakka_selling_rate : 0;
        const purchaseRate = itemRows.length > 0 ? itemRows[0].base_pakka_purchase_rate : 0;

        await pool.query(
            'INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty, base_pakka_selling_rate, base_pakka_purchase_rate) VALUES (?, ?, ?, ?, 0.00, ?, ?)',
            [shadeId, id, shade_category || 'GENERAL', shade_label, baseRate, purchaseRate]
        );

        res.status(201).json({ message: 'Sub-item/shade securely attached.', id: shadeId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to inject shade' });
    }
};

export const fetchAllItemsWithShades = async (req, res) => {
    try {
        const [items] = await pool.query('SELECT * FROM items');
        for (let item of items) {
            const [shades] = await pool.query('SELECT * FROM item_shades WHERE item_id = ? ORDER BY shade_id_label ASC', [item.id]);
            item.shades = shades;
        }
        res.status(200).json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failure fetching unified item logic' });
    }
};
export const addShadesBulk = async (req, res) => {
    const { id } = req.params;
    const { shade_category, shade_labels } = req.body;

    if (!shade_labels || !Array.isArray(shade_labels)) {
        return res.status(400).json({ error: 'Array of shade labels is required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const label of shade_labels) {
            const shadeId = uuidv4();
            const [itemRows] = await connection.query('SELECT base_pakka_selling_rate, base_pakka_purchase_rate FROM items WHERE id = ?', [id]);
            const baseRate = itemRows.length > 0 ? itemRows[0].base_pakka_selling_rate : 0;
            const purchaseRate = itemRows.length > 0 ? itemRows[0].base_pakka_purchase_rate : 0;

            await connection.query(
                'INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty, base_pakka_selling_rate, base_pakka_purchase_rate) VALUES (?, ?, ?, ?, 0.00, ?, ?)',
                [shadeId, id, shade_category || 'GENERAL', label.trim(), baseRate, purchaseRate]
            );
        }

        await connection.commit();
        res.status(201).json({ message: `${shade_labels.length} shades injected successfully.` });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Bulk injection failed' });
    } finally {
        connection.release();
    }
};
export const updateShadePrice = async (req, res) => {
    const { shadeId } = req.params;
    const { base_pakka_selling_rate } = req.body;

    try {
        await pool.query(
            'UPDATE item_shades SET base_pakka_selling_rate = ? WHERE id = ?',
            [base_pakka_selling_rate, shadeId]
        );
        res.status(200).json({ message: 'Shade price updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update shade price' });
    }
};

export const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM items WHERE id = ?', [id]);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

export const deleteShade = async (req, res) => {
    const { shadeId } = req.params;
    try {
        await pool.query('DELETE FROM item_shades WHERE id = ?', [shadeId]);
        res.status(200).json({ message: 'Shade deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete shade' });
    }
};

export const importItemFile = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const originalName = req.file.originalname;
        const itemName = originalName.substring(0, originalName.lastIndexOf('.'));

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let dataStarted = false;
        const parsedShades = [];

        for (let row of data) {
            if (!row || row.length === 0) continue;

            const rowStr = JSON.stringify(row).toLowerCase();
            if (!dataStarted && rowStr.includes('quantity') && rowStr.includes('rate') && rowStr.includes('value')) {
                dataStarted = true;
                continue;
            }

            if (dataStarted) {
                let shadeLabel = null;
                let qty = 0, rate = 0;

                // Tally export format: usually index 0 is string (shade name), index 1 is qty, index 2 is rate.
                // Sometimes it's shifted if there are empty columns. We find the first string, then first two numbers.
                for (let i = 0; i < row.length; i++) {
                    if (typeof row[i] === 'string' && !shadeLabel && row[i].trim() !== '') {
                        shadeLabel = row[i].trim();
                    } else if (typeof row[i] === 'number') {
                        if (qty === 0 && !row.slice(0, i).some(x => typeof x === 'number')) {
                            qty = row[i];
                        } else if (rate === 0) {
                            rate = row[i];
                        }
                    }
                }

                if (shadeLabel && !shadeLabel.toLowerCase().includes('grand total') && !shadeLabel.toLowerCase().includes('closing balance')) {
                    parsedShades.push({ label: shadeLabel, qty, rate });
                }
            }
        }

        if (parsedShades.length === 0) {
            return res.status(400).json({ error: 'No valid shades found. Ensure the file follows the Tally format with Quantity, Rate, Value columns.' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let itemId;
            const [existing] = await connection.query('SELECT id FROM items WHERE name = ?', [itemName]);
            if (existing.length > 0) {
                itemId = existing[0].id;
            } else {
                itemId = uuidv4();
                await connection.query(
                    'INSERT INTO items (id, name, hsn_code, base_pakka_selling_rate, base_pakka_purchase_rate, tax_bracket_percent) VALUES (?, ?, ?, ?, ?, ?)',
                    [itemId, itemName, '0000', 0, 0, 18.00]
                );
            }

            for (const shade of parsedShades) {
                const shadeId = uuidv4();
                await connection.query(
                    'INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty, base_pakka_selling_rate, base_pakka_purchase_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [shadeId, itemId, 'GENERAL', shade.label, shade.qty, shade.rate, 0]
                );
            }

            await connection.commit();
            res.status(200).json({ message: `Successfully imported ${itemName} with ${parsedShades.length} shades.` });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Import File Error:', err);
        res.status(500).json({ error: 'Failed to process file: ' + err.message });
    }
};

export const adjustInventoryStock = async (req, res) => {
    const { shade_id, quantity, type, reason } = req.body;
    const employee_id = req.user.id;

    if (!shade_id || !quantity || !type || !reason) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [shadeRows] = await connection.query('SELECT available_qty FROM item_shades WHERE id = ? FOR UPDATE', [shade_id]);
        if (shadeRows.length === 0) throw new Error('Shade not found');

        const previous_qty = parseFloat(shadeRows[0].available_qty);
        const adjustAmt = parseFloat(quantity);
        const new_qty = type === 'INCREASE' ? previous_qty + adjustAmt : previous_qty - adjustAmt;

        await connection.query('UPDATE item_shades SET available_qty = ? WHERE id = ?', [new_qty, shade_id]);

        await connection.query(
            `INSERT INTO inventory_adjustments 
            (shade_id, employee_id, previous_qty, adjusted_qty, new_qty, adjustment_type, reason) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [shade_id, employee_id, previous_qty, adjustAmt, new_qty, type, reason]
        );

        await connection.commit();
        res.status(200).json({ message: 'Stock adjusted successfully', new_qty });
    } catch (error) {
        await connection.rollback();
        console.error('Adjustment Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

export const fetchAdjustmentLogs = async (req, res) => {
    try {
        const query = `
            SELECT a.*, e.name as employee_name, s.shade_id_label, i.name as item_name
            FROM inventory_adjustments a
            JOIN employees e ON a.employee_id = e.id
            JOIN item_shades s ON a.shade_id = s.id
            JOIN items i ON s.item_id = i.id
            ORDER BY a.created_at DESC
        `;
        const [logs] = await pool.query(query);
        res.status(200).json(logs);
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        res.status(500).json({ error: 'Failed to fetch adjustment logs' });
    }
};

export const deleteAdjustmentLog = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [logRows] = await connection.query('SELECT * FROM inventory_adjustments WHERE id = ? FOR UPDATE', [id]);
        if (logRows.length === 0) throw new Error('Adjustment log not found');
        const log = logRows[0];

        // Revert the shade inventory
        const [shadeRows] = await connection.query('SELECT available_qty FROM item_shades WHERE id = ? FOR UPDATE', [log.shade_id]);
        if (shadeRows.length > 0) {
            const current_qty = parseFloat(shadeRows[0].available_qty);
            const adjustAmt = parseFloat(log.adjusted_qty);
            // If it was INCREASE, we revert by decreasing. If DECREASE, we revert by increasing.
            const new_qty = log.adjustment_type === 'INCREASE' ? current_qty - adjustAmt : current_qty + adjustAmt;
            await connection.query('UPDATE item_shades SET available_qty = ? WHERE id = ?', [new_qty, log.shade_id]);
        }

        // Delete the log
        await connection.query('DELETE FROM inventory_adjustments WHERE id = ?', [id]);

        await connection.commit();
        res.status(200).json({ message: 'Adjustment reverted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete Adjustment Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};
