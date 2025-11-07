import { Router } from 'express';
import {
  cancelBooking,
  checkInBooking,
  completeBooking,
  createBooking,
  getBookingAnalytics,
  getBookingById,
  getBookings,
  getDepositStatus,
  getMyManagedBookings,
  getUserBookings,
  updateBooking,
  updateBookingStatus,
} from '../../controllers/booking.controller.js';
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
  authorize('ADMIN', 'STAFF'),
  getBookingsValidation,
  getBookings
);

// Get booking analytics (Admin/Staff only)
router.get(
  '/analytics',
  authorize('ADMIN', 'STAFF'),
  getBookingAnalyticsValidation,
  getBookingAnalytics
);

// Get my managed bookings (Staff/Admin only)
router.get(
  '/my-managed',
  authorize('ADMIN', 'STAFF'),
  getBookingsValidation, // Reuse the same validation as getBookings
  getMyManagedBookings
);

// Get user's bookings (Admin/Staff only)
router.get(
  '/user/:userId',
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getUserBookingsValidation,
  getUserBookings
);

// Get booking by ID (Admin/Staff only)
router.get(
  '/:id',
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getBookingByIdValidation,
  getBookingById
);

// Create new booking (Renter, Staff, Admin can create)
router.post(
  '/',
  authorize('RENTER', 'STAFF', 'ADMIN'),
  createBookingValidation,
  createBooking
);

// Update booking (Admin/Staff only)
router.put(
  '/:id',
  authorize('ADMIN', 'STAFF'),
  updateBookingValidation,
  updateBooking
);

// Update booking status (Admin/Staff only)
router.patch(
  '/:id/status',
  authorize('ADMIN', 'STAFF'),
  updateBookingStatusValidation,
  updateBookingStatus
);

// Cancel booking (Admin/Staff only)
router.patch(
  '/:id/cancel',
  authorize('ADMIN', 'STAFF', 'RENTER'),
  cancelBookingValidation,
  cancelBooking
);

// Check-in booking (start rental) (Admin/Staff only)
router.post(
  '/:id/checkin',
  authorize('ADMIN', 'STAFF'),
  checkInBookingValidation,
  checkInBooking
);

// Complete booking (Admin/Staff only)
router.post(
  '/:id/complete',
  authorize('ADMIN', 'STAFF'),
  completeBookingValidation,
  completeBooking
);

// Get deposit status and confirm booking (Admin/Staff only)
router.get(
  '/:id/deposit-status',
  authorize('ADMIN', 'STAFF'),
  getBookingByIdValidation, // Reuse the same validation as getBookingById
  getDepositStatus
);

export default router;
