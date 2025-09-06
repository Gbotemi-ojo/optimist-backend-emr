import { Router } from 'express';
import { financialController } from '../controllers/financial.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes now only check for an authenticated token.
// The controller will handle role-based authorization dynamically.

router.get('/', authenticateToken, financialController.getAllRecords);

router.post('/', authenticateToken, financialController.createRecord);

router.put('/:id', authenticateToken, financialController.updateRecord);

router.delete('/:id', authenticateToken, financialController.deleteRecord);

export default router;