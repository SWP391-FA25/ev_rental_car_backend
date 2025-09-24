import renterRouter from './modules/renter.route.js';
import { Router } from 'express';
import authRouter from './modules/auth.route.js';
import bookingRouter from './modules/booking.route.js';
import paymentRouter from './modules/payment.route.js';
import documentRouter from './modules/document.route.js';
import testRouter from './modules/test.route.js';
import staffRouter from './modules/staff.route.js';
import stationRouter from './modules/station.route.js';
import assignRouter from './modules/assign.route.js';
import vehicleRouter from './modules/vehicle.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/bookings', bookingRouter);
router.use('/payments', paymentRouter);
router.use('/documents', documentRouter);
router.use('/test', testRouter);
router.use('/staff', staffRouter);
router.use('/station', stationRouter);
router.use('/assignments', assignRouter);
router.use('/renters', renterRouter);
router.use('/vehicles', vehicleRouter);

export default router;
