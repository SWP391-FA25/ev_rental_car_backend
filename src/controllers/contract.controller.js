import { PrismaClient } from '@prisma/client';
import ImageKitService from '../lib/imagekit.js';

const prisma = new PrismaClient();

class ContractController {
  // Create contract record (simple tracking)
  async createContract(req, res) {
    try {
      const { bookingId, renterName, witnessName, notes } = req.body;

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
          bookingId,
          contractNumber,
          status: 'CREATED',
          renterName,
          witnessName,
          notes,
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
      const { userId } = req.user;
      const { renterName, witnessName, notes } = req.body;
      const file = req.file;

      // Get contract details (validation already done in middleware)
      const contract = await prisma.rentalContract.findUnique({
        where: { id: contractId },
        select: { contractNumber: true },
      });

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
          renterName,
          witnessName,
          notes,
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
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all contracts with filtering (for staff/admin)
  async getAllContracts(req, res) {
    try {
      const {
        status,
        bookingId,
        templateId,
        page = 1,
        limit = 20,
        startDate,
        endDate,
      } = req.query;

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
      const [totalContracts, createdContracts, completedContracts] =
        await Promise.all([
          prisma.rentalContract.count(),
          prisma.rentalContract.count({ where: { status: 'CREATED' } }),
          prisma.rentalContract.count({ where: { status: 'COMPLETED' } }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalContracts,
          pending: createdContracts,
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
