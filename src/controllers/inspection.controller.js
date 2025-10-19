import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import ImageKitService from '../lib/imagekit.js';

const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Export multer upload middleware
export const uploadInspectionImage = upload.single('image');

export const uploadInspectionImageHandler = async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed',
      });
    }

    // Check if inspection exists
    const inspection = await prisma.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Upload to ImageKit using the specific inspection image method
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `inspection_${inspectionId}_${timestamp}.${fileExtension}`;

    const uploadResult = await ImageKitService.uploadInspectionImage(
      file.buffer,
      fileName,
      inspectionId
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: uploadResult.error,
      });
    }

    // Update inspection with image data
    const updatedInspection = await prisma.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        images: {
          push: {
            url: uploadResult.data.url,
            thumbnailUrl: uploadResult.data.thumbnailUrl,
            fileId: uploadResult.data.fileId,
            fileName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.data.url,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        fileId: uploadResult.data.fileId,
      },
    });
  } catch (error) {
    console.error('Error uploading inspection image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

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

    // Create inspection record (without images initially)
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
        images: [], // Initialize with empty array
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

export const deleteInspectionImage = async (req, res) => {
  try {
    const { inspectionId, imageIndex } = req.params;

    // Check if inspection exists
    const inspection = await prisma.vehicleInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Check if images array exists and has the specified index
    if (
      !inspection.images ||
      !Array.isArray(inspection.images) ||
      inspection.images.length <= imageIndex
    ) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    const imageToDelete = inspection.images[imageIndex];

    // Delete from ImageKit if fileId exists
    if (imageToDelete.fileId) {
      try {
        await ImageKitService.deleteFile(imageToDelete.fileId);
      } catch (error) {
        console.warn('Failed to delete file from ImageKit:', error.message);
      }
    }

    // Remove image from inspection record
    const updatedImages = [...inspection.images];
    updatedImages.splice(imageIndex, 1);

    const updatedInspection = await prisma.vehicleInspection.update({
      where: { id: inspectionId },
      data: {
        images: updatedImages,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inspection image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
