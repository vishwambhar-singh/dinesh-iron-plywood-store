import express from 'express';
import { getSettings, updateSettings, getRoles, upsertRole, deleteRole } from '../controllers/settingsController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Settings variables — read for ADMIN, ACCOUNTANT & GODOWN, write ADMIN only
router.get('/variables', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getSettings);
router.post('/variables', authorizeRoles('ADMIN'), updateSettings);

// Role management — ADMIN only
router.get('/roles', authorizeRoles('ADMIN'), getRoles);
router.post('/roles', authorizeRoles('ADMIN'), upsertRole);
router.delete('/roles/:role', authorizeRoles('ADMIN'), deleteRole);

export default router;
