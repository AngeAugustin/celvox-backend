import express from 'express';
import { getMe, updateMe, changePassword } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(schemas.updateUser), updateMe);
router.post('/me/change-password', authenticate, validate(schemas.changePassword), changePassword);

export default router;

