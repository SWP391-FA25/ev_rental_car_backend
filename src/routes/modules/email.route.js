import { Router } from 'express';
import {
  sendForgetPasswordEmail,
  sendVerifyEmail,
  verifyEmailToken,
  verifyForgetPasswordToken,
} from '../../controllers/verifyEmailToken.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// POST /api/email/send-verification - Send verification email
router.post('/send-verification', authenticate, sendVerifyEmail);

// GET /api/email/verify/:token - Verify email with token
router.get('/verify/:token', verifyEmailToken);

// POST /api/email/forgot-password - Send password reset email
router.post('/forgot-password', sendForgetPasswordEmail);

// GET /api/email/verify-reset/:token - Verify password reset token
router.get('/verify-reset/:token', verifyForgetPasswordToken);

export default router;
