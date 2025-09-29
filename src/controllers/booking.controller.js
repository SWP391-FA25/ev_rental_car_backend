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
