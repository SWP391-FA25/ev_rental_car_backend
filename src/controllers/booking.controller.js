import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingConfirmed,
  notifyBookingCreated,
  notifyBookingStarted,
  notifyStaffNewBooking,
} from '../utils/notificationHelper.js';

// Constants for magic numbers (with environment variable fallbacks)
const PRICING_RATES = {
  INSURANCE: parseFloat(process.env.INSURANCE_RATE) || 0.1, // 10% insurance
  TAX: parseFloat(process.env.TAX_RATE) || 0.08, // 8% tax
};
const MAX_ODOMETER_DIFF = parseInt(process.env.MAX_ODOMETER_DIFF) || 2000;
const MAX_PROMOTION_STACK = parseInt(process.env.MAX_PROMOTION_STACK) || 3; // Limit stacking to 3 promotions
const OVERTIME_MULTIPLIER = parseFloat(process.env.OVERTIME_MULTIPLIER) || 1.5; // 50% extra for overtime
const OVERDUE_CHECK_IN_INTERVAL =
  parseInt(process.env.OVERDUE_CHECK_IN_INTERVAL) || 24; // 24 hours default

// Reusable Prisma includes for bookings
const BOOKING_INCLUDES = {
  user: { select: { id: true, name: true, email: true } },
  vehicle: {
    include: {
      pricing: true,
    },
  },
  station: { select: { id: true, name: true, address: true } },
  staff: { select: { id: true, name: true, email: true, role: true } },
  payments: true,
};

// Helper function for rounding currency values
const round = (num) => Math.round(num * 100) / 100;

// Helper function for intelligent pricing calculation
const calculatePricing = (pricing, durationHours) => {
  const durationDays = Math.ceil(durationHours / 24);
  const durationWeeks = Math.ceil(durationHours / (24 * 7));
  const durationMonths = Math.ceil(durationHours / (24 * 30));

  let basePrice = 0;
  let pricingType = 'hourly';
  let pricingDetails = {};

  // Smart pricing logic - choose the most cost-effective rate
  if (durationMonths >= 1 && pricing.monthlyRate > 0) {
    // Monthly rate (best value for long-term rentals)
    basePrice = durationMonths * pricing.monthlyRate;
    pricingType = 'monthly';
    pricingDetails = {
      rate: pricing.monthlyRate,
      quantity: durationMonths,
      unit: 'month(s)',
    };
  } else if (durationWeeks >= 1 && pricing.weeklyRate > 0) {
    // Weekly rate with daily calculation for remaining days
    const fullWeeks = Math.floor(durationDays / 7);
    const remainingDays = durationDays % 7;
    const weeklyCost = fullWeeks * pricing.weeklyRate;
    const dailyCost = remainingDays * pricing.baseRate;
    basePrice = weeklyCost + dailyCost;
    pricingType = 'weekly';
    pricingDetails = {
      weeklyRate: pricing.weeklyRate,
      weeklyQuantity: fullWeeks,
      weeklyCost: weeklyCost,
      dailyRate: pricing.baseRate,
      dailyQuantity: remainingDays,
      dailyCost: dailyCost,
    };
  } else if (durationDays >= 1 && pricing.baseRate > 0) {
    // Daily rate with hourly calculation for remaining hours
    const fullDays = Math.floor(durationHours / 24);
    const remainingHours = durationHours % 24;
    const dailyCost = fullDays * pricing.baseRate;
    const hourlyCost = remainingHours * pricing.hourlyRate;
    basePrice = dailyCost + hourlyCost;
    pricingType = 'daily';
    pricingDetails = {
      dailyRate: pricing.baseRate,
      dailyQuantity: fullDays,
      dailyCost: dailyCost,
      hourlyRate: pricing.hourlyRate,
      hourlyQuantity: remainingHours,
      hourlyCost: hourlyCost,
    };
  } else {
    // Hourly rate for short rentals
    basePrice = durationHours * pricing.hourlyRate;
    pricingType = 'hourly';
    pricingDetails = {
      rate: pricing.hourlyRate,
      quantity: durationHours,
      unit: 'hour(s)',
    };
  }

  return {
    basePrice: round(basePrice),
    pricingType,
    pricingDetails,
    durationBreakdown: {
      hours: durationHours,
      days: durationDays,
      weeks: durationWeeks,
      months: durationMonths,
    },
  };
};

// Helper function for promotion validation
const validatePromotionUsage = async (
  tx,
  promotionId,
  userId,
  rentalAmount = 0
) => {
  const promotion = await tx.promotion.findUnique({
    where: { id: promotionId },
    select: {
      oneTimeUse: true,
      usageLimit: true,
      isActive: true,
      minRentalAmount: true,
      maxDiscountAmount: true,
      discountType: true,
      discount: true,
      validFrom: true,
      validUntil: true,
    },
  });

  if (!promotion) return { isValid: false, reason: 'PROMOTION_NOT_FOUND' };

  // Check if promotion is active
  if (!promotion.isActive) {
    return { isValid: false, reason: 'PROMOTION_INACTIVE' };
  }

  // Check validity period
  const now = new Date();
  if (now < promotion.validFrom || now > promotion.validUntil) {
    return { isValid: false, reason: 'PROMOTION_EXPIRED' };
  }

  // Check minimum rental amount
  if (promotion.minRentalAmount && rentalAmount < promotion.minRentalAmount) {
    return { isValid: false, reason: 'MIN_RENTAL_AMOUNT_NOT_MET' };
  }

  // Check one-time use restriction
  if (promotion.oneTimeUse) {
    const existingUse = await tx.promotionBooking.count({
      where: {
        promotionId,
        booking: { userId },
      },
    });
    if (existingUse > 0) {
      return { isValid: false, reason: 'PROMOTION_ALREADY_USED' };
    }
  }

  // Check usage limit
  if (promotion.usageLimit && promotion.usageLimit > 0) {
    const currentUsage = await tx.promotionBooking.count({
      where: { promotionId },
    });
    if (currentUsage >= promotion.usageLimit) {
      return { isValid: false, reason: 'PROMOTION_USAGE_LIMIT_EXCEEDED' };
    }
  }

  return { isValid: true };
};

// Get all bookings with filters

export const getBookings = async (req, res, next) => {
  try {
    const {
      status,
      userId,
      vehicleId,
      stationId,
      staffId,
      startDate,
      endDate,
      search, // Added search parameter
      page = 1,
      limit = 20,
    } = req.query;

    // Note: Date range validation is handled by middleware

    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (stationId) where.stationId = stationId;
    if (staffId) where.staffId = staffId;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // Added search functionality
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { model: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: BOOKING_INCLUDES,
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

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: {
          include: {
            pricing: true,
          },
        },
        station: { select: { id: true, name: true, address: true } },
        staff: { select: { id: true, name: true, email: true, role: true } },
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

    // Log payments for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== BOOKING PAYMENTS DEBUG ===');
      console.log('Booking ID:', booking.id);
      console.log('User:', booking.user.name, '(', booking.user.email, ')');
      console.log('Vehicle:', booking.vehicle.model);
      console.log('Payments:', booking.payments);
      console.log('Total payments:', booking.payments.length);

      if (booking.payments.length > 0) {
        booking.payments.forEach((payment, index) => {
          console.log(`Payment ${index + 1}:`, {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            method: payment.paymentMethod,
            transactionId: payment.transactionId,
            paymentDate: payment.paymentDate,
            isDeposit: payment.isDeposit,
          });
        });
      } else {
        console.log('No payments found for this booking');
      }
      console.log('=== END PAYMENTS DEBUG ===');
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
          vehicle: {
            include: {
              pricing: true,
              images: true,
            },
          },
          station: { select: { id: true, name: true, address: true } },
          staff: { select: { id: true, name: true, email: true, role: true } },
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
      include: BOOKING_INCLUDES,
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

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, vehicleId: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    let vehicleStatus;
    switch (status) {
      case 'IN_PROGRESS':
        // Note: IN_PROGRESS should be set through checkInBooking function
        // But keeping this for backward compatibility
        vehicleStatus = 'RENTED';
        break;
      case 'COMPLETED':
      case 'CANCELLED':
        vehicleStatus = 'AVAILABLE';
        break;
      default:
        vehicleStatus = null; // Don't update vehicle status for other statuses
    }

    const updateData = { status, updatedAt: new Date() };
    if (notes) updateData.notes = notes;

    // Use transaction to update both booking and vehicle status
    const result = await prisma.$transaction(async (tx) => {
      try {
        // Update booking status
        const updatedBooking = await tx.booking.update({
          where: { id },
          data: updateData,
          include: BOOKING_INCLUDES,
        });

        // Update vehicle status if needed
        if (vehicleStatus) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: {
              status: vehicleStatus,
              updatedAt: new Date(),
            },
          });
        }

        // Added audit log
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'UPDATE_STATUS',
            tableName: 'Booking',
            recordId: booking.id,
            oldData: { status: booking.status },
            newData: { status },
          },
        });

        return updatedBooking;
      } catch (txError) {
        console.error('Transaction failed in updateBookingStatus:', txError);
        throw txError; // Ensures rollback
      }
    });

    // Send notifications based on status change
    try {
      switch (status) {
        case 'IN_PROGRESS':
          await notifyBookingStarted(result);
          break;
        case 'COMPLETED':
          await notifyBookingCompleted(result);
          break;
        case 'CANCELLED':
          await notifyBookingCancelled(result, notes);
          break;
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the status update if notifications fail
    }

    return res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking: result,
        vehicleStatusUpdated: vehicleStatus
          ? `Vehicle status changed to ${vehicleStatus}`
          : 'Vehicle status unchanged',
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Cancel booking

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, vehicleId: true },
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

    // Use transaction to update both booking and vehicle status
    const updatedBooking = await prisma.$transaction(async (tx) => {
      try {
        // Update booking status
        const booking = await tx.booking.update({
          where: { id },
          data: updateData,
          include: BOOKING_INCLUDES,
        });

        // Reset vehicle status to AVAILABLE when booking is cancelled
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: {
            status: 'AVAILABLE',
            updatedAt: new Date(),
          },
        });

        // Added audit log
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'CANCEL',
            tableName: 'Booking',
            recordId: booking.id,
            oldData: { status: booking.status },
            newData: { status: 'CANCELLED' },
          },
        });

        return booking;
      } catch (txError) {
        console.error('Transaction failed in cancelBooking:', txError);
        throw txError; // Ensures rollback
      }
    });

    // Send notification about cancellation
    try {
      await notifyBookingCancelled(updatedBooking, reason);
    } catch (notificationError) {
      console.error(
        'Error sending cancellation notification:',
        notificationError
      );
      // Don't fail the cancellation if notifications fail
    }

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

export const getBookingAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Validation handled by getBookingAnalyticsValidator middleware

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
      revenueStats, // Changed to aggregate for efficiency
      popularVehiclesRaw,
      popularStationsRaw,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.booking.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
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

    // Enhanced: Fetch names for popular items
    const [popularVehicles, popularStations] = await Promise.all([
      prisma.vehicle.findMany({
        where: { id: { in: popularVehiclesRaw.map((p) => p.vehicleId) } },
        select: { id: true, model: true },
      }),
      prisma.station.findMany({
        where: { id: { in: popularStationsRaw.map((p) => p.stationId) } },
        select: { id: true, name: true },
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = revenueStats._sum.totalAmount || 0;
    const completedCount = revenueStats._count.id || 0;

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
            completedCount > 0 ? totalRevenue / completedCount : 0,
        },
        statusBreakdown: statusStats,
        popularVehicles: popularVehicles.map((v) => ({
          vehicleId: v.id,
          model: v.model,
          bookingCount: popularVehiclesRaw.find((p) => p.vehicleId === v.id)
            ?._count.id,
        })),
        popularStations: popularStations.map((s) => ({
          stationId: s.id,
          name: s.name,
          bookingCount: popularStationsRaw.find((p) => p.stationId === s.id)
            ?._count.id,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get bookings managed by the authenticated staff member
export const getMyManagedBookings = async (req, res, next) => {
  try {
    const staffId = req.user.id; // Get authenticated staff member's ID
    const { status, page = 1, limit = 20 } = req.query;

    // Verify the user is staff or admin
    if (!['STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only staff and admin can access managed bookings',
      });
    }

    const where = { staffId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          vehicle: {
            include: {
              pricing: true,
            },
          },
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
        staffInfo: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
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
export const createBooking = async (req, res, next) => {
  try {
    const user = req.user; // Get authenticated user
    const {
      vehicleId,
      stationId,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
      promotions = [],
      renterId, // Add renterId for when staff/admin creates booking for renter
    } = req.body;

    let userId;

    if (user.role !== 'RENTER') {
      if (!renterId) {
        return res.status(400).json({
          success: false,
          message:
            'renterId is required when staff/admin creates booking for a renter',
        });
      }
      userId = renterId;
    } else {
      userId = user.id;
    }

    // Get vehicle data for pricing calculation (validation already done in middleware)
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { pricing: true },
    });

    // Calculate booking duration and pricing
    const startDate = new Date(startTime);
    const endDate = endTime
      ? new Date(endTime)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Calculate complete pricing breakdown
    const pricingResult = calculatePricing(vehicle.pricing, durationHours);
    const basePrice = pricingResult.basePrice;
    const depositAmount = vehicle.pricing.depositAmount || 0;
    const insuranceAmount = round(basePrice * PRICING_RATES.INSURANCE);
    const taxAmount = round(basePrice * PRICING_RATES.TAX);

    // Optimized transaction with better concurrency handling
    let result;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (retryCount < MAX_RETRIES) {
      try {
        result = await prisma.$transaction(async (tx) => {
          // Atomic conflict check and vehicle availability verification
          const [conflictCheck, currentVehicle] = await Promise.all([
            tx.booking.findFirst({
              where: {
                vehicleId,
                OR: [
                  {
                    startTime: { lte: endDate },
                    endTime: { gte: startDate },
                  },
                ],
                status: { not: 'CANCELLED' },
              },
              select: { id: true },
            }),
            tx.vehicle.findUnique({
              where: { id: vehicleId },
              select: { status: true, updatedAt: true },
            }),
          ]);

          if (conflictCheck) {
            throw new Error('CONFLICT_DETECTED');
          }

          if (!currentVehicle || currentVehicle.status !== 'AVAILABLE') {
            throw new Error('VEHICLE_NO_LONGER_AVAILABLE');
          }

          try {
            // Create booking first
            const newBooking = await tx.booking.create({
              data: {
                userId,
                vehicleId,
                stationId,
                staffId: user.role !== 'RENTER' ? user.id : null, // Only assign staff if staff/admin creates the booking
                startTime: startDate,
                endTime: endDate,
                pickupLocation,
                dropoffLocation,
                basePrice,
                insuranceAmount,
                taxAmount,
                depositAmount, // Add deposit amount
                discountAmount: 0, // Will be updated after promotions
                totalAmount: 0, // Will be updated after promotions
                status: 'PENDING',
              },
              include: BOOKING_INCLUDES,
            });

            // Process promotions with stacking limit and validation
            const appliedPromotions = [];
            if (promotions && promotions.length > 0) {
              // Fixed promotion lookup - flatten the OR conditions to avoid nested ORs
              const promotionConditions = [];
              for (const promo of promotions) {
                promotionConditions.push({ id: promo });
                promotionConditions.push({
                  code: { equals: promo.toUpperCase(), mode: 'insensitive' },
                });
              }

              const promotionLookups = await tx.promotion.findMany({
                where: {
                  OR: promotionConditions,
                },
              });

              let stackCount = 0;
              for (const promotion of promotionLookups) {
                if (stackCount >= MAX_PROMOTION_STACK) break; // Limit promotion stacking

                const currentDate = new Date();
                if (
                  promotion.validFrom <= currentDate &&
                  promotion.validUntil >= currentDate
                ) {
                  // Validate promotion usage with helper function
                  const validation = await validatePromotionUsage(
                    tx,
                    promotion.id,
                    userId,
                    basePrice + insuranceAmount + taxAmount
                  );
                  if (!validation.isValid) continue; // Skip if validation fails

                  // Calculate discount amount for this specific promotion
                  const subtotal = basePrice + insuranceAmount + taxAmount;
                  let promotionDiscountAmount = 0;

                  if (promotion.discountType === 'FIXED_AMOUNT') {
                    // Fixed amount discount
                    promotionDiscountAmount = promotion.discount;
                  } else {
                    // Percentage discount (default)
                    promotionDiscountAmount =
                      subtotal * (promotion.discount / 100);
                  }

                  // Apply maximum discount limit if specified
                  if (
                    promotion.maxDiscountAmount &&
                    promotionDiscountAmount > promotion.maxDiscountAmount
                  ) {
                    promotionDiscountAmount = promotion.maxDiscountAmount;
                  }

                  const promotionBooking = await tx.promotionBooking.create({
                    data: {
                      bookingId: newBooking.id,
                      promotionId: promotion.id,
                      discountAmount: promotionDiscountAmount, // Store actual discount amount
                    },
                    include: {
                      promotion: {
                        select: { id: true, code: true, discount: true },
                      },
                    },
                  });
                  appliedPromotions.push({
                    ...promotionBooking.promotion,
                    appliedDiscountAmount: promotionDiscountAmount,
                  });
                  stackCount++; // Increment stack count
                }
              }
            }

            // Calculate total discount amount
            let totalDiscountAmount = appliedPromotions.reduce(
              (sum, promo) => sum + promo.appliedDiscountAmount,
              0
            );

            // Ensure discount doesn't exceed the total cost
            const subtotal = basePrice + insuranceAmount + taxAmount;
            totalDiscountAmount = Math.min(totalDiscountAmount, subtotal);

            // Calculate final total amount (rental amount, not including deposit)
            const finalTotalAmount = subtotal - totalDiscountAmount;

            // Update booking with final amounts
            const updatedBooking = await tx.booking.update({
              where: { id: newBooking.id },
              data: {
                discountAmount: totalDiscountAmount,
                totalAmount: finalTotalAmount,
              },
              include: BOOKING_INCLUDES,
            });

            // Don't update vehicle status to RENTED yet - keep it AVAILABLE until booking is confirmed

            return {
              booking: updatedBooking,
              appliedPromotions,
              pricingBreakdown: {
                ...pricingResult,
                insuranceAmount,
                taxAmount,
                discountAmount: totalDiscountAmount,
                subtotal,
                totalAmount: finalTotalAmount,
                depositAmount,
                totalPayable: finalTotalAmount + depositAmount,
                duration: `${durationHours} hours`,
                breakdown: {
                  base: basePrice,
                  insurance: insuranceAmount,
                  tax: taxAmount,
                  subtotal: subtotal,
                  discount: totalDiscountAmount,
                  rental: finalTotalAmount,
                  deposit: depositAmount,
                  total: finalTotalAmount + depositAmount,
                },
              },
            };
          } catch (txError) {
            console.error('Transaction failed in createBooking:', txError);
            throw txError; // Ensures rollback
          }
        });

        // If we reach here, transaction was successful
        break;
      } catch (error) {
        retryCount++;

        // Handle specific concurrency errors with exponential backoff
        if (
          (error.message === 'CONFLICT_DETECTED' ||
            error.message === 'VEHICLE_NO_LONGER_AVAILABLE') &&
          retryCount < MAX_RETRIES
        ) {
          console.log(
            `Booking creation attempt ${retryCount} failed due to concurrency, retrying...`
          );
          // Exponential backoff with jitter
          const delay =
            Math.min(1000, 100 * Math.pow(2, retryCount)) + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        } else {
          // For other errors or when max retries reached, throw the error
          throw error;
        }
      }
    }

    if (!result) {
      return res.status(409).json({
        success: false,
        message: 'Unable to create booking due to conflicts. Please try again.',
      });
    }

    // Send notifications
    try {
      // Notify staff at station about new booking
      if (req.user.role === 'RENTER') {
        await notifyStaffNewBooking(result.booking, stationId);
      }
      // Notify renter if staff created booking for them
      if (req.user.role !== 'RENTER') {
        await notifyBookingCreated(result.booking, req.user.role);
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the booking creation if notifications fail
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: result.booking,
        appliedPromotions: result.appliedPromotions.map((promo) => ({
          id: promo.id,
          code: promo.code,
          discount: promo.discount,
          appliedDiscountAmount: promo.appliedDiscountAmount,
        })),
        pricingBreakdown: result.pricingBreakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Check-in booking (start rental)
export const checkInBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      actualStartTime,
      actualPickupLocation,
      pickupOdometer,
      batteryLevel,
    } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: {
          select: {
            id: true,
            model: true,
            licensePlate: true,
            status: true,
            batteryLevel: true,
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
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message:
          'Only confirmed bookings can be checked in. Current status: ' +
          booking.status,
      });
    }

    // Validate vehicle is available for pickup
    if (booking.vehicle.status !== 'RESERVED') {
      return res.status(400).json({
        success: false,
        message:
          'Vehicle is not reserved for this booking. Current status: ' +
          booking.vehicle.status,
      });
    }

    // Validate actual start time against scheduled time (business logic)
    const actualStartDate = new Date(actualStartTime);
    const scheduledStartDate = new Date(booking.startTime);

    // Allow check-in up to configured hours before or after scheduled time
    const timeDiffHours =
      Math.abs(actualStartDate.getTime() - scheduledStartDate.getTime()) /
      (1000 * 60 * 60);
    if (timeDiffHours > OVERDUE_CHECK_IN_INTERVAL) {
      return res.status(400).json({
        success: false,
        message:
          'Check-in time is too far from scheduled start time (max ' +
          OVERDUE_CHECK_IN_INTERVAL +
          ' hours difference)',
      });
    }

    const updateData = {
      status: 'IN_PROGRESS',
      actualStartTime: actualStartDate,
      staffId: req.user.id, // Assign current staff member as responsible for this booking
      updatedAt: new Date(),
    };

    if (actualPickupLocation)
      updateData.actualPickupLocation = actualPickupLocation;
    if (pickupOdometer !== undefined)
      updateData.pickupOdometer = pickupOdometer;

    const result = await prisma.$transaction(async (tx) => {
      try {
        // Update booking
        const updatedBooking = await tx.booking.update({
          where: { id },
          data: updateData,
          include: BOOKING_INCLUDES,
        });

        // Update vehicle status and battery level
        const vehicleUpdateData = {
          status: 'RENTED',
          updatedAt: new Date(),
        };

        if (batteryLevel !== undefined) {
          vehicleUpdateData.batteryLevel = batteryLevel;
        }

        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: vehicleUpdateData,
        });

        // Create audit log for check-in
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'CHECK_IN',
            tableName: 'Booking',
            recordId: booking.id,
            oldData: { status: 'CONFIRMED' },
            newData: {
              status: 'IN_PROGRESS',
              actualStartTime: actualStartDate,
              actualPickupLocation,
              pickupOdometer,
              batteryLevel,
            },
          },
        });

        return { updatedBooking };
      } catch (txError) {
        console.error('Transaction failed in checkInBooking:', txError);
        throw txError;
      }
    });

    return res.json({
      success: true,
      message: 'Booking checked in successfully. Vehicle rental has started.',
      data: {
        booking: result.updatedBooking,
        checkInSummary: {
          actualStartTime: actualStartDate.toISOString(),
          scheduledStartTime: booking.startTime,
          actualPickupLocation: actualPickupLocation || booking.pickupLocation,
          pickupOdometer: pickupOdometer || 'Not recorded',
          batteryLevel:
            batteryLevel !== undefined ? `${batteryLevel}%` : 'Not updated',
          handledBy: `${req.user.role}: ${req.user.id}`,
          staffAssigned: true,
          staffInfo: {
            id: req.user.id,
            name: req.user.name,
          },
          note: 'Vehicle inspection should be created separately via /api/inspections endpoint',
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Complete booking
export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      actualEndTime,
      actualReturnLocation,
      returnOdometer,
      notes,
      damageReport,
      batteryLevel, // Changed from fuelLevel to batteryLevel for EVs
      rating, // Add rating for rental history
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
            pricing: true, // Added for overtime calculation
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

      // Reasonable distance check using constant
      const distance = returnOdometer - pickupOdo;
      if (distance > MAX_ODOMETER_DIFF) {
        return res.status(400).json({
          success: false,
          message:
            'Odometer reading difference seems unrealistic (max ' +
            MAX_ODOMETER_DIFF +
            ' km per rental)',
        });
      }
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Note: Battery level validation is handled by middleware

    // Calculate rental duration
    const durationMs = actualEndDate.getTime() - actualStartDate.getTime();
    const actualDurationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Enhanced overtime calculation using intelligent pricing
    let overtimeAmount = 0;
    let overtimeHours = 0;
    const plannedDurationMs = booking.endTime
      ? new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()
      : 24 * 60 * 60 * 1000;
    const plannedDurationHours = Math.ceil(
      plannedDurationMs / (1000 * 60 * 60)
    );

    if (actualDurationHours > plannedDurationHours) {
      overtimeHours = actualDurationHours - plannedDurationHours;

      // Use intelligent pricing for overtime calculation
      const overtimePricing = calculatePricing(
        booking.vehicle.pricing,
        overtimeHours
      );
      const overtimeRate = overtimePricing.basePrice / overtimeHours; // Get effective hourly rate
      const overtimeMultiplierRate = overtimeRate * OVERTIME_MULTIPLIER;
      overtimeAmount = overtimeHours * overtimeMultiplierRate;
    }

    // Prepare update data (pricing was already calculated during booking creation)
    const updateData = {
      status: 'COMPLETED',
      actualEndTime: actualEndDate,
      depositStatus: 'REFUNDED', // Mark deposit as refunded when rental completes successfully
      updatedAt: new Date(),
      totalAmount: {
        increment: round(overtimeAmount), // Add rounded overtime to total
      },
    };

    if (actualReturnLocation)
      updateData.actualReturnLocation = actualReturnLocation;
    if (returnOdometer !== undefined)
      updateData.returnOdometer = returnOdometer;
    if (notes) updateData.notes = notes;

    // Use sequential transaction to ensure proper order of operations
    const updatedBooking = await prisma.$transaction(async (tx) => {
      try {
        // Update booking first
        const updated = await tx.booking.update({
          where: { id },
          data: updateData,
          include: {
            ...BOOKING_INCLUDES,
            payments: { select: { id: true, amount: true, status: true } },
          },
        });

        // Create audit log BEFORE vehicle status update for proper transaction ordering
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'COMPLETE',
            tableName: 'Booking',
            recordId: booking.id,
            oldData: {
              status: 'IN_PROGRESS',
              actualEndTime: null,
              returnOdometer: booking.returnOdometer,
              totalAmount: booking.totalAmount,
            },
            newData: {
              status: 'COMPLETED',
              actualEndTime: actualEndDate,
              returnOdometer,
              totalAmount: booking.totalAmount + overtimeAmount,
              overtimeAmount,
            },
          },
        });

        // Update vehicle status and battery level AFTER audit log
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: {
            status: 'AVAILABLE',
            batteryLevel:
              batteryLevel !== undefined ? batteryLevel : Prisma.skip,
            updatedAt: new Date(),
          },
        });

        // Create rental history record
        await tx.rentalHistory.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            distance:
              returnOdometer && booking.pickupOdometer
                ? returnOdometer - booking.pickupOdometer
                : 0.0,
            rating: rating || null, // Add customer rating
            feedback: damageReport || notes || '', // Combine damage report and notes
          },
        });

        return { updated };
      } catch (txError) {
        console.error('Transaction failed in completeBooking:', txError);
        throw txError; // Ensures rollback
      }
    });

    // Send notification about completion
    try {
      await notifyBookingCompleted(updatedBooking);

      // Send overtime notification if applicable
      if (overtimeAmount > 0) {
        // TODO: Create dedicated overtime notification function
        console.log(
          `Overtime charges applied: ${overtimeAmount} for booking ${booking.id}`
        );
        // await notifyOvertimeCharge(updatedBooking, overtimeAmount, overtimeHours);
      }
    } catch (notificationError) {
      console.error(
        'Error sending completion notification:',
        notificationError
      );
      // Don't fail the completion if notifications fail
    }

    return res.json({
      success: true,
      message: 'Booking completed successfully',
      data: {
        booking: updatedBooking.updated,
        summary: {
          duration: `${actualDurationHours} hours`,
          distance:
            returnOdometer && booking.pickupOdometer
              ? `${(returnOdometer - booking.pickupOdometer).toFixed(1)} km`
              : 'Not recorded',
          startTime: actualStartDate.toISOString(),
          endTime: actualEndDate.toISOString(),
          damageReport: damageReport || null,
          overtime: {
            hours: overtimeHours,
            amount: overtimeAmount,
          },
          pricing: {
            basePrice: updatedBooking.updated.basePrice,
            insuranceAmount: updatedBooking.updated.insuranceAmount,
            taxAmount: updatedBooking.updated.taxAmount,
            discountAmount: updatedBooking.updated.discountAmount,
            overtimeAmount,
            totalAmount: updatedBooking.updated.totalAmount,
            depositAmount: updatedBooking.updated.depositAmount,
            depositStatus: updatedBooking.updated.depositStatus,
          },
          note: 'Vehicle checkout inspection should be created separately via /api/inspections endpoint',
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDepositStatus = async (req, res, next) => {
  const { id } = req.params;
  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        depositStatus: true,
        depositAmount: true,
        userId: true,
      },
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (existingBooking.depositStatus === 'PAID') {
      return res.json({
        success: true,
        message: 'Deposit is already confirmed for this booking',
        data: { booking: existingBooking },
      });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        bookingId: id,
        paymentType: 'DEPOSIT',
        status: 'PAID',
      },
      orderBy: { paymentDate: 'desc' },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No paid deposit payment found for this booking',
        code: 'DEPOSIT_PAYMENT_NOT_FOUND',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: {
          status:
            existingBooking.status === 'PENDING'
              ? 'CONFIRMED'
              : existingBooking.status,
          depositStatus: 'PAID',
          depositAmount: payment.amount,
          updatedAt: new Date(),
        },
        include: BOOKING_INCLUDES,
      });

      // Update vehicle status to RESERVED when booking is confirmed
      if (
        existingBooking.status === 'PENDING' &&
        booking.status === 'CONFIRMED'
      ) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: {
            status: 'RESERVED',
            updatedAt: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.id || existingBooking.userId,
          action: 'DEPOSIT_CONFIRMED',
          tableName: 'Booking',
          recordId: id,
          oldData: {
            depositStatus: existingBooking.depositStatus,
            status: existingBooking.status,
          },
          newData: {
            depositStatus: 'PAID',
            status: booking.status,
            paymentId: payment.id,
          },
        },
      });

      return { booking };
    });

    // Send booking confirmation notification if status changed to CONFIRMED
    try {
      if (
        existingBooking.status === 'PENDING' &&
        result.booking.status === 'CONFIRMED'
      ) {
        await notifyBookingConfirmed(result.booking);
      }
    } catch (notificationError) {
      console.error(
        'Error sending booking confirmation notification:',
        notificationError
      );
      // Don't fail the deposit confirmation if notifications fail
    }

    return res.json({
      success: true,
      message: 'Deposit confirmed and booking status updated successfully',
      data: {
        booking: result.booking,
        payment: {
          id: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          transactionId: payment.transactionId,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
