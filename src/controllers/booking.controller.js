import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Get all bookings with filters
export const getBookingsValidation = [
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status value'),
  query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  query('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
  query('stationId').optional().isMongoId().withMessage('Invalid station ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const getBookings = async (req, res, next) => {
  try {
    const {
      status,
      userId,
      vehicleId,
      stationId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (stationId) where.stationId = stationId;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get booking by ID
export const getBookingByIdValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  handleValidationErrors,
];

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: {
          select: {
            id: true,
            model: true,
            licensePlate: true,
            batteryLevel: true,
            status: true,
          },
        },
        station: { select: { id: true, name: true, address: true } },
        payments: true,
        rentalHistories: true,
        promotionBookings: {
          include: {
            promotion: { select: { id: true, code: true, discount: true } },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    return next(error);
  }
};

// Get user's bookings
export const getUserBookingsValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status value'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const getUserBookings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const where = { userId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
          payments: { select: { id: true, amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Update booking
export const updateBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('startTime').optional().isISO8601().withMessage('Invalid start time'),
  body('endTime').optional().isISO8601().withMessage('Invalid end time'),
  body('pickupLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Pickup location must be 3-200 characters'),
  body('dropoffLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Dropoff location must be 3-200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors,
];

export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Prevent updates to completed or cancelled bookings
    if (['COMPLETED', 'CANCELLED'].includes(existingBooking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled bookings',
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, model: true, licensePlate: true } },
        station: { select: { id: true, name: true, address: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    return next(error);
  }
};

// Update booking status
export const updateBookingStatusValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status value'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  handleValidationErrors,
];

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const updateData = { status, updatedAt: new Date() };
    if (notes) updateData.notes = notes;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, model: true, licensePlate: true } },
        station: { select: { id: true, name: true, address: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    return next(error);
  }
};

// Cancel booking
export const cancelBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be 5-500 characters'),
  handleValidationErrors,
];

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled booking',
      });
    }

    if (booking.status === 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot cancel booking in progress. Please end the rental first.',
      });
    }

    const updateData = {
      status: 'CANCELLED',
      updatedAt: new Date(),
    };

    if (reason) updateData.notes = reason;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: { select: { id: true, model: true, licensePlate: true } },
        station: { select: { id: true, name: true, address: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    return next(error);
  }
};

// Get booking analytics
export const getBookingAnalyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
];

export const getBookingAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const [
      totalBookings,
      statusCounts,
      revenueData,
      popularVehicles,
      popularStations,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.booking.findMany({
        where: { ...where, status: 'COMPLETED' },
        include: { payments: { select: { amount: true } } },
      }),
      prisma.booking.groupBy({
        by: ['vehicleId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.booking.groupBy({
        by: ['stationId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, booking) => {
      const bookingRevenue = booking.payments.reduce(
        (bookingSum, payment) => bookingSum + payment.amount,
        0
      );
      return sum + bookingRevenue;
    }, 0);

    // Format status counts
    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          totalRevenue,
          averageBookingValue:
            revenueData.length > 0 ? totalRevenue / revenueData.length : 0,
        },
        statusBreakdown: statusStats,
        popularVehicles: popularVehicles.map((item) => ({
          vehicleId: item.vehicleId,
          bookingCount: item._count.id,
        })),
        popularStations: popularStations.map((item) => ({
          stationId: item.stationId,
          bookingCount: item._count.id,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};
/**
 *
 * id                   String             @id @default(auto()) @map("_id") @db.ObjectId
  userId               String             @db.ObjectId
  vehicleId            String             @db.ObjectId
  stationId            String             @db.ObjectId
  startTime            DateTime
  endTime              DateTime?
  actualStartTime      DateTime? // Added actual start time
  actualEndTime        DateTime? // Added actual end time
  pickupLocation       String?
  dropoffLocation      String?
  actualPickupLocation String? // Added actual pickup location
  actualReturnLocation String? // Added actual return location
  pickupOdometer       Float? // Added pickup odometer
  returnOdometer       Float? // Added return odometer
  notes                String? // Added notes
  status               BookingStatus      @default(PENDING)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User               @relation(fields: [userId], references: [id])
  vehicle              Vehicle            @relation(fields: [vehicleId], references: [id])
  station              Station            @relation(fields: [stationId], references: [id])} req
 */

// Create booking validation
export const createBookingValidation = [
  // Required fields - userId will come from req.user.id in auth middleware
  body('vehicleId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('stationId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid station ID is required'),
  body('startTime')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid start time is required (ISO8601 format)'),
  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be valid ISO8601 format')
    .custom((endTime, { req }) => {
      if (endTime && req.body.startTime) {
        const startTime = new Date(req.body.startTime);
        const endTimeDate = new Date(endTime);
        if (endTimeDate <= startTime) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),
  body('pickupLocation')
    .notEmpty()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Pickup location is required and must be 3-200 characters'),
  body('dropoffLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Dropoff location must be 3-200 characters'),

  // Actual fields (optional - filled during rental process)
  body('actualStartTime')
    .optional()
    .isISO8601()
    .withMessage('Actual start time must be valid ISO8601 format')
    .custom((actualStartTime, { req }) => {
      if (actualStartTime && req.body.startTime) {
        const plannedStart = new Date(req.body.startTime);
        const actualStart = new Date(actualStartTime);
        // Allow some flexibility - actual start can be before planned start
        const maxEarlyStart = new Date(plannedStart.getTime() - 30 * 60 * 1000); // 30 minutes early
        if (actualStart < maxEarlyStart) {
          throw new Error(
            'Actual start time cannot be more than 30 minutes before planned start time'
          );
        }
      }
      return true;
    }),
  body('actualEndTime')
    .optional()
    .isISO8601()
    .withMessage('Actual end time must be valid ISO8601 format')
    .custom((actualEndTime, { req }) => {
      if (actualEndTime) {
        // Check against actual start time if provided
        if (req.body.actualStartTime) {
          const actualStart = new Date(req.body.actualStartTime);
          const actualEnd = new Date(actualEndTime);
          if (actualEnd <= actualStart) {
            throw new Error('Actual end time must be after actual start time');
          }
        }
        // Check against planned start time if no actual start time
        else if (req.body.startTime) {
          const plannedStart = new Date(req.body.startTime);
          const actualEnd = new Date(actualEndTime);
          if (actualEnd <= plannedStart) {
            throw new Error('Actual end time must be after planned start time');
          }
        }
      }
      return true;
    }),
  body('actualPickupLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Actual pickup location must be 3-200 characters'),
  body('actualReturnLocation')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Actual return location must be 3-200 characters'),

  // Odometer readings
  body('pickupOdometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pickup odometer must be a non-negative number'),
  body('returnOdometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Return odometer must be a non-negative number')
    .custom((returnOdometer, { req }) => {
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
    }),

  // Optional notes field
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  // Promotions array (optional)
  body('promotions')
    .optional()
    .isArray()
    .withMessage('Promotions must be an array')
    .custom((promotions) => {
      if (promotions && promotions.length > 0) {
        for (const promotion of promotions) {
          if (typeof promotion !== 'string' || promotion.trim().length === 0) {
            throw new Error(
              'Each promotion must be a non-empty string (ID or code)'
            );
          }
        }
      }
      return true;
    }),

  handleValidationErrors,
];

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Get from authenticated user
    const {
      vehicleId,
      stationId,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      promotions = [],
    } = req.body;

    // Validate that user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate that vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, model: true, licensePlate: true, status: true },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    if (vehicle.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for booking',
      });
    }

    // Validate that station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { id: true, name: true, address: true },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    // Use transaction to create booking with promotions
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          vehicleId,
          stationId,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          pickupLocation,
          dropoffLocation,
          status: 'IN_PROGRESS',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
        },
      });

      // Create promotion bookings if promotions are provided
      const appliedPromotions = [];
      if (promotions && promotions.length > 0) {
        for (const element of promotions) {
          const promotion = await tx.promotion.findFirst({
            where: {
              OR: [{ id: element }, { code: element.toUpperCase() }],
            },
          });

          if (promotion) {
            const currentDate = new Date();
            if (
              promotion.validFrom <= currentDate &&
              promotion.validUntil >= currentDate
            ) {
              const promotionBooking = await tx.promotionBooking.create({
                data: {
                  bookingId: newBooking.id,
                  promotionId: promotion.id,
                },
                include: {
                  promotion: {
                    select: { id: true, code: true, discount: true },
                  },
                },
              });
              appliedPromotions.push(promotionBooking.promotion);
            }
          }
        }
      }

      return { booking: newBooking, appliedPromotions };
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          ...result.booking,
          appliedPromotions: result.appliedPromotions,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Complete booking validation
export const completeBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('actualEndTime')
    .notEmpty()
    .isISO8601()
    .withMessage(
      'Actual end time is required and must be valid ISO8601 format'
    ),
  body('actualReturnLocation')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Actual return location must be 3-200 characters'),
  body('returnOdometer')
    .isFloat({ min: 0 })
    .withMessage('Return odometer must be a non-negative number'),
  body('notes')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('damageReport')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Damage report must not exceed 1000 characters'),
  body('fuelLevel')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Fuel level must be between 0 and 100'),
  handleValidationErrors,
];

export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      actualEndTime,
      actualReturnLocation,
      returnOdometer,
      notes,
      damageReport,
      fuelLevel,
    } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: {
          select: {
            id: true,
            model: true,
            licensePlate: true,
            status: true,
          },
        },
        station: { select: { id: true, name: true, address: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Validate booking status
    if (booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Only bookings in progress can be completed',
      });
    }

    // Validate actual end time
    const actualEndDate = new Date(actualEndTime);
    const actualStartDate = booking.actualStartTime
      ? new Date(booking.actualStartTime)
      : new Date(booking.startTime);

    if (actualEndDate <= actualStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Actual end time must be after the start time',
      });
    }

    // Validate odometer reading
    if (returnOdometer !== undefined) {
      const pickupOdo = booking.pickupOdometer || 0;

      if (returnOdometer < pickupOdo) {
        return res.status(400).json({
          success: false,
          message: 'Return odometer cannot be less than pickup odometer',
        });
      }

      // Reasonable distance check (max 2000 km per rental)
      const distance = returnOdometer - pickupOdo;
      if (distance > 2000) {
        return res.status(400).json({
          success: false,
          message:
            'Odometer reading difference seems unrealistic (max 2000 km per rental)',
        });
      }
    }

    // Calculate rental duration
    const durationMs = actualEndDate.getTime() - actualStartDate.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Prepare update data
    const updateData = {
      status: 'COMPLETED',
      actualEndTime: actualEndDate,
      updatedAt: new Date(),
    };

    if (actualReturnLocation)
      updateData.actualReturnLocation = actualReturnLocation;
    if (returnOdometer !== undefined)
      updateData.returnOdometer = returnOdometer;
    if (notes) updateData.notes = notes;

    // Use transaction to update booking and vehicle
    const [updatedBooking] = await prisma.$transaction([
      // Update booking
      prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: {
            select: {
              id: true,
              model: true,
              licensePlate: true,
              batteryLevel: true,
            },
          },
          station: { select: { id: true, name: true, address: true } },
          payments: { select: { id: true, amount: true, status: true } },
        },
      }),

      // Update vehicle status and odometer
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          status: 'AVAILABLE',
          batteryLevel: fuelLevel !== undefined ? fuelLevel : Prisma.skip,
          updatedAt: new Date(),
        },
      }),

      // Create rental history record
      prisma.rentalHistory.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          distance:
            returnOdometer && booking.pickupOdometer
              ? returnOdometer - booking.pickupOdometer
              : 0.0,
          feedback: damageReport || '',
        },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Booking completed successfully',
      data: {
        booking: updatedBooking,
        summary: {
          duration: `${durationHours} hours`,
          distance:
            returnOdometer && booking.pickupOdometer
              ? `${(returnOdometer - booking.pickupOdometer).toFixed(1)} km`
              : 'Not recorded',
          startTime: actualStartDate.toISOString(),
          endTime: actualEndDate.toISOString(),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
