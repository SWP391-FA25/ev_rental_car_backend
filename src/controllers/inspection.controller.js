import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new vehicle inspection record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createInspection = async (req, res) => {
  try {
    const {
      vehicleId,
      staffId,
      bookingId,
      inspectionType,
      batteryLevel,
      exteriorCondition,
      interiorCondition,
      mileage,
      tireCondition,
      accessories,
      damageNotes,
      notes,
      images,
      documentVerified,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !staffId || !inspectionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, staffId, inspectionType',
      });
    }

    // Validate inspection type
    if (inspectionType !== 'CHECK_IN' && inspectionType !== 'CHECK_OUT') {
      return res.status(400).json({
        success: false,
        message: 'Invalid inspectionType. Must be CHECK_IN or CHECK_OUT',
      });
    }

    // Validate battery level
    if (
      batteryLevel !== undefined &&
      (batteryLevel < 0 || batteryLevel > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Battery level must be between 0 and 100',
      });
    }

    // Create inspection record
    const inspection = await prisma.vehicleInspection.create({
      data: {
        vehicleId,
        staffId,
        bookingId,
        inspectionType,
        batteryLevel,
        exteriorCondition,
        interiorCondition,
        mileage,
        tireCondition,
        accessories,
        damageNotes,
        notes,
        images,
        documentVerified: documentVerified || false,
        isCompleted: false,
      },
    });

    // If this is a check-out inspection, update the vehicle's battery level
    if (inspectionType === 'CHECK_OUT' && batteryLevel !== undefined) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { batteryLevel },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Inspection created successfully',
      data: { inspection },
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspection by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const inspection = await prisma.vehicleInspection.findUnique({
      where: { id },
      include: {
        vehicle: true,
        staff: true,
        booking: true,
      },
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { inspection },
    });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update inspection record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate battery level if provided
    if (
      updateData.batteryLevel !== undefined &&
      (updateData.batteryLevel < 0 || updateData.batteryLevel > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Battery level must be between 0 and 100',
      });
    }

    // Check if inspection exists
    const existingInspection = await prisma.vehicleInspection.findUnique({
      where: { id },
    });

    if (!existingInspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Update inspection
    const inspection = await prisma.vehicleInspection.update({
      where: { id },
      data: updateData,
    });

    // If this is a check-out inspection and it's being completed, update the vehicle's battery level
    if (
      inspection.inspectionType === 'CHECK_OUT' &&
      updateData.isCompleted === true &&
      updateData.batteryLevel !== undefined
    ) {
      await prisma.vehicle.update({
        where: { id: inspection.vehicleId },
        data: { batteryLevel: updateData.batteryLevel },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inspection updated successfully',
      data: { inspection },
    });
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspections for a specific booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const inspections = await prisma.vehicleInspection.findMany({
      where: { bookingId },
      include: {
        vehicle: true,
        staff: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: { inspections },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspections for a specific vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionsByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const inspections = await prisma.vehicleInspection.findMany({
      where: { vehicleId },
      include: {
        staff: true,
        booking: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { inspections },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspections conducted by a specific staff member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionsByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const inspections = await prisma.vehicleInspection.findMany({
      where: { staffId },
      include: {
        vehicle: true,
        booking: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { inspections },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete an inspection record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if inspection exists
    const existingInspection = await prisma.vehicleInspection.findUnique({
      where: { id },
    });

    if (!existingInspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Delete inspection
    await prisma.vehicleInspection.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspection statistics for reporting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionStats = async (req, res) => {
  try {
    // Get counts by condition
    const conditionStats = await prisma.vehicleInspection.groupBy({
      by: ['exteriorCondition'],
      _count: true,
    });

    // Get counts by inspection type
    const typeStats = await prisma.vehicleInspection.groupBy({
      by: ['inspectionType'],
      _count: true,
    });

    // Get recent inspections
    const recentInspections = await prisma.vehicleInspection.findMany({
      take: 10,
      include: {
        vehicle: true,
        staff: true,
        booking: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        conditionStats,
        typeStats,
        recentInspections,
      },
    });
  } catch (error) {
    console.error('Error fetching inspection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get inspections for a specific booking (renter version)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInspectionsByBookingForRenter = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id; // Get the authenticated user ID

    // Verify that the booking belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to the authenticated user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking',
      });
    }

    // Get inspections for the booking
    const inspections = await prisma.vehicleInspection.findMany({
      where: { bookingId },
      include: {
        vehicle: true,
        staff: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: { inspections },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
