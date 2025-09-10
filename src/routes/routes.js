import { Router } from 'express';
import healthRouter from './modules/health.route.js';
import authRouter from './modules/auth.route.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;
