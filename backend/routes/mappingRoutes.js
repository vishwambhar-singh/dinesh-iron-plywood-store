import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { mapSupplierToItem, fetchSupplierMappings, updateSupplierMapping, deleteSupplierMapping, mapCustomerToItem, fetchCustomerMappings, updateCustomerMapping, deleteCustomerMapping, bulkMapSuppliersToItem, bulkMapCustomersToItem } from '../controllers/mappingController.js';
import { fetchPriceHistory } from '../controllers/auditController.js';

const router = express.Router();
router.use(verifyToken);

// Supplier Mappings — ADMIN, ACCOUNTANT & GODOWN
router.post('/supplier', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), mapSupplierToItem);
router.get('/supplier', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchSupplierMappings);
router.put('/supplier/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updateSupplierMapping);
router.post('/supplier/bulk', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), bulkMapSuppliersToItem);
router.delete('/supplier/:id', authorizeRoles('ADMIN', 'GODOWN'), deleteSupplierMapping);

// Customer Mappings — ADMIN, ACCOUNTANT & GODOWN
router.post('/customer', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), mapCustomerToItem);
router.get('/customer', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchCustomerMappings);
router.put('/customer/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updateCustomerMapping);
router.post('/customer/bulk', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), bulkMapCustomersToItem);
router.delete('/customer/:id', authorizeRoles('ADMIN', 'GODOWN'), deleteCustomerMapping);

// Audit log — all can view
router.get('/audit', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPriceHistory);

export default router;
