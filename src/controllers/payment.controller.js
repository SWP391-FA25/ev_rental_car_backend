import { prisma } from '../lib/prisma.js';

export async function createPayment(req, res, next) {
  try {
    const userId = req.user?.id;
    const { bookingId, amount, paymentMethod, transactionId, paymentDate } =
      req.body || {};

    if (!userId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!bookingId || !amount || !transactionId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking)
        throw Object.assign(new Error('Booking not found'), {
          statusCode: 404,
        });
      if (booking.userId !== userId)
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

      // Idempotency: if a payment with this transactionId already exists, return it
      const existing = await tx.payment.findFirst({ where: { transactionId } });
      if (existing) {
        return {
          payment: existing,
          bookingStatus: booking.status,
          idempotent: true,
        };
      }

      const payment = await tx.payment.create({
        data: {
          userId,
          bookingId,
          amount,
          paymentMethod: paymentMethod || null,
          transactionId,
          status: 'PAID',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      // Update booking status if not already completed/cancelled
      let updatedBooking = booking;
      if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
        updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'COMPLETED' },
        });
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      return {
        payment,
        bookingStatus: updatedBooking.status,
        idempotent: false,
      };
    });

    return res
      .status(result.idempotent ? 200 : 201)
      .json({ success: true, data: result });
  } catch (err) {
    if (err.code === 'P2002') {
      // Unique constraint failed (transactionId)
      const existing = await prisma.payment.findFirst({
        where: { transactionId: req.body.transactionId },
      });
      return res
        .status(200)
        .json({
          success: true,
          data: {
            payment: existing,
            bookingStatus: undefined,
            idempotent: true,
          },
        });
    }
    if (err?.statusCode)
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    return next(err);
  }
}
