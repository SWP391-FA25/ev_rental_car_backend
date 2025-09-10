import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createBooking,
  completeBooking,
} from '../../controllers/booking.controller.js';

const router = Router();

router.post('/', authenticate, createBooking);
router.post('/:bookingId/complete', authenticate, completeBooking);

export default router;
