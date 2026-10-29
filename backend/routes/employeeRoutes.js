import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import employeeController from '../controllers/employeeController.js';

const router = express.Router();

router.use(verifyToken);

// Employee management — ADMIN and GODOWN
router.get('/', authorizeRoles('ADMIN', 'GODOWN'), employeeController.getAllEmployees);
router.get('/:id', authorizeRoles('ADMIN', 'GODOWN'), employeeController.getEmployeeById);
router.put('/:id', authorizeRoles('ADMIN', 'GODOWN'), employeeController.updateEmployee);
router.delete('/:id', authorizeRoles('ADMIN', 'GODOWN'), employeeController.deleteEmployee);

export default router;
