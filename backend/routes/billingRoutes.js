import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { submitSale, fetchSales, fetchSalesByCustomer, fetchPakkaSales, fetchActualSales, createPurchaseOrder, fetchPurchaseOrders, fetchPurchaseOrdersBySupplier, fetchPakkaPurchases, fetchActualPurchases, submitSalesReturn, submitPurchaseReturn, fetchSaleItems, fetchPurchaseItems, fetchCustomerDetailedLedger, fetchSupplierDetailedLedger, deleteSale, deletePurchase, updateSaleInvoiceNumber, updatePurchaseBillNumber, updateSaleDate, updatePurchaseDate, updateSaleFull, updatePurchaseFull, fetchPendingChanges, approveBillChange, rejectBillChange, fetchDualDetailedLedger, linkDualEntities, unlinkDualEntities, fetchSuggestedDualMatches, fetchApprovedDualEntities } from '../controllers/billingController.js';

const router = express.Router();

router.use(verifyToken);

// ═══════════════════════════════════════════════════════════
// PAKKA (Formal) ENDPOINTS — ADMIN & ACCOUNTANT ONLY
// ═══════════════════════════════════════════════════════════
router.post('/sale', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), submitSale);
router.get('/sales/pakka', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPakkaSales);
router.delete('/sale/:id', authorizeRoles('ADMIN', 'GODOWN'), deleteSale);

router.post('/purchase', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), createPurchaseOrder);
router.get('/purchases/pakka', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPakkaPurchases);
router.delete('/purchase/:id', authorizeRoles('ADMIN', 'GODOWN'), deletePurchase);

// ═══════════════════════════════════════════════════════════
// ACTUAL (Godown) ENDPOINTS — GODOWN & ADMIN
// ═══════════════════════════════════════════════════════════
router.get('/sales/actual', authorizeRoles('ADMIN', 'GODOWN', 'ACCOUNTANT'), fetchActualSales);
router.get('/purchases/actual', authorizeRoles('ADMIN', 'GODOWN', 'ACCOUNTANT'), fetchActualPurchases);

// ═══════════════════════════════════════════════════════════
// CREDIT/DEBIT NOTE ENDPOINTS
// ═══════════════════════════════════════════════════════════
router.post('/credit-note/sale', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), submitSalesReturn);
router.post('/debit-note/purchase', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), submitPurchaseReturn);

// ═══════════════════════════════════════════════════════════
// SHARED READ-ONLY — ADMIN, ACCOUNTANT & GODOWN
// ═══════════════════════════════════════════════════════════
router.get('/sales', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchSales); 
router.get('/sales/customer/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchSalesByCustomer);
router.get('/purchases', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPurchaseOrders); 
router.get('/purchases/supplier/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPurchaseOrdersBySupplier);

router.get('/sale/:id/items', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchSaleItems);
router.get('/purchase/:id/items', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchPurchaseItems);

router.put('/sale/:id/invoice-number', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updateSaleInvoiceNumber);
router.put('/purchase/:id/bill-number', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updatePurchaseBillNumber);
router.put('/sale/:id/date', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updateSaleDate);
router.put('/purchase/:id/date', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updatePurchaseDate);

router.put('/sale/:id/full', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updateSaleFull);
router.put('/purchase/:id/full', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), updatePurchaseFull);
router.get('/ledger/customer/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchCustomerDetailedLedger);
router.get('/ledger/supplier/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchSupplierDetailedLedger);
router.get('/ledger/dual/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'GODOWN'), fetchDualDetailedLedger);
router.get('/dual/suggestions', authorizeRoles('ADMIN', 'ACCOUNTANT'), fetchSuggestedDualMatches);
router.get('/dual/linked', authorizeRoles('ADMIN', 'ACCOUNTANT'), fetchApprovedDualEntities);
router.post('/dual/link', authorizeRoles('ADMIN', 'ACCOUNTANT'), linkDualEntities);
router.delete('/dual/unlink/:id', authorizeRoles('ADMIN', 'ACCOUNTANT'), unlinkDualEntities);

// ═══════════════════════════════════════════════════════════
// CHANGE REQUEST WORKFLOW — Formal→Actual Bill Approval
// ═══════════════════════════════════════════════════════════
router.get('/changes/pending', authorizeRoles('ADMIN', 'GODOWN'), fetchPendingChanges);
router.post('/changes/:id/accept', authorizeRoles('ADMIN', 'GODOWN'), approveBillChange);
router.post('/changes/:id/reject', authorizeRoles('ADMIN', 'GODOWN'), rejectBillChange);

export default router;
