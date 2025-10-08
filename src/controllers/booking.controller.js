import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// Get all bookings with filters

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

    // Additional validation for date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before or equal to endDate',
      });
    }

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
          vehicle: {
            include: {
              pricing: true,
            },
          },
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

    // Determine vehicle status based on booking status
    let vehicleStatus;
    switch (status) {
      case 'CONFIRMED':
        vehicleStatus = 'RESERVED';
        break;
      case 'IN_PROGRESS':
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
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: {
            select: { id: true, model: true, licensePlate: true, status: true },
          },
          station: { select: { id: true, name: true, address: true } },
        },
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

      return updatedBooking;
    });

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
      // Update booking status
      const booking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
        },
      });

      // Reset vehicle status to AVAILABLE when booking is cancelled
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          status: 'AVAILABLE',
          updatedAt: new Date(),
        },
      });

      return booking;
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

export const getBookingAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Additional validation for date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before or equal to endDate',
      });
    }

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

    // Check vehicle exists, is available, and has pricing
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        pricing: true,
      },
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

    if (!vehicle.pricing) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle pricing information not found',
      });
    }

    // Calculate booking duration and pricing
    const startDate = new Date(startTime);
    const endDate = endTime
      ? new Date(endTime)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours if no end time

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
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
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already booked for the requested time',
      });
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Calculate base pricing using the vehicle's pricing information
    const hourlyRate = vehicle.pricing.hourlyRate;
    const basePrice = durationHours * hourlyRate;

    // Calculate deposit amount from pricing
    const depositAmount = vehicle.pricing.depositAmount || 0;

    // Calculate insurance and tax amounts (percentage-based)
    const insuranceRate = 0.1; // 10% insurance
    const taxRate = 0.08; // 8% tax
    const insuranceAmount = basePrice * insuranceRate;
    const taxAmount = basePrice * taxRate;

    // Use transaction to create booking with promotions
    const result = await prisma.$transaction(async (tx) => {
      // Create booking first
      const newBooking = await tx.booking.create({
        data: {
          userId,
          vehicleId,
          stationId,
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
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
        },
      });

      // Process promotions if any
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
              // Calculate discount amount for this specific promotion
              const promotionDiscountAmount = basePrice * promotion.discount;

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
            }
          }
        }
      }

      // Calculate total discount amount
      let totalDiscountAmount = 0;

      for (const promotion of appliedPromotions) {
        // Use the calculated discount amount for each promotion
        totalDiscountAmount += promotion.appliedDiscountAmount;
      }

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
        include: {
          user: { select: { id: true, name: true, email: true } },
          vehicle: { select: { id: true, model: true, licensePlate: true } },
          station: { select: { id: true, name: true, address: true } },
        },
      });

      // Don't update vehicle status to RENTED yet - keep it AVAILABLE until booking is confirmed

      return {
        booking: updatedBooking,
        appliedPromotions,
        pricingBreakdown: {
          basePrice,
          insuranceAmount,
          taxAmount,
          discountAmount: totalDiscountAmount,
          subtotal,
          totalAmount: finalTotalAmount, // This is rental amount (excluding deposit)
          depositAmount, // Separate deposit amount
          totalPayable: finalTotalAmount + depositAmount, // Total including deposit
          duration: `${durationHours} hours`,
        },
      };
    });

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

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Validate battery level if provided
    if (
      batteryLevel !== undefined &&
      (batteryLevel < 0 || batteryLevel > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Battery level must be between 0 and 100',
      });
    }

    // Calculate rental duration
    const durationMs = actualEndDate.getTime() - actualStartDate.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Prepare update data (pricing was already calculated during booking creation)
    const updateData = {
      status: 'COMPLETED',
      actualEndTime: actualEndDate,
      depositStatus: 'REFUNDED', // Mark deposit as refunded when rental completes successfully
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

      // Update vehicle status and battery level
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          status: 'AVAILABLE',
          batteryLevel: batteryLevel !== undefined ? batteryLevel : Prisma.skip,
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
          rating: rating || null, // Add customer rating
          feedback: damageReport || notes || '', // Combine damage report and notes
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
          pricing: {
            basePrice: updatedBooking.basePrice,
            insuranceAmount: updatedBooking.insuranceAmount,
            taxAmount: updatedBooking.taxAmount,
            discountAmount: updatedBooking.discountAmount,
            totalAmount: updatedBooking.totalAmount,
            depositAmount: updatedBooking.depositAmount,
            depositStatus: updatedBooking.depositStatus,
          },
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
