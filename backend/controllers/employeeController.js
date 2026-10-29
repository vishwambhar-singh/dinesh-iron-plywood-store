import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const getAllEmployees = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, permissions, created_at FROM employees');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

const getEmployeeById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, permissions, created_at FROM employees WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, permissions, password } = req.body;

    try {
        const [existing] = await pool.query('SELECT permissions FROM employees WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Employee not found' });
        
        const permJson = permissions !== undefined 
            ? (Array.isArray(permissions) ? JSON.stringify(permissions) : permissions) 
            : existing[0].permissions;
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE employees SET name = ?, email = ?, role = ?, permissions = ?, password = ? WHERE id = ?',
                [name, email, role, permJson, hashedPassword, id]
            );
        } else {
            await pool.query(
                'UPDATE employees SET name = ?, email = ?, role = ?, permissions = ? WHERE id = ?',
                [name, email, role, permJson, id]
            );
        }
        res.status(200).json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM employees WHERE id = ?', [id]);
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};

export default { getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee };
