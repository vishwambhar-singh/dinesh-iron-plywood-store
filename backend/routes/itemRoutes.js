import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { createItem, fetchAllItemsWithShades, updateItem, addShadeToItem, addShadesBulk, updateShadePrice, deleteItem, deleteShade, importItemFile, adjustInventoryStock, fetchAdjustmentLogs, deleteAdjustmentLog } from '../controllers/itemController.js';

const router = express.Router();
router.use(verifyToken);

// Item read access — ADMIN, ACCOUNTANT & GODOWN
router.get('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchAllItemsWithShades);

// Inventory Adjustments (Formal only)
router.post('/adjustments', authorizeRoles('ADMIN', 'ACCOUNTANT'), adjustInventoryStock);
router.get('/adjustments/logs', authorizeRoles('ADMIN', 'ACCOUNTANT'), fetchAdjustmentLogs);
router.delete('/adjustments/logs/:id', authorizeRoles('ADMIN', 'ACCOUNTANT'), deleteAdjustmentLog);

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

// Item write/delete — ADMIN & GODOWN
router.post('/import', authorizeRoles('ADMIN', 'GODOWN'), upload.single('file'), importItemFile);
router.post('/generate', authorizeRoles('ADMIN', 'GODOWN'), createItem);
router.put('/:id', authorizeRoles('ADMIN', 'GODOWN'), updateItem);
router.delete('/:id', authorizeRoles('ADMIN'), deleteItem);
router.post('/:id/shades', authorizeRoles('ADMIN', 'GODOWN'), addShadeToItem);
router.post('/:id/shades/bulk', authorizeRoles('ADMIN', 'GODOWN'), addShadesBulk);
router.put('/shades/:shadeId', authorizeRoles('ADMIN', 'GODOWN'), updateShadePrice);
router.delete('/shades/:shadeId', authorizeRoles('ADMIN'), deleteShade);

export default router;
