import express from 'express';
import { getDashboardStats, getLedgerDetails, getEntityStatement, getDashboardFinancials } from '../controllers/dashboardController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Dashboard stats — ADMIN, ACCOUNTANT & GODOWN
router.get('/stats', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getDashboardStats);
router.get('/ledgers', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getLedgerDetails);
router.get('/statement', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getEntityStatement);
router.get('/financials', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getDashboardFinancials);

export default router;

