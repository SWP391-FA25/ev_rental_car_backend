import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Validation schemas
const uploadDocumentSchema = z.object({
  documentType: z.enum(['DRIVERS_LICENSE', 'ID_CARD', 'PASSPORT']),
  documentNumber: z.string().optional(),
  expiryDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class DocumentController {
  // Upload document
  async uploadDocument(req, res) {
    try {
      const { userId } = req.user;
      const file = req.file;

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

      // Validate request body
      const validatedData = uploadDocumentSchema.parse(req.body);

      // Check if document type already exists for user
      const existingDocument = await prisma.userDocument.findFirst({
        where: {
          userId,
          documentType: validatedData.documentType,
        },
      });

      if (existingDocument && existingDocument.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Document of this type is already approved.',
        });
      }

      // Create unique file path
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${userId}_${validatedData.documentType}_${timestamp}.${fileExtension}`;
      const uploadsDir = path.join(
        __dirname,
        '../../uploads/documents',
        userId
      );
      const filePath = path.join(uploadsDir, fileName);

      // Ensure uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });

      // Save file to local filesystem
      await fs.writeFile(filePath, file.buffer);

      // Create file URL for serving
      const fileUrl = `/uploads/documents/${userId}/${fileName}`;

      // Delete existing pending/rejected document if exists
      if (existingDocument) {
        try {
          // Delete old file from filesystem
          await fs.unlink(existingDocument.filePath);
        } catch (error) {
          console.warn('Failed to delete old file:', error.message);
        }

        // Delete old document record
        await prisma.userDocument.delete({
          where: { id: existingDocument.id },
        });
      }

      // Save document info to database
      const document = await prisma.userDocument.create({
        data: {
          userId,
          documentType: validatedData.documentType,
          fileName: file.originalname,
          fileUrl: fileUrl,
          filePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          documentNumber: validatedData.documentNumber,
          expiryDate: validatedData.expiryDate,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          status: document.status,
          uploadedAt: document.uploadedAt,
        },
      });
    } catch (error) {
      console.error('Upload document error:', error);

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

  // Get user documents
  async getUserDocuments(req, res) {
    try {
      const { userId } = req.user;

      const documents = await prisma.userDocument.findMany({
        where: { userId },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          fileUrl: true,
          status: true,
          uploadedAt: true,
          verifiedAt: true,
          rejectionReason: true,
          expiryDate: true,
          documentNumber: true,
        },
        orderBy: { uploadedAt: 'desc' },
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete document
  async deleteDocument(req, res) {
    try {
      const { userId } = req.user;
      const { documentId } = req.params;

      // Find document
      const document = await prisma.userDocument.findFirst({
        where: {
          id: documentId,
          userId,
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      if (document.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete approved document',
        });
      }

      // Delete from local filesystem
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('Failed to delete file from storage:', error.message);
      }

      // Delete from database
      await prisma.userDocument.delete({
        where: { id: documentId },
      });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Admin: Get all documents for verification
  async getAllDocuments(req, res) {
    try {
      const { status, documentType, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (documentType) where.documentType = documentType;

      const documents = await prisma.userDocument.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { uploadedAt: 'desc' },
      });

      const total = await prisma.userDocument.count({ where });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Admin: Verify document
  async verifyDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { status, rejectionReason } = req.body;
      const { userId, name } = req.user; // Admin user info

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be APPROVED or REJECTED',
        });
      }

      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required when rejecting document',
        });
      }

      const document = await prisma.userDocument.findUnique({
        where: { id: documentId },
        include: { user: true },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      const updatedDocument = await prisma.userDocument.update({
        where: { id: documentId },
        data: {
          status,
          verifiedAt: new Date(),
          verifiedBy: `${name} (${userId})`,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
      });

      res.json({
        success: true,
        message: `Document ${status.toLowerCase()} successfully`,
        data: updatedDocument,
      });
    } catch (error) {
      console.error('Verify document error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default new DocumentController();
