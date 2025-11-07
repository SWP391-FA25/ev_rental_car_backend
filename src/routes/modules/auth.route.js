import { Router } from 'express';
import {
  changePassword,
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
router.put('/change-password', authenticate, changePassword);

export default router;
