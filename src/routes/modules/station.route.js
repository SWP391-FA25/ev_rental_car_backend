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

const router = Router();

// Lấy tất cả station (active)
router.get('/', getStations);
// Lấy station theo id
router.get('/:id', getStationByID);
// Lấy các station đã xóa hoặc inactive
router.get('/unavailable/all', getUnavailableStations);
// Tạo station mới
router.post('/', createStation);
// Cập nhật station
router.put('/:id', updateStation);
// Xóa mềm station (chuyển softDeleted=true)
router.patch('/soft-delete/:id', softDeleteStation);
// Xóa cứng station (xóa khỏi DB)
router.delete('/:id', deleteStaion);

export default router;
