import express from 'express';
import { getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } from '../controllers/bankAccountController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getBankAccounts);
router.post('/', addBankAccount);
router.put('/:id', updateBankAccount);
router.delete('/:id', deleteBankAccount);

export default router;
