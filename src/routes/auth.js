import express from 'express';
import { registerHandler, loginHandler, refreshHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler } from '../controllers/authController.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', validate(schemas.register), registerHandler);
router.post('/login', validate(schemas.login), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPasswordHandler);
router.post('/reset-password', validate(schemas.resetPassword), resetPasswordHandler);

export default router;

