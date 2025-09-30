import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';

// Get all bookings validation
export const getBookingsValidator = checkSchema({
  status: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  userId: {
    in: ['query'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  vehicleId: {
    in: ['query'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid vehicle ID',
  },
  stationId: {
    in: ['query'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid station ID',
  },
  startDate: {
    in: ['query'],
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start date',
  },
  endDate: {
    in: ['query'],
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
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: ['query'],
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
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
});

// Get user's bookings validation
export const getUserBookingsValidator = checkSchema({
  userId: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid user ID',
  },
  status: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    errorMessage: 'Page must be a positive integer',
  },
  limit: {
    in: ['query'],
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
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  startTime: {
    in: ['body'],
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start time',
  },
  endTime: {
    in: ['body'],
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
    in: ['body'],
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Pickup location must be 3-200 characters',
  },
  dropoffLocation: {
    in: ['body'],
    optional: true,
    trim: true,
    isLength: {
      options: { min: 3, max: 200 },
    },
    errorMessage: 'Dropoff location must be 3-200 characters',
  },
  notes: {
    in: ['body'],
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
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  status: {
    in: ['body'],
    isIn: {
      options: [
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      ],
    },
    errorMessage: 'Invalid status value',
  },
  notes: {
    in: ['body'],
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
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  reason: {
    in: ['body'],
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
    in: ['query'],
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start date',
  },
  endDate: {
    in: ['query'],
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
    in: ['body'],
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid vehicle ID is required',
  },
  stationId: {
    in: ['body'],
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid station ID is required',
  },
  startTime: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    isISO8601: { options: { strict: true } },
    errorMessage: 'Valid start time is required (ISO8601 format)',
  },
  endTime: {
    in: ['body'],
    optional: true,
    isString: true,
    isISO8601: { options: { strict: true } },
    errorMessage: 'End time must be valid ISO8601 format',
    custom: {
      options: (endTime, { req }) => {
        if (endTime && req.body.startTime) {
          const startTime = new Date(req.body.startTime);
          const endTimeDate = new Date(endTime);
          if (isNaN(startTime) || isNaN(endTimeDate)) {
            throw new Error('Invalid date format for startTime or endTime');
          }
          if (endTimeDate <= startTime) {
            throw new Error('End time must be after start time');
          }
        }
        return true;
      },
    },
  },
  pickupLocation: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 3, max: 200 } },
    errorMessage: 'Pickup location is required and must be 3-200 characters',
  },
  dropoffLocation: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 3, max: 200 } },
    errorMessage: 'Dropoff location must be 3-200 characters',
  },
  actualStartTime: {
    in: ['body'],
    optional: true,
    isString: true,
    isISO8601: { options: { strict: true } },
    errorMessage: 'Actual start time must be valid ISO8601 format',
    custom: {
      options: (actualStartTime, { req }) => {
        if (actualStartTime && req.body.startTime) {
          const plannedStart = new Date(req.body.startTime);
          const actualStart = new Date(actualStartTime);
          if (isNaN(plannedStart) || isNaN(actualStart)) {
            throw new Error(
              'Invalid date format for startTime or actualStartTime'
            );
          }
          const maxEarlyStart = new Date(
            plannedStart.getTime() - 30 * 60 * 1000
          );
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
    in: ['body'],
    optional: true,
    isString: true,
    isISO8601: { options: { strict: true } },
    errorMessage: 'Actual end time must be valid ISO8601 format',
    custom: {
      options: (actualEndTime, { req }) => {
        if (actualEndTime) {
          if (req.body.actualStartTime) {
            const actualStart = new Date(req.body.actualStartTime);
            const actualEnd = new Date(actualEndTime);
            if (isNaN(actualStart) || isNaN(actualEnd)) {
              throw new Error(
                'Invalid date format for actualStartTime or actualEndTime'
              );
            }
            if (actualEnd <= actualStart) {
              throw new Error(
                'Actual end time must be after actual start time'
              );
            }
          } else if (req.body.startTime) {
            const plannedStart = new Date(req.body.startTime);
            const actualEnd = new Date(actualEndTime);
            if (isNaN(plannedStart) || isNaN(actualEnd)) {
              throw new Error(
                'Invalid date format for startTime or actualEndTime'
              );
            }
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
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 3, max: 200 } },
    errorMessage: 'Actual pickup location must be 3-200 characters',
  },
  actualReturnLocation: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 3, max: 200 } },
    errorMessage: 'Actual return location must be 3-200 characters',
  },
  pickupOdometer: {
    in: ['body'],
    optional: true,
    isFloat: { options: { min: 0 } },
    toFloat: true,
    errorMessage: 'Pickup odometer must be a non-negative number',
  },
  returnOdometer: {
    in: ['body'],
    optional: true,
    isFloat: { options: { min: 0 } },
    toFloat: true,
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
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 500 } },
    errorMessage: 'Notes must not exceed 500 characters',
  },
  promotions: {
    in: ['body'],
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
              throw new Error('Each promotion must be a non-empty string');
            }
            // Kiểm tra định dạng MongoID (nếu cần)
            if (!/^[0-9a-fA-F]{24}$/.test(promotion)) {
              throw new Error('Each promotion must be a valid MongoID');
            }
          }
        }
        return true;
      },
    },
  },
});

export const completeBookingValidator = checkSchema({
  id: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  actualEndTime: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    isISO8601: { options: { strict: true } },
    errorMessage:
      'Actual end time is required and must be valid ISO8601 format',
    custom: {
      options: async (actualEndTime, { req }) => {
        // Giả sử bạn có thể truy vấn booking từ database
        const booking = await prisma.booking.findUnique({
          where: { id: req.params.id },
          select: { startTime: true, actualStartTime: true },
        });
        if (!booking) {
          throw new Error('Booking not found');
        }
        const endTimeDate = new Date(actualEndTime);
        if (isNaN(endTimeDate)) {
          throw new Error('Invalid date format for actualEndTime');
        }
        // Kiểm tra actualEndTime so với startTime hoặc actualStartTime
        const referenceTime = booking.actualStartTime || booking.startTime;
        if (referenceTime && endTimeDate <= new Date(referenceTime)) {
          throw new Error(
            'Actual end time must be after start time or actual start time'
          );
        }
        return true;
      },
    },
  },
  actualReturnLocation: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { min: 3, max: 200 } },
    errorMessage:
      'Actual return location is required and must be 3-200 characters',
  },
  returnOdometer: {
    in: ['body'],
    notEmpty: true,
    isFloat: { options: { min: 0 } },
    toFloat: true,
    errorMessage:
      'Return odometer is required and must be a non-negative number',
    custom: {
      options: async (returnOdometer, { req }) => {
        // Giả sử bạn có thể truy vấn pickupOdometer từ database
        const booking = await prisma.booking.findUnique({
          where: { id: req.params.id },
          select: { pickupOdometer: true },
        });
        if (!booking) {
          throw new Error('Booking not found');
        }
        if (
          booking.pickupOdometer !== null &&
          booking.pickupOdometer !== undefined
        ) {
          const pickup = parseFloat(booking.pickupOdometer);
          if (returnOdometer < pickup) {
            throw new Error(
              'Return odometer cannot be less than pickup odometer'
            );
          }
          if (returnOdometer - pickup > 1000) {
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
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 500 } },
    errorMessage: 'Notes must not exceed 500 characters',
  },
  damageReport: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 1000 } },
    errorMessage: 'Damage report must not exceed 1000 characters',
  },
  fuelLevel: {
    in: ['body'],
    notEmpty: true,
    isFloat: { options: { min: 0, max: 100 } },
    toFloat: true,
    errorMessage: 'Fuel level is required and must be between 0 and 100',
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
