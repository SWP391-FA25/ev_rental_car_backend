import { prisma } from '../lib/prisma.js';

export async function createBooking(req, res, next) {
  try {
    const userId = req.user?.id;
    const {
      vehicleId,
      stationId,
      startTime,
      endTime,
      pickupLocation,
      dropoffLocation,
    } = req.body || {};

    if (!userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!vehicleId || !stationId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (
      !(start instanceof Date && !isNaN(start)) ||
      !(end instanceof Date && !isNaN(end)) ||
      start >= end
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid time range' });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || vehicle.softDeleted || vehicle.status !== 'AVAILABLE') {
        throw Object.assign(new Error('Vehicle not available'), {
          statusCode: 409,
        });
      }

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'RESERVED' },
      });

      const overlapping = await tx.booking.findFirst({
        where: {
          vehicleId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (overlapping) {
        throw Object.assign(new Error('Vehicle already booked in that slot'), {
          statusCode: 409,
        });
      }

      const created = await tx.booking.create({
        data: {
          userId,
          vehicleId,
          stationId,
          startTime: start,
          endTime: end,
          pickupLocation: pickupLocation || null,
          dropoffLocation: dropoffLocation || null,
          status: 'PENDING',
        },
      });

      return created;
    });

    return res.status(201).json({ success: true, data: { booking } });
  } catch (err) {
    if (err?.statusCode)
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    return next(err);
  }
}

export async function completeBooking(req, res, next) {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params || {};
    if (!userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!bookingId)
      return res
        .status(400)
        .json({ success: false, message: 'Missing bookingId' });

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking)
        throw Object.assign(new Error('Booking not found'), {
          statusCode: 404,
        });
      if (booking.userId !== userId)
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
        throw Object.assign(new Error('Booking not in progress'), {
          statusCode: 409,
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' },
      });

      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'AVAILABLE' },
      });

      return updatedBooking;
    });

    return res.json({ success: true, data: { booking: result } });
  } catch (err) {
    if (err?.statusCode)
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    return next(err);
  }
}
