import { prisma } from '../lib/prisma.js';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

const getStations = async (req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      where: {
        softDeleted: false,
      },
      include: {
        vehicles: true,
        stationStaff: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (stations.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Station not found' });
    }
    return res.json({ success: true, data: { stations } });
  } catch (err) {
    return next(err);
  }
};

const getUnavailableStations = async (req, res, next) => {
  try {
    const deletedStations = await prisma.station.findMany({
      where: {
        OR: [{ softDeleted: true }, { status: 'INACTIVE' }],
      },
    });

    if (deletedStations.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No unavailable stations found' });
    }
    return res.json({ success: true, data: { deletedStations } });
  } catch (error) {
    return next(error);
  }
};

const getStationByID = async (req, res, next) => {
  try {
    const { id } = req.params;
    const station = await prisma.station.findUnique({
      where: { id: id },
      include: {
        vehicles: true,
        stationStaff: true,
        bookings: true,
      },
    });
    if (!station) {
      return res
        .status(404)
        .json({ success: false, message: 'Station not found' });
    }
    return res.json({ success: true, data: { station } });
  } catch (error) {
    return next(error);
  }
};

const softDeleteStation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        vehicles: {
          where: {
            status: { in: ['MAINTENANCE', 'INACTIVE'] },
            softDeleted: false,
          },
        },
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
        },
      },
    });
    if (!station || station.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Station not found' });
    }

    if (station.vehicles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete: Station has active vehicles.',
      });
    }
    if (station.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete: Station has active bookings.',
      });
    }

    const deletedStation = await prisma.station.update({
      where: { id },
      data: { softDeleted: true, status: 'INACTIVE' },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
      },
    });
    return res.json({ success: true, data: { station: deletedStation } });
  } catch (error) {
    return next(error);
  }
};

const deleteStaion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const station = await prisma.station.findUnique({
      where: { id },
    });

    if (!station) {
      return res
        .status(404)
        .json({ success: false, message: 'Station not found' });
    }

    await prisma.station.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Station deleted successfully',
      data: { station },
    });
  } catch (error) {
    return next(error);
  }
};

const updateStation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, address, status } = req.body;
    if (!name || !location || !address || !status) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, location, address, status) are required.',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        vehicles: true,
        bookings: true,
      },
    });
    if (!station || station.softDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    if (name !== station.name) {
      const existingStation = await prisma.station.findFirst({
        where: { name, softDeleted: false, NOT: { id } },
      });
      if (existingStation) {
        return res.status(409).json({
          success: false,
          message: 'Station name already exists.',
        });
      }
    }

    if (['INACTIVE', 'MAINTENANCE'].includes(status)) {
      if (station.vehicles && station.vehicles.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot set INACTIVE/MAINTENANCE: Station has active vehicles.',
        });
      }
      if (station.bookings && station.bookings.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot set INACTIVE/MAINTENANCE: Station has active bookings.',
        });
      }
    }

    const updatedStation = await prisma.station.update({
      where: { id },
      data: { name, location, address, status },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        status: true,
        updatedAt: true,
      },
    });
    return res.json({ success: true, data: { station: updatedStation } });
  } catch (error) {
    return next(error);
  }
};

const createStation = async (req, res, next) => {
  try {
    const { name, location, address, status } = req.body;

    if (!name || !location || !address || !status) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, location, address, status) are required.',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const existingStation = await prisma.station.findFirst({
      where: { name, softDeleted: false },
    });
    if (existingStation) {
      return res.status(409).json({
        success: false,
        message: 'Station name already exists.',
      });
    }

    const newStation = await prisma.station.create({
      data: { name, location, address, status },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });
    return res
      .status(201)
      .json({ success: true, data: { station: newStation } });
  } catch (error) {
    return next(error);
  }
};

export {
  getStations,
  getStationByID,
  getUnavailableStations,
  softDeleteStation,
  updateStation,
  createStation,
  deleteStaion,
};
