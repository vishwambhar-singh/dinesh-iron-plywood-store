import express from 'express';
import { getTransactions, getSummary, addTransaction, getRelatedOrders, getOrderHistory, deleteTransaction, getPartySummaries, updateTransaction, bulkDeleteTransactions } from '../controllers/cashbookController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Cashbook — ADMIN, ACCOUNTANT & GODOWN
router.get('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getTransactions);
router.get('/summary', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getSummary);
router.get('/related-orders', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getRelatedOrders);
router.get('/order-history/:orderId', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getOrderHistory);
router.get('/party-summaries', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), getPartySummaries);
router.post('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), addTransaction);
router.put('/:id', authorizeRoles('ADMIN', 'GODOWN'), updateTransaction);
router.delete('/:id', authorizeRoles('ADMIN', 'GODOWN'), deleteTransaction);
router.post('/bulk-delete', authorizeRoles('ADMIN', 'GODOWN'), bulkDeleteTransactions);

export default router;