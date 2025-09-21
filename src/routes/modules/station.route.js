import { Router } from 'express';
import {
  getStations,
  getStationByID,
  getUnavailableStations,
  createStation,
  updateStation,
  softDeleteStation,
  deleteStaion,
} from '../controllers/station.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Lấy tất cả station (active)
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getStations);
// Lấy station theo id
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), getStationByID);
// Lấy các station đã xóa hoặc inactive
router.get(
  '/unavailable/all',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getUnavailableStations
);
// Tạo station mới
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), createStation);
// Cập nhật station
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateStation);
// Xóa mềm station (chuyển softDeleted=true)
router.patch(
  '/soft-delete/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  softDeleteStation
);
// Xóa cứng station (xóa khỏi DB)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStaion);

export default router;
