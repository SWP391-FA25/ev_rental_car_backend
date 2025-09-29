/**
 * model RentalHistory {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  bookingId String   @db.ObjectId
  distance  Float    @default(0.0)
  rating    Int?
  feedback  String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  booking   Booking  @relation(fields: [bookingId], references: [id])

  @@index([userId, createdAt])
  @@index([bookingId])
}
 */
import { prisma } from '../lib/prisma.js';

// CREATE - Create rental history (when booking is completed)
const createRentalHistory = async (req, res, next) => {
  try {
    const { userId, bookingId, distance, rating, feedback } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if rental history already exists for this booking
    const existingHistory = await prisma.rentalHistory.findFirst({
      where: { bookingId },
    });

    if (existingHistory) {
      return res.status(409).json({
        success: false,
        message: 'Rental history already exists for this booking',
      });
    }

    // Create rental history
    const rentalHistory = await prisma.rentalHistory.create({
      data: {
        userId,
        bookingId,
        distance,
        rating,
        feedback,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Rental history created successfully',
      data: { rentalHistory },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get all rental histories
const getRentalHistories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, userId, rating } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter conditions
    const where = {};
    if (userId) where.userId = userId;
    if (rating) where.rating = parseInt(rating);

    const [rentalHistories, total] = await Promise.all([
      prisma.rentalHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  licensePlate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.rentalHistory.count({ where }),
    ]);

    if (rentalHistories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No rental histories found',
      });
    }

    res.json({
      success: true,
      data: {
        rentalHistories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get rental history by ID
const getRentalHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rentalHistory = await prisma.rentalHistory.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        booking: {
          include: {
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
                type: true,
              },
            },
            station: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found',
      });
    }

    res.json({
      success: true,
      data: { rentalHistory },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get rental histories by user ID
const getRentalHistoriesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [rentalHistories, total] = await Promise.all([
      prisma.rentalHistory.findMany({
        where: { userId },
        include: {
          booking: {
            include: {
              vehicle: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  licensePlate: true,
                  type: true,
                },
              },
              station: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.rentalHistory.count({ where: { userId } }),
    ]);

    if (rentalHistories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No rental histories found for this user',
      });
    }

    res.json({
      success: true,
      data: {
        rentalHistories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// READ - Get rental history by booking ID
const getRentalHistoryByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const rentalHistory = await prisma.rentalHistory.findFirst({
      where: { bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          include: {
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
      },
    });

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found for this booking',
      });
    }

    res.json({
      success: true,
      data: { rentalHistory },
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE - Update rental history (mainly for rating and feedback)
const updateRentalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { distance, rating, feedback } = req.body;

    // Check if rental history exists
    const existingHistory = await prisma.rentalHistory.findUnique({
      where: { id },
    });

    if (!existingHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found',
      });
    }

    // Prepare update data
    const updateData = {};
    if (distance !== undefined) updateData.distance = distance;
    if (rating !== undefined) updateData.rating = rating;
    if (feedback !== undefined) updateData.feedback = feedback;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const updatedHistory = await prisma.rentalHistory.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Rental history updated successfully',
      data: { rentalHistory: updatedHistory },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Delete rental history
const deleteRentalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if rental history exists
    const rentalHistory = await prisma.rentalHistory.findUnique({
      where: { id },
      select: {
        id: true,
        user: {
          select: { name: true },
        },
        booking: {
          select: { id: true },
        },
      },
    });

    if (!rentalHistory) {
      return res.status(404).json({
        success: false,
        message: 'Rental history not found',
      });
    }

    await prisma.rentalHistory.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Rental history deleted successfully',
      data: {
        deletedHistory: {
          id: rentalHistory.id,
          userName: rentalHistory.user.name,
          bookingId: rentalHistory.booking.id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ANALYTICS - Get rental statistics
const getRentalStatistics = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const where = userId ? { userId } : {};

    const [totalRentals, averageRating, totalDistance, ratingDistribution] =
      await Promise.all([
        // Total number of rentals
        prisma.rentalHistory.count({ where }),

        // Average rating
        prisma.rentalHistory.aggregate({
          where: { ...where, rating: { not: null } },
          _avg: { rating: true },
        }),

        // Total distance traveled
        prisma.rentalHistory.aggregate({
          where,
          _sum: { distance: true },
        }),

        // Rating distribution
        prisma.rentalHistory.groupBy({
          by: ['rating'],
          where: { ...where, rating: { not: null } },
          _count: true,
          orderBy: { rating: 'asc' },
        }),
      ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalRentals,
          averageRating: averageRating._avg.rating || 0,
          totalDistance: totalDistance._sum.distance || 0,
          ratingDistribution: ratingDistribution.map((item) => ({
            rating: item.rating,
            count: item._count,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createRentalHistory,
  getRentalHistories,
  getRentalHistoryById,
  getRentalHistoriesByUserId,
  getRentalHistoryByBookingId,
  updateRentalHistory,
  deleteRentalHistory,
  getRentalStatistics,
};
