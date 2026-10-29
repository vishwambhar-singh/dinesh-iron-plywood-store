import pool from '../config/db.js';

export const fetchPriceHistory = async (req, res) => {
    try {
        const { entity_id } = req.query;
        let query = 'SELECT * FROM price_change_log';
        let params = [];
        
        if (entity_id) {
            query += ' WHERE entity_id = ?';
            params.push(entity_id);
        }
        
        query += ' ORDER BY changed_at DESC';
        
        const [rows] = await pool.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Audit fetch failed' });
    }
};
