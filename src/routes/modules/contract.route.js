import express from 'express';
import multer from 'multer';
import ContractController from '../../controllers/contract.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createContractValidation,
  uploadSignedContractValidation,
  getContractByIdValidation,
  getContractsByBookingValidation,
  getAllContractsValidation,
  validateContractFile,
  authorizeContractAccess,
} from '../../middleware/contract.middleware.js';

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

// Staff/Admin routes - Create contract
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  createContractValidation,
  ContractController.createContract
);

// Staff/Admin routes - Upload signed contract photo
router.post(
  '/:contractId/upload',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  upload.single('file'),
  validateContractFile,
  uploadSignedContractValidation,
  ContractController.uploadSignedContract
);

// Get contract by ID - Accessible by owner (renter) or staff/admin
router.get(
  '/:contractId',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getContractByIdValidation,
  authorizeContractAccess,
  ContractController.getContract
);

// Get contracts by booking ID - Accessible by booking owner or staff/admin
router.get(
  '/booking/:bookingId',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getContractsByBookingValidation,
  ContractController.getContractsByBooking
);

// Staff/Admin routes - Get all contracts with filtering
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getAllContractsValidation,
  ContractController.getAllContracts
);

// Staff/Admin routes - Get contract statistics
router.get(
  '/stats/overview',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  ContractController.getContractStats
);

export default router;
