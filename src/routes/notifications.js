import express from 'express';
import {
  getNotifications,
  markAsReadHandler
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.post('/mark-read', authenticate, markAsReadHandler);

export default router;

