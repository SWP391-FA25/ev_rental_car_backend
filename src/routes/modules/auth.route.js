import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
} from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.get('/me', authenticate, me);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);

export default router;
