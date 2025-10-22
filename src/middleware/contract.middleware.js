import { checkSchema } from 'express-validator';
import validate from '../utils/validation.js';
import { prisma } from '../lib/prisma.js';

// Create contract validation
export const createContractValidator = checkSchema({
  bookingId: {
    in: ['body'],
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Valid booking ID is required',
    custom: {
      options: async (bookingId) => {
        // Verify booking exists and is confirmed
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: {
            id: true,
            status: true,
            userId: true,
          },
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.status !== 'CONFIRMED') {
          throw new Error(
            'Contract can only be created for confirmed bookings'
          );
        }

        // Check if contract already exists for this booking
        const existingContract = await prisma.rentalContract.findFirst({
          where: { bookingId },
        });

        if (existingContract) {
          throw new Error('Contract already exists for this booking');
        }

        return true;
      },
    },
  },
  renterName: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
    },
    errorMessage: 'Renter name must be 2-100 characters if provided',
  },
  witnessName: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
    },
    errorMessage: 'Witness name must be 2-100 characters if provided',
  },
  notes: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
});

// Upload signed contract validation
export const uploadSignedContractValidator = checkSchema({
  contractId: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid contract ID',
    custom: {
      options: async (contractId) => {
        const contract = await prisma.rentalContract.findUnique({
          where: { id: contractId },
          select: { id: true, status: true },
        });

        if (!contract) {
          throw new Error('Contract not found');
        }

        if (contract.status !== 'CREATED') {
          throw new Error('Contract has already been uploaded');
        }

        return true;
      },
    },
  },
  renterName: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
    },
    errorMessage: 'Renter name is required and must be 2-100 characters',
  },
  witnessName: {
    in: ['body'],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: { min: 2, max: 100 },
    },
    errorMessage: 'Witness name is required and must be 2-100 characters',
  },
  notes: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 500 },
    },
    errorMessage: 'Notes must not exceed 500 characters',
  },
});

// Get contract by ID validation
export const getContractByIdValidator = checkSchema({
  contractId: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid contract ID',
  },
});

// Get contracts by booking ID validation
export const getContractsByBookingValidator = checkSchema({
  bookingId: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
});

// Get all contracts validation (for staff/admin)
export const getAllContractsValidator = checkSchema({
  status: {
    in: ['query'],
    optional: true,
    isIn: {
      options: [['CREATED', 'COMPLETED']],
    },
    errorMessage: 'Invalid status value. Must be CREATED or COMPLETED',
  },
  bookingId: {
    in: ['query'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid booking ID',
  },
  templateId: {
    in: ['query'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid template ID',
  },
  startDate: {
    in: ['query'],
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid start date format',
  },
  endDate: {
    in: ['query'],
    optional: true,
    isISO8601: true,
    errorMessage: 'Invalid end date format',
    custom: {
      options: (endDate, { req }) => {
        if (endDate && req.query.startDate) {
          const startDate = new Date(req.query.startDate);
          const endDateObj = new Date(endDate);
          if (startDate > endDateObj) {
            throw new Error('Start date must be before or equal to end date');
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

// File validation middleware (for multer files)
export const validateContractFile = (req, res, next) => {
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.',
    });
  }

  // Validate file size
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB.',
    });
  }

  next();
};

// Authorization middleware for contract access
export const authorizeContractAccess = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { userId, role } = req.user;

    // Staff and Admin have full access
    if (['STAFF', 'ADMIN'].includes(role)) {
      return next();
    }

    // Renters can only access their own contracts
    if (role === 'RENTER') {
      const contract = await prisma.rentalContract.findUnique({
        where: { id: contractId },
        include: {
          booking: {
            select: { userId: true },
          },
        },
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contract not found',
        });
      }

      if (contract.booking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Contract authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Middleware array exports for easy use
export const createContractValidation = validate([createContractValidator]);
export const uploadSignedContractValidation = validate([
  uploadSignedContractValidator,
]);
export const getContractByIdValidation = validate([getContractByIdValidator]);
export const getContractsByBookingValidation = validate([
  getContractsByBookingValidator,
]);
export const getAllContractsValidation = validate([getAllContractsValidator]);
