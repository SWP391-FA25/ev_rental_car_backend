import { prisma } from '../lib/prisma.js';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers

  // Convert degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

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
      orderBy: { createdAt: 'desc' },
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
        stationStaff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
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

    const [deletedStation] = await prisma.$transaction([
      prisma.station.update({
        where: { id },
        data: { softDeleted: true, status: 'INACTIVE' },
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'DELETE',
          tableName: 'Station',
          recordId: id,
          oldData: station,
          newData: { softDeleted: true, status: 'INACTIVE' },
        },
      }),
    ]);
    return res.json({ success: true, data: { station: deletedStation } });
  } catch (error) {
    return next(error);
  }
};

const deleteStation = async (req, res, next) => {
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

    await prisma.$transaction([
      prisma.station.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'DELETE',
          tableName: 'Station',
          recordId: id,
          oldData: station,
          newData: null,
        },
      }),
    ]);
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
    const { name, location, address, status, capacity, contact } = req.body;
    if (
      !name ||
      !location ||
      !address ||
      !status ||
      typeof capacity !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All fields (name, location, address, status, capacity) are required.',
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

    const [updatedStation] = await prisma.$transaction([
      prisma.station.update({
        where: { id },
        data: { name, location, address, status, capacity, contact },
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          status: true,
          capacity: true,
          contact: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'UPDATE',
          tableName: 'Station',
          recordId: id,
          oldData: station,
          newData: { name, location, address, status, capacity, contact },
        },
      }),
    ]);
    return res.json({ success: true, data: { station: updatedStation } });
  } catch (error) {
    return next(error);
  }
};

const createStation = async (req, res, next) => {
  try {
    const { name, location, address, status, capacity, contact } = req.body;
    if (
      !name ||
      !location ||
      !address ||
      !status ||
      typeof capacity !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All fields (name, location, address, status, capacity) are required.',
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
    const [newStation] = await prisma.$transaction([
      prisma.station.create({
        data: { name, location, address, status, capacity, contact },
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          status: true,
          capacity: true,
          contact: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'CREATE',
          tableName: 'Station',
          recordId: name,
          oldData: null,
          newData: { name, location, address, status, capacity, contact },
        },
      }),
    ]);
    return res
      .status(201)
      .json({ success: true, data: { station: newStation } });
  } catch (error) {
    return next(error);
  }
};

const getVehiclesAtStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;

    const vehicles = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        vehicles: true,
      },
    });

    if (!vehicles) {
      return res.status(404).json({
        success: false,
        message: 'There are no vehicles at this station',
      });
    }

    return res.json({ success: true, data: { vehicles } });
  } catch (error) {
    return next(error);
  }
};

const getStaffAtStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;

    const staff = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        stationStaff: true,
      },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'There are no staff at this station',
      });
    }

    return res.json({ success: true, data: { staff } });
  } catch (error) {
    next(error);
  }
};

// Get nearby stations based on user location
const getNearbyStations = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km, default 10km

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Validate coordinates
    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates or radius',
      });
    }

    // Get all active stations
    const allStations = await prisma.station.findMany({
      where: {
        softDeleted: false,
        status: 'ACTIVE',
      },
      include: {
        vehicles: {
          where: {
            status: 'AVAILABLE',
            softDeleted: false,
          },
          include: {
            images: true,
          },
        },
      },
    });

    // Calculate distance and filter stations within radius
    const nearbyStations = allStations
      .map((station) => {
        // Extract coordinates from GeoJSON format
        let stationLat, stationLng;

        if (station.location && station.location.coordinates) {
          // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
          stationLng = station.location.coordinates[0];
          stationLat = station.location.coordinates[1];
        } else if (
          station.location &&
          station.location.lat &&
          station.location.lng
        ) {
          // Alternative format: { lat: number, lng: number }
          stationLat = station.location.lat;
          stationLng = station.location.lng;
        } else {
          return null; // Skip stations with invalid location
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          stationLat,
          stationLng
        );

        return {
          ...station,
          latitude: stationLat, // Add for compatibility
          longitude: stationLng, // Add for compatibility
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        };
      })
      .filter((station) => station !== null && station.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return res.json({
      success: true,
      data: {
        stations: nearbyStations,
        userLocation: { lat: userLat, lng: userLng },
        searchRadius,
        totalFound: nearbyStations.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export {
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
};
