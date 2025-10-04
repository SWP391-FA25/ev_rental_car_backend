import { Router } from 'express';
import {
  login,
  logout,
  me,
  register,
  resetPassword,
} from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticate, me);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/reset-password', resetPassword);

export default router;
