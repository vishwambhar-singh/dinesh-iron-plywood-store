import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import supplierController from '../controllers/supplierController.js';

const router = express.Router();

router.use(verifyToken);

// Supplier CRUD — ADMIN & ACCOUNTANT for read/write, DELETE ADMIN only
router.post('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), supplierController.createSupplier);
router.get('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN', 'STAFF'), supplierController.getAllSuppliers);
router.get('/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN', 'STAFF'), supplierController.getSupplierById);
router.put('/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), supplierController.updateSupplier);
router.delete('/:id', authorizeRoles('ADMIN'), supplierController.deleteSupplier);

export default router;
