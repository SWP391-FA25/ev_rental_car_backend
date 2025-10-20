import { Router } from 'express';
import {
  createVehicle,
  deleteVehicle,
  deleteVehicleImage,
  getVehicleById,
  getVehicleImages,
  getVehicles,
  softDeleteVehicle,
  updateVehicle,
  uploadVehicleImage,
} from '../../controllers/vehicle.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Get all vehicles
router.get('/', getVehicles);

// Get vehicle by ID
router.get('/:id', getVehicleById);

// Create a new vehicle
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), createVehicle);

// Update vehicle
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateVehicle);

// Soft delete vehicle (set softDeleted=true)
router.patch(
  '/soft-delete/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  softDeleteVehicle
);

// Hard delete vehicle (permanent deletion)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteVehicle);

// Upload vehicle image
router.post(
  '/:vehicleId/images',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  uploadVehicleImage
);

// Get vehicle images
router.get('/:vehicleId/images', getVehicleImages);

// Delete vehicle image
router.delete(
  '/:vehicleId/images/:imageId',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  deleteVehicleImage
);

export default router;
