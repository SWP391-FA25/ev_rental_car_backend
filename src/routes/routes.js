import { Router } from 'express';
import authRouter from './modules/auth.route.js';
import bookingRouter from './modules/booking.route.js';
import paymentRouter from './modules/payment.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/bookings', bookingRouter);
router.use('/payments', paymentRouter);

export default router;
