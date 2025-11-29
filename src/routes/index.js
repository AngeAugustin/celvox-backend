import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import accountRoutes from './accounts.js';
import transactionRoutes from './transactions.js';
import cardRoutes from './cards.js';
import notificationRoutes from './notifications.js';
import adminRoutes from './admin.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/cards', cardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

