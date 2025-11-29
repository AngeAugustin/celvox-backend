import express from 'express';
import {
  getAccounts,
  getAccount,
  createAccountHandler,
  deleteAccountHandler
} from '../controllers/accountController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getAccounts);
router.get('/:id', authenticate, getAccount);
router.post('/', authenticate, createAccountHandler);
router.delete('/:id', authenticate, deleteAccountHandler);

export default router;

