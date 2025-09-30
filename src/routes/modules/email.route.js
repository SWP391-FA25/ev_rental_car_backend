import { Router } from 'express';
import {
  sendVerifyEmail,
  verifyEmailToken,
} from '../../controllers/verifyEmailToken.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// POST /api/email/send-verification - Send verification email
router.post('/send-verification', authenticate, sendVerifyEmail);

// GET /api/email/verify/:token - Verify email with token
router.get('/verify/:token', verifyEmailToken);

export default router;
