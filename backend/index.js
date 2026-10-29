import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import mappingRoutes from './routes/mappingRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import cashbookRoutes from './routes/cashbookRoutes.js';
import bankAccountRoutes from './routes/bankAccountRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main Route Configurations
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes); // Keep this for system users
app.use('/api/staff', staffRoutes); // New staff route
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);


app.get('/', (req, res) => {
    res.send({ status: 'Advanced Inventory API is running.' });
});

import { runMigrations } from './migrations/migrate.js';
import { syncUsersFromConfig } from './config/userSync.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    try {
        await runMigrations();
        await syncUsersFromConfig();
    } catch (err) {
        console.error('Failed on startup initialization:', err);
    }
});
// Server initialized

