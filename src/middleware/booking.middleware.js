import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';

// Get all bookings validation
export const getBookingsValidator = checkSchema({
  status: {
    in: { options: [['query']] },
    optional: true,
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  userId: {
    in: { options: [['query']] },
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  vehicleId: {
    in: { options: [['query']] },
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid vehicle ID',
  },
  stationId: {
    in: { options: [['query']] },
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid station ID',
  },
  startDate: {
    in: { options: [['query']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start date',
  },
  endDate: {
    in: { options: [['query']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid end date',
    custom: {
      options: (endDate, { req }) => {
        if (endDate && req.query.startDate) {
          const startDate = new Date(req.query.startDate);
          const endDateObj = new Date(endDate);
          if (startDate > endDateObj) {
            throw new Error('startDate must be before or equal to endDate');
          }
        }
        return true;
      },
    },
  },
  page: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
    },
    errorMessage: 'Limit must be between 1 and 100',
  },
});

// Get booking by ID validation
export const getBookingByIdValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
});

// Get user's bookings validation
export const getUserBookingsValidator = checkSchema({
  userId: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  status: {
    in: { options: [['query']] },
    optional: true,
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  page: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: { options: [['query']] },
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
    },
    errorMessage: 'Limit must be between 1 and 100',
  },
});

// Update booking validation
export const updateBookingValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  startTime: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start time',
  },
  endTime: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid end time',
    custom: {
      options: (endTime, { req }) => {
        if (endTime && req.body.startTime) {
          const startTime = new Date(req.body.startTime);
          const endTimeDate = new Date(endTime);
          if (endTimeDate <= startTime) {
            throw new Error('End time must be after start time');
          }
        }
        return true;
      },
    },
  },
  pickupLocation: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Pickup location must be 3-200 characters',
  },
  dropoffLocation: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Dropoff location must be 3-200 characters',
  },
  notes: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
});

// Update booking status validation
export const updateBookingStatusValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  status: {
    in: { options: [['body']] },
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  notes: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
});

// Cancel booking validation
export const cancelBookingValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  reason: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 5, max: 500 },
    },
    errorMessage: 'Cancellation reason must be 5-500 characters',
  },
});

// Get booking analytics validation
export const getBookingAnalyticsValidator = checkSchema({
  startDate: {
    in: { options: [['query']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start date',
  },
  endDate: {
    in: { options: [['query']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid end date',
    custom: {
      options: (endDate, { req }) => {
        if (endDate && req.query.startDate) {
          const startDate = new Date(req.query.startDate);
          const endDateObj = new Date(endDate);
          if (startDate > endDateObj) {
            throw new Error('startDate must be before or equal to endDate');
          }
        }
        return true;
      },
    },
  },
});

// Create booking validation
export const createBookingValidator = checkSchema({
  vehicleId: {
    in: { options: [['body']] },
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid vehicle ID is required',
  },
  stationId: {
    in: { options: [['body']] },
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid station ID is required',
  },
  startTime: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage: 'Valid start time is required (ISO8601 format)',
  },
  endTime: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'End time must be valid ISO8601 format',
    custom: {
      options: (endTime, { req }) => {
        if (endTime && req.body.startTime) {
          const startTime = new Date(req.body.startTime);
          const endTimeDate = new Date(endTime);
          if (endTimeDate <= startTime) {
            throw new Error('End time must be after start time');
          }
        }
        return true;
      },
    },
  },
  pickupLocation: {
    in: { options: [['body']] },
    notEmpty: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Pickup location is required and must be 3-200 characters',
  },
  dropoffLocation: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Dropoff location must be 3-200 characters',
  },
  actualStartTime: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Actual start time must be valid ISO8601 format',
    custom: {
      options: (actualStartTime, { req }) => {
        if (actualStartTime && req.body.startTime) {
          const plannedStart = new Date(req.body.startTime);
          const actualStart = new Date(actualStartTime);
          // Allow some flexibility - actual start can be before planned start
          const maxEarlyStart = new Date(
            plannedStart.getTime() - 30 * 60 * 1000
          ); // 30 minutes early
          if (actualStart < maxEarlyStart) {
            throw new Error(
              'Actual start time cannot be more than 30 minutes before planned start time'
            );
          }
        }
        return true;
      },
    },
  },
  actualEndTime: {
    in: { options: [['body']] },
    optional: true,
    isISO8601: true,
    errorMessage: 'Actual end time must be valid ISO8601 format',
    custom: {
      options: (actualEndTime, { req }) => {
        if (actualEndTime) {
          // Check against actual start time if provided
          if (req.body.actualStartTime) {
            const actualStart = new Date(req.body.actualStartTime);
            const actualEnd = new Date(actualEndTime);
            if (actualEnd <= actualStart) {
              throw new Error(
                'Actual end time must be after actual start time'
              );
            }
          }
          // Check against planned start time if no actual start time
          else if (req.body.startTime) {
            const plannedStart = new Date(req.body.startTime);
            const actualEnd = new Date(actualEndTime);
            if (actualEnd <= plannedStart) {
              throw new Error(
                'Actual end time must be after planned start time'
              );
            }
          }
        }
        return true;
      },
    },
  },
  actualPickupLocation: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Actual pickup location must be 3-200 characters',
  },
  actualReturnLocation: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Actual return location must be 3-200 characters',
  },
  pickupOdometer: {
    in: { options: [['body']] },
    optional: true,
    isFloat: {
      options: { min: 0 },
    },
    errorMessage: 'Pickup odometer must be a non-negative number',
  },
  returnOdometer: {
    in: { options: [['body']] },
    optional: true,
    isFloat: {
      options: { min: 0 },
    },
    errorMessage: 'Return odometer must be a non-negative number',
    custom: {
      options: (returnOdometer, { req }) => {
        if (
          returnOdometer !== undefined &&
          req.body.pickupOdometer !== undefined
        ) {
          const pickup = parseFloat(req.body.pickupOdometer);
          const returnVal = parseFloat(returnOdometer);
          if (returnVal < pickup) {
            throw new Error(
              'Return odometer cannot be less than pickup odometer'
            );
          }
          // Reasonable distance check (max 1000 km per rental)
          if (returnVal - pickup > 1000) {
            throw new Error(
              'Odometer reading difference seems unrealistic (max 1000 km per rental)'
            );
          }
        }
        return true;
      },
    },
  },
  notes: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
  promotions: {
    in: { options: [['body']] },
    optional: true,
    isArray: true,
    errorMessage: 'Promotions must be an array',
    custom: {
      options: (promotions) => {
        if (promotions && promotions.length > 0) {
          for (const promotion of promotions) {
            if (
              typeof promotion !== 'string' ||
              promotion.trim().length === 0
            ) {
              throw new Error(
                'Each promotion must be a non-empty string (ID or code)'
              );
            }
          }
        }
        return true;
      },
    },
  },
});

// Complete booking validation
export const completeBookingValidator = checkSchema({
  id: {
    in: { options: [['params']] },
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  actualEndTime: {
    in: { options: [['body']] },
    notEmpty: true,
    isISO8601: true,
    errorMessage:
      'Actual end time is required and must be valid ISO8601 format',
  },
  actualReturnLocation: {
    in: { options: [['body']] },
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Actual return location must be 3-200 characters',
  },
  returnOdometer: {
    in: { options: [['body']] },
    isFloat: {
      options: { min: 0 },
    },
    errorMessage: 'Return odometer must be a non-negative number',
  },
  notes: {
    in: { options: [['body']] },
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
  damageReport: {
    in: { options: [['body']] },
    optional: true,
    trim: true,
    isLength: {
      options: { max: 1000 },
    },
    errorMessage: 'Damage report must not exceed 1000 characters',
  },
  fuelLevel: {
    in: { options: [['body']] },
    isFloat: {
      options: { min: 0, max: 100 },
    },
    errorMessage: 'Fuel level must be between 0 and 100',
  },
});

// Middleware array exports for easy use
export const getBookingsValidation = validate([getBookingsValidator]);
export const getBookingByIdValidation = validate([getBookingByIdValidator]);
export const getUserBookingsValidation = validate([getUserBookingsValidator]);
export const updateBookingValidation = validate([updateBookingValidator]);
export const updateBookingStatusValidation = validate([
  updateBookingStatusValidator,
]);
export const cancelBookingValidation = validate([cancelBookingValidator]);
export const getBookingAnalyticsValidation = validate([
  getBookingAnalyticsValidator,
]);
export const createBookingValidation = validate([createBookingValidator]);
export const completeBookingValidation = validate([completeBookingValidator]);
