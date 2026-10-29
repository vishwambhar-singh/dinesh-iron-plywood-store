import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function syncUsersFromConfig() {
    const usersFilePath = path.join(__dirname, 'users.json');

    if (!fs.existsSync(usersFilePath)) {
        console.log('[UserSync] users.json not found, skipping user sync.');
        return;
    }

    try {
        const rawData = fs.readFileSync(usersFilePath, 'utf8');
        const users = JSON.parse(rawData);

        if (!Array.isArray(users)) {
            console.error('[UserSync] Invalid format in users.json. Must be an array.');
            return;
        }

        console.log(`[UserSync] Syncing ${users.length} user(s) from users.json...`);

        for (const userConfig of users) {
            const { name, email, password, role, mobile } = userConfig;

            if (!email || !password) {
                console.warn('[UserSync] Skipping user entry missing email or password:', userConfig);
                continue;
            }

            const cleanEmail = email.trim().toLowerCase();
            const userRole = (role || 'ADMIN').toUpperCase();
            const userMobile = mobile || '';
            const userName = name || 'System User';

            const defaultPermissions = userRole === 'ADMIN'
                ? ['/', '/suppliers', '/inventory', '/sales', '/billing', '/employees', '/settings', '/customers']
                : ['/'];

            const permissionsJson = JSON.stringify(defaultPermissions);
            const hashedPassword = await bcrypt.hash(password, 10);

            const [existing] = await pool.query('SELECT id FROM employees WHERE LOWER(email) = ?', [cleanEmail]);

            if (existing.length === 0) {
                const id = uuidv4();
                await pool.query(
                    'INSERT INTO employees (id, name, email, mobile, password, role, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [id, userName, cleanEmail, userMobile, hashedPassword, userRole, permissionsJson]
                );
                console.log(`[UserSync] ✅ Created user: ${cleanEmail} (${userRole})`);
            } else {
                const userId = existing[0].id;
                await pool.query(
                    'UPDATE employees SET name = ?, mobile = ?, password = ?, role = ?, permissions = ? WHERE id = ?',
                    [userName, userMobile, hashedPassword, userRole, permissionsJson, userId]
                );
                console.log(`[UserSync] 🔄 Updated user credentials: ${cleanEmail} (${userRole})`);
            }
        }

        console.log('[UserSync] User synchronization completed successfully.');
    } catch (error) {
        console.error('[UserSync] Error syncing users from users.json:', error);
    }
}
