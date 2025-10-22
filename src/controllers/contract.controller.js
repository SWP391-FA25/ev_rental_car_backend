import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import ImageKitService from '../lib/imagekit.js';

const prisma = new PrismaClient();

// Validation schemas
const createContractSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  renterName: z.string().optional(),
  witnessName: z.string().optional(),
  notes: z.string().optional(),
});

const uploadSignedContractSchema = z.object({
  renterName: z.string().min(1, 'Renter name is required'),
  witnessName: z.string().min(1, 'Witness name is required'),
  notes: z.string().optional(),
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class ContractController {
  // Create contract record (simple tracking)
  async createContract(req, res) {
    try {
      const { role } = req.user;

      // Only STAFF and ADMIN can create contracts
      if (!['STAFF', 'ADMIN'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only staff and admin can create contracts',
        });
      }

      // Validate request body
      const validatedData = createContractSchema.parse(req.body);

      // Verify booking exists and is confirmed
      const booking = await prisma.booking.findUnique({
        where: { id: validatedData.bookingId },
        include: {
          user: true,
          vehicle: true,
          station: true,
        },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.status !== 'CONFIRMED') {
        return res.status(400).json({
          success: false,
          message: 'Contract can only be created for confirmed bookings',
        });
      }

      // Check if contract already exists for this booking
      const existingContract = await prisma.rentalContract.findFirst({
        where: { bookingId: validatedData.bookingId },
      });

      if (existingContract) {
        return res.status(400).json({
          success: false,
          message: 'Contract already exists for this booking',
        });
      }

      // Generate contract number
      const currentYear = new Date().getFullYear();
      const contractCount = await prisma.rentalContract.count({
        where: {
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
      });
      const contractNumber = `CONTRACT-${currentYear}-${(contractCount + 1).toString().padStart(4, '0')}`;

      // Create contract record (just tracking, no content generation)
      const contract = await prisma.rentalContract.create({
        data: {
          bookingId: validatedData.bookingId,
          contractNumber,
          status: 'CREATED',
          renterName: validatedData.renterName,
          witnessName: validatedData.witnessName,
          notes: validatedData.notes,
        },
        include: {
          booking: {
            include: {
              user: true,
              vehicle: true,
              station: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Contract record created successfully',
        data: contract,
      });
    } catch (error) {
      console.error('Create contract error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get contract by ID
  async getContract(req, res) {
    try {
      const { contractId } = req.params;
      const { userId, role } = req.user;

      const contract = await prisma.rentalContract.findUnique({
        where: { id: contractId },
        include: {
          booking: {
            include: {
              user: true,
              vehicle: true,
              station: true,
            },
          },
          template: true,
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contract not found',
        });
      }

      // Authorization check
      if (role === 'RENTER' && contract.booking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      console.error('Get contract error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get contracts by booking ID
  async getContractsByBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { userId, role } = req.user;

      // Check if user has access to this booking
      if (role === 'RENTER') {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        if (!booking || booking.userId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }

      const contracts = await prisma.rentalContract.findMany({
        where: { bookingId },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      console.error('Get contracts by booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Upload signed contract photo
  async uploadSignedContract(req, res) {
    try {
      const { contractId } = req.params;
      const { userId, role } = req.user;
      const file = req.file;

      // Only STAFF and ADMIN can upload signed contracts
      if (!['STAFF', 'ADMIN'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only staff and admin can upload signed contracts',
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Validate file
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed.',
        });
      }

      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
        });
      }

      // Validate request body for renter and witness information
      const validatedData = uploadSignedContractSchema.parse(req.body);

      const contract = await prisma.rentalContract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contract not found',
        });
      }

      if (contract.status !== 'CREATED') {
        return res.status(400).json({
          success: false,
          message: 'Contract has already been uploaded',
        });
      }

      // Upload to ImageKit
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `signed_${contract.contractNumber}_${timestamp}.${fileExtension}`;

      const uploadResult = await ImageKitService.uploadContract(
        file.buffer,
        fileName,
        contractId
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to storage',
          error: uploadResult.error,
        });
      }

      // Update contract with signed photo details and mark as completed
      const updatedContract = await prisma.rentalContract.update({
        where: { id: contractId },
        data: {
          status: 'COMPLETED',
          renterName: validatedData.renterName,
          witnessName: validatedData.witnessName,
          notes: validatedData.notes,
          signedAt: new Date(),
          signedFileName: file.originalname,
          signedFileUrl: uploadResult.data.url,
          signedFileId: uploadResult.data.fileId,
          signedFilePath: uploadResult.data.filePath,
          signedThumbnailUrl: uploadResult.data.thumbnailUrl,
          signedFileSize: file.size,
          signedMimeType: file.mimetype,
          uploadedBy: userId,
          uploadedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              user: true,
              vehicle: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'Signed contract uploaded and completed successfully',
        data: updatedContract,
      });
    } catch (error) {
      console.error('Upload signed contract error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all contracts with filtering (for staff/admin)
  async getAllContracts(req, res) {
    try {
      const { role } = req.user;
      const {
        status,
        bookingId,
        templateId,
        page = 1,
        limit = 20,
        startDate,
        endDate,
      } = req.query;

      // Only STAFF and ADMIN can get all contracts
      if (!['STAFF', 'ADMIN'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const skip = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (bookingId) where.bookingId = bookingId;
      if (templateId) where.templateId = templateId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const contracts = await prisma.rentalContract.findMany({
        where,
        include: {
          booking: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              vehicle: true,
              station: true,
            },
          },
          template: true,
          uploader: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.rentalContract.count({ where });

      res.json({
        success: true,
        data: {
          contracts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all contracts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get contract statistics
  async getContractStats(req, res) {
    try {
      const { role } = req.user;

      // Only STAFF and ADMIN can get contract stats
      if (!['STAFF', 'ADMIN'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const [
        totalContracts,
        createdContracts,
        signedContracts,
        uploadedContracts,
        completedContracts,
      ] = await Promise.all([
        prisma.rentalContract.count(),
        prisma.rentalContract.count({ where: { status: 'CREATED' } }),
        prisma.rentalContract.count({ where: { status: 'SIGNED' } }),
        prisma.rentalContract.count({ where: { status: 'UPLOADED' } }),
        prisma.rentalContract.count({ where: { status: 'COMPLETED' } }),
      ]);

      res.json({
        success: true,
        data: {
          total: totalContracts,
          created: createdContracts,
          signed: signedContracts,
          uploaded: uploadedContracts,
          completed: completedContracts,
        },
      });
    } catch (error) {
      console.error('Get contract stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default new ContractController();
