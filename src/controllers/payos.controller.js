/* eslint-disable no-unused-vars */
import { PayOS } from '@payos/node';
import { prisma } from '../lib/prisma.js';
import {
  notifyPaymentFailed,
  notifyPaymentReceived,
} from '../utils/notificationHelper.js';

// Initialize PayOS client
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_PUBLIC_KEY,
  checksumKey: process.env.PAYOS_PRIVATE_KEY,
});

export async function createPayOSPayment(req, res, next) {
  try {
    const userId = req.user?.id;
    const { bookingId, amount, description } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, amount',
      });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: true,
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this booking',
      });
    }

    // Check if booking is already paid
    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already completed',
      });
    }

    // Generate unique order code (timestamp + booking ID last 4 chars)
    const orderCode = parseInt(Date.now().toString().slice(-10));

    // Ensure description is not too long (max 25 characters)
    const paymentDescription =
      description && description.length <= 25
        ? description
        : `Deposit ${bookingId.substring(0, 8)}`;

    // Create payment link with PayOS
    const paymentLink = await payos.paymentRequests.create({
      orderCode: orderCode,
      amount: amount,
      description: paymentDescription,
      returnUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payos/success?bookingId=${bookingId}`,
      cancelUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payos/failure?bookingId=${bookingId}`,
    });

    // Save payment reference to database
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        bookingId: bookingId,
        amount: amount,
        paymentMethod: 'PAYOS',
        transactionId: orderCode.toString(),
        status: 'PENDING',
        paymentDate: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        orderCode: orderCode,
        paymentUrl: paymentLink.checkoutUrl,
        message: 'Payment link created successfully',
      },
    });
  } catch (error) {
    console.error('PayOS Payment Error:', error);
    return next(error);
  }
}

export async function handlePayOSWebhook(req, res, next) {
  try {
    // Verify webhook signature
    const webhookData = await payos.webhooks.verify(req.body);

    const { orderCode, amount, description, transactionDateTime, code } =
      webhookData.data;

    // Find payment by orderCode (which we used as transactionId)
    const payment = await prisma.payment.findFirst({
      where: { transactionId: orderCode.toString() },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Update payment status based on webhook result
    if (code === '00') {
      // Payment successful
      const result = await prisma.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            paymentDate: new Date(transactionDateTime),
          },
        });

        // Update booking status
        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            user: { select: { id: true, name: true } },
            vehicle: { select: { id: true, model: true } },
          },
        });

        if (
          booking &&
          (booking.status === 'PENDING' || booking.status === 'CONFIRMED')
        ) {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'COMPLETED' },
          });

          // Update vehicle status to AVAILABLE
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: { status: 'AVAILABLE' },
          });
        }

        return { updatedPayment, booking };
      });

      // Send notification about successful payment
      try {
        if (result.booking) {
          await notifyPaymentReceived(result.updatedPayment, result.booking);
        }
      } catch (notificationError) {
        console.error('Error sending payment notification:', notificationError);
        // Don't fail the payment if notifications fail
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } else {
      // Payment failed
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      // Get booking info for notification
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: {
          user: { select: { id: true, name: true } },
          vehicle: { select: { id: true, model: true } },
        },
      });

      // Send notification about failed payment
      try {
        if (booking) {
          await notifyPaymentFailed(updatedPayment, booking);
        }
      } catch (notificationError) {
        console.error(
          'Error sending payment failure notification:',
          notificationError
        );
        // Don't fail the payment update if notifications fail
      }

      return res.status(200).json({
        success: true,
        message: 'Payment failed',
      });
    }
  } catch (error) {
    console.error('PayOS Webhook Error:', error);
    return next(error);
  }
}

export async function handlePayOSSuccess(req, res, next) {
  try {
    const { bookingId, orderCode, status } = req.query;

    if (!bookingId || !orderCode || status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment parameters',
      });
    }

    // Find payment by orderCode
    const payment = await prisma.payment.findFirst({
      where: { transactionId: orderCode.toString() },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Update payment status to PAID
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
      },
    });

    // Update booking status to COMPLETED
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true } },
        vehicle: { select: { id: true, model: true } },
      },
    });

    if (
      booking &&
      (booking.status === 'PENDING' || booking.status === 'CONFIRMED')
    ) {
      await prisma.$transaction(async (tx) => {
        // Update booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'COMPLETED' },
        });

        // Update vehicle status
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      });

      // Send notification about successful payment
      try {
        await notifyPaymentReceived(updatedPayment, booking);
      } catch (notificationError) {
        console.error('Error sending payment notification:', notificationError);
      }
    }

    // Redirect to frontend success page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?bookingId=${bookingId}&paymentId=${payment.id}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('PayOS Success Handler Error:', error);
    return next(error);
  }
}

export async function handlePayOSFailure(req, res, next) {
  try {
    const { bookingId, orderCode, status } = req.query;

    if (!bookingId || !orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment parameters',
      });
    }

    // Find payment by orderCode
    const payment = await prisma.payment.findFirst({
      where: { transactionId: orderCode.toString() },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Update payment status to FAILED
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    // Get booking info for notification
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true } },
        vehicle: { select: { id: true, model: true } },
      },
    });

    // Send notification about failed payment
    try {
      if (booking) {
        await notifyPaymentFailed(updatedPayment, booking);
      }
    } catch (notificationError) {
      console.error(
        'Error sending payment failure notification:',
        notificationError
      );
      // Don't fail the payment update if notifications fail
    }

    // Redirect to frontend failure page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failure?bookingId=${bookingId}&paymentId=${payment.id}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('PayOS Failure Handler Error:', error);
    return next(error);
  }
}

export async function getPayOSPaymentStatus(req, res, next) {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this payment',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate,
      },
    });
  } catch (error) {
    console.error('Get Payment Status Error:', error);
    return next(error);
  }
}
