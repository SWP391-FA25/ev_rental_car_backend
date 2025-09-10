import { Router } from 'express';
import healthRouter from './modules/health.route.js';
import authRouter from './modules/auth.route.js';
import bookingRouter from './modules/booking.route.js';
import paymentRouter from './modules/payment.route.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/bookings', bookingRouter);
router.use('/payments', paymentRouter);

export default router;
