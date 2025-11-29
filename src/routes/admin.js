import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  getAllAccounts,
  getAccountById,
  updateAccount,
  createAccountForUser,
  getAllTransactions,
  getAllCards,
  sendNotification,
  getAuditLogs,
  createTransfer
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', validate(schemas.adminUpdateUser), updateUser);
router.post('/users/:id/reset-password', validate(schemas.resetPassword), resetUserPassword);

// Accounts
router.get('/accounts', getAllAccounts);
router.get('/accounts/:id', getAccountById);
router.patch('/accounts/:id', validate(schemas.adminUpdateAccount), updateAccount);
router.post('/accounts', validate(schemas.adminCreateAccount), createAccountForUser);

// Notifications
router.post('/notifications', validate(schemas.sendNotification), sendNotification);

// Transactions
router.get('/transactions', getAllTransactions);
router.post('/transactions/transfer', validate(schemas.createTransferAdmin), createTransfer);

// Cards
router.get('/cards', getAllCards);

// Notifications
router.post('/notifications', sendNotification);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;

