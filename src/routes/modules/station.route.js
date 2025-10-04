import { Router } from 'express';
import {
  createStation,
  deleteStation,
  getNearbyStations,
  getStaffAtStation,
  getStationByID,
  getStations,
  getUnavailableStations,
  getVehiclesAtStation,
  softDeleteStation,
  updateStation,
} from '../../controllers/station.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Lấy tất cả station (active)
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getStations);
// Lấy stations gần vị trí user (public endpoint)
router.get('/nearby', getNearbyStations);
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
router.post('/', authenticate, authorize('ADMIN'), createStation);
// Cập nhật station
router.put('/:id', authenticate, authorize('ADMIN'), updateStation);
// Xóa mềm station (chuyển softDeleted=true)
router.patch(
  '/soft-delete/:id',
  authenticate,
  authorize('ADMIN'),
  softDeleteStation
);
// Xóa cứng station (xóa khỏi DB)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStation);

router.get(
  '/station/getVehiclesAtStation/:stationId',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getVehiclesAtStation
);

router.get(
  '/station/getStaffAtStation/:stationId',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getStaffAtStation
);

export default router;
