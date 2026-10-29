import pool from '../config/db.js';

export const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT `key`, `value`, `group` FROM settings');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSettings = async (req, res) => {
    // Array of { key: '...', value: '...' }
    const { settings_array } = req.body;
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        for (let item of settings_array) {
            await connection.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [String(item.value), item.key]);
        }
        await connection.commit();
        connection.release();
        res.json({ message: 'Global parameters updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRoles = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT role, permissions FROM role_permissions');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const upsertRole = async (req, res) => {
    let { role, permissions } = req.body;
    try {
        if (!role || !permissions) return res.status(400).json({ error: 'Missing structure' });
        role = role.toUpperCase().trim();
        
        await pool.query(
            'INSERT INTO role_permissions (role, permissions) VALUES (?, ?) ON DUPLICATE KEY UPDATE permissions = ?', 
            [role, JSON.stringify(permissions), JSON.stringify(permissions)]
        );
        res.json({ message: `Role ${role} synced to matrix.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteRole = async (req, res) => {
    const { role } = req.params;
    try {
        if (role === 'ADMIN') return res.status(400).json({ error: 'Core ADMIN node cannot be destroyed.' });
        await pool.query('DELETE FROM role_permissions WHERE role = ?', [role]);
        res.json({ message: `Role ${role} purged from matrix.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
