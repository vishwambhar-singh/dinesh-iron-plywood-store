import express from 'express';
import { getStaffMembers, createStaffMember, updateStaffMember, getStaffLedger, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaffMembers);
router.post('/', createStaffMember);
router.put('/:id', updateStaffMember);
router.get('/:id/ledger', getStaffLedger);
router.post('/:id/ledger', addLedgerEntry);
router.put('/:id/ledger/:entryId', updateLedgerEntry);
router.delete('/:id/ledger/:entryId', deleteLedgerEntry);

export default router;
