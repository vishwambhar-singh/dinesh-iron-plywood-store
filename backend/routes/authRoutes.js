import express from 'express';
import { register, login, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/profile', verifyToken, updateProfile);

router.post('/verify-password', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        const [users] = await pool.query('SELECT password FROM employees WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(401).json({ message: 'User not found' });
        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
        res.json({ message: 'Password verified' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
