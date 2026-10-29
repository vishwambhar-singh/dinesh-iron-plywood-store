import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import customerController from '../controllers/customerController.js';

const router = express.Router();

router.use(verifyToken);

// Customer CRUD — ADMIN & ACCOUNTANT for read/write, DELETE ADMIN only
router.post('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), customerController.createCustomer);
router.get('/', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN', 'STAFF'), customerController.getAllCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN', 'STAFF'), customerController.getCustomerById);
router.put('/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), customerController.updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN', 'GODOWN'), customerController.deleteCustomer);

export default router;
