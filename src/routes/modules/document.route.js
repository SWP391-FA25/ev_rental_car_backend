import express from 'express';
import multer from 'multer';
import DocumentController from '../../controllers/document.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

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

// User routes
router.post(
  '/upload',
  authenticate,
  upload.single('document'),
  DocumentController.uploadDocument
);
router.get('/my-documents', authenticate, DocumentController.getUserDocuments);
router.delete('/:documentId', authenticate, DocumentController.deleteDocument);

// Admin routes
router.get('/all', authenticate, DocumentController.getAllDocuments);
router.patch(
  '/:documentId/verify',
  authenticate,
  DocumentController.verifyDocument
);

export default router;
