import { Router } from 'express';
import {
  cancelBooking,
  checkInBooking,
  completeBooking,
  createBooking,
  getBookingAnalytics,
  getBookingById,
  getBookings,
  getUserBookings,
  updateBooking,
  updateBookingStatus,
} from '../../controllers/booking.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  cancelBookingValidation,
  checkInBookingValidation,
  completeBookingValidation,
  createBookingValidation,
  getBookingAnalyticsValidation,
  getBookingByIdValidation,
  getBookingsValidation,
  getUserBookingsValidation,
  updateBookingStatusValidation,
  updateBookingValidation,
} from '../../middleware/booking.middleware.js';

const router = Router();

// Get all bookings (Admin/Staff only)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingsValidation,
  getBookings
);

// Get booking analytics (Admin/Staff only)
router.get(
  '/analytics',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingAnalyticsValidation,
  getBookingAnalytics
);

// Get user's bookings
router.get(
  '/user/:userId',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getUserBookingsValidation,
  getUserBookings
);

// Get booking by ID
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getBookingByIdValidation,
  getBookingById
);

// Create new booking
router.post(
  '/',
  authenticate,
  authorize('RENTER'),
  createBookingValidation,
  createBooking
);

// Update booking
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  updateBookingValidation,
  updateBooking
);

// Update booking status (Admin/Staff only)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  updateBookingStatusValidation,
  updateBookingStatus
);

// Cancel booking
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  cancelBookingValidation,
  cancelBooking
);

// Check-in booking (start rental)
router.post(
  '/:id/checkin',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  checkInBookingValidation,
  checkInBooking
);

// Complete booking
router.post(
  '/:id/complete',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  completeBookingValidation,
  completeBooking
);

export default router;
