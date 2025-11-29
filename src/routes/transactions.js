import express from 'express';
import {
  getTransactionsHandler,
  getTransactionHandler,
  depositHandler,
  withdrawHandler,
  transferHandler,
  acceptPendingTransferHandler
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticate, getTransactionsHandler);
router.get('/:id', authenticate, getTransactionHandler);
router.post('/deposit', authenticate, validate(schemas.deposit), depositHandler);
router.post('/withdraw', authenticate, validate(schemas.withdraw), withdrawHandler);
router.post('/transfer', authenticate, validate(schemas.transfer), transferHandler);
router.post('/accept-pending', authenticate, acceptPendingTransferHandler);

export default router;

