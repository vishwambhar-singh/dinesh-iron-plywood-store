import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const register = async (req, res) => {
    const { name, email, password, role, mobile } = req.body;
    try {
        const [existing] = await pool.query('SELECT * FROM employees WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        const permissions = JSON.stringify(['/']); // Basic permissions default

        await pool.query(
            'INSERT INTO employees (id, name, email, mobile, password, role, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, email, mobile || '', hashedPassword, role, permissions]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM employees WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid Credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials' });

        const permissionsArray = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;

        const token = jwt.sign(
            { id: user.id, role: user.role, permissions: permissionsArray },
            process.env.JWT_SECRET || 'plydecore_default_jwt_secret_key',
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: permissionsArray } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    const { userId, name, email, password } = req.body;
    try {
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE employees SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, hashedPassword, userId]);
        } else {
            await pool.query('UPDATE employees SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
        }
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
