import { prisma } from '../lib/prisma.js';
import ImageKitService from '../lib/imagekit.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

const uploadMiddleware = upload.single('image');

// Get all vehicles
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        softDeleted: false,
      },
      include: {
        station: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (vehicles.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No vehicles found' });
    }

    return res.json({ success: true, data: { vehicles } });
  } catch (err) {
    return next(err);
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: id },
      include: {
        station: true,
        images: true, // Include vehicle images
      },
    });

    if (!vehicle || vehicle.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Vehicle not found' });
    }

    return res.json({ success: true, data: { vehicle } });
  } catch (error) {
    return next(error);
  }
};

// Create a new vehicle
const createVehicle = async (req, res, next) => {
  try {
    const {
      stationId,
      type,
      brand,
      model,
      year,
      color,
      seats,
      licensePlate,
      batteryLevel,
      fuelType,
      status,
    } = req.body;

    // Validate required fields
    if (!stationId || !type || !brand || !model || !year || !fuelType) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: stationId, type, brand, model, year, fuelType',
      });
    }

    // Validate station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        stationId,
        type,
        brand,
        model,
        year: parseInt(year),
        color: color || 'Unknown',
        seats: parseInt(seats) || 5,
        licensePlate: licensePlate || null,
        batteryLevel: parseFloat(batteryLevel) || 0.0,
        fuelType,
        status: status || 'AVAILABLE',
      },
      include: {
        station: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: { vehicle },
    });
  } catch (error) {
    return next(error);
  }
};

// Update vehicle
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      stationId,
      type,
      brand,
      model,
      year,
      color,
      seats,
      licensePlate,
      batteryLevel,
      fuelType,
      status,
    } = req.body;

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: id },
    });

    if (!existingVehicle || existingVehicle.softDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // If stationId is provided, validate it exists
    if (stationId) {
      const station = await prisma.station.findUnique({
        where: { id: stationId },
      });

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Station not found',
        });
      }
    }

    // Update vehicle
    const vehicle = await prisma.vehicle.update({
      where: { id: id },
      data: {
        stationId: stationId || existingVehicle.stationId,
        type: type || existingVehicle.type,
        brand: brand || existingVehicle.brand,
        model: model || existingVehicle.model,
        year: year ? parseInt(year) : existingVehicle.year,
        color: color || existingVehicle.color,
        seats: seats ? parseInt(seats) : existingVehicle.seats,
        licensePlate: licensePlate || existingVehicle.licensePlate,
        batteryLevel: batteryLevel
          ? parseFloat(batteryLevel)
          : existingVehicle.batteryLevel,
        fuelType: fuelType || existingVehicle.fuelType,
        status: status || existingVehicle.status,
      },
      include: {
        station: true,
      },
    });

    return res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle },
    });
  } catch (error) {
    return next(error);
  }
};

// Soft delete vehicle
const softDeleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: id },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!vehicle || vehicle.softDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle has active bookings
    if (vehicle.bookings && vehicle.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active bookings',
      });
    }

    // Soft delete vehicle
    const deletedVehicle = await prisma.vehicle.update({
      where: { id: id },
      data: {
        softDeleted: true,
        status: 'OUT_OF_SERVICE',
      },
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
      },
    });

    return res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: { vehicle: deletedVehicle },
    });
  } catch (error) {
    return next(error);
  }
};

// Hard delete vehicle (use with caution)
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: id },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if vehicle has active bookings
    if (vehicle.bookings && vehicle.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active bookings',
      });
    }

    // Delete all associated images from ImageKit and database
    const images = await prisma.vehicleImage.findMany({
      where: { vehicleId: id },
    });

    // Delete images from ImageKit
    for (const image of images) {
      try {
        await ImageKitService.deleteFile(image.imageKitFileId);
      } catch (error) {
        console.error('Error deleting image from ImageKit:', error);
      }
    }

    // Delete images from database
    await prisma.vehicleImage.deleteMany({
      where: { vehicleId: id },
    });

    // Hard delete vehicle
    await prisma.vehicle.delete({
      where: { id: id },
    });

    return res.json({
      success: true,
      message: 'Vehicle permanently deleted',
    });
  } catch (error) {
    return next(error);
  }
};

// Upload vehicle image
const uploadVehicleImage = async (req, res, next) => {
  try {
    // Handle file upload with multer
    uploadMiddleware(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum 5MB allowed.',
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const { vehicleId } = req.params;

      // Verify vehicle exists
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.softDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      // Upload to ImageKit
      const fileName = `${vehicleId}_${Date.now()}_${req.file.originalname}`;
      const uploadResult = await ImageKitService.uploadVehicleImage(
        req.file.buffer,
        fileName,
        vehicleId
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to ImageKit',
          error: uploadResult.error,
        });
      }

      // Save image reference to database
      const vehicleImage = await prisma.vehicleImage.create({
        data: {
          vehicleId: vehicleId,
          imageKitFileId: uploadResult.data.fileId,
          url: uploadResult.data.url,
          thumbnailUrl: uploadResult.data.thumbnailUrl,
          fileName: uploadResult.data.name,
          size: uploadResult.data.size,
          fileType: uploadResult.data.fileType,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Vehicle image uploaded successfully',
        data: { image: vehicleImage },
      });
    });
  } catch (error) {
    return next(error);
  }
};

// Get vehicle images
const getVehicleImages = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.softDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Get all images for this vehicle
    const images = await prisma.vehicleImage.findMany({
      where: {
        vehicleId: vehicleId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: { images },
    });
  } catch (error) {
    return next(error);
  }
};

// Delete vehicle image
const deleteVehicleImage = async (req, res, next) => {
  try {
    const { vehicleId, imageId } = req.params;

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.softDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Get image details
    const image = await prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Delete from ImageKit
    const deleteResult = await ImageKitService.deleteFile(image.imageKitFileId);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete image from ImageKit',
        error: deleteResult.error,
      });
    }

    // Delete from database
    await prisma.vehicleImage.delete({
      where: { id: imageId },
    });

    return res.json({
      success: true,
      message: 'Vehicle image deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  softDeleteVehicle,
  deleteVehicle,
  uploadVehicleImage,
  getVehicleImages,
  deleteVehicleImage,
};
