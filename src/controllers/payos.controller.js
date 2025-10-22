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

/**
 * Create a deposit payment link for a booking
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createDepositPayment(req, res, next) {
  // Set payment type to DEPOSIT and call the main function
  req.body.paymentType = 'DEPOSIT';
  return createPayOSPayment(req, res, next);
}

/**
 * Create a rental fee payment link for a booking
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createRentalFeePayment(req, res, next) {
  // Set payment type to RENTAL_FEE and call the main function
  req.body.paymentType = 'RENTAL_FEE';
  return createPayOSPayment(req, res, next);
}

/**
 * Create a late fee payment link for a booking
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createLateFeePayment(req, res, next) {
  // Set payment type to LATE_FEE and call the main function
  req.body.paymentType = 'LATE_FEE';
  return createPayOSPayment(req, res, next);
}

/**
 * Create a damage fee payment link for a booking
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createDamageFeePayment(req, res, next) {
  // Set payment type to DAMAGE_FEE and call the main function
  req.body.paymentType = 'DAMAGE_FEE';
  return createPayOSPayment(req, res, next);
}

/**
 * Create an extension fee payment link for a booking
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function createExtensionFeePayment(req, res, next) {
  // Set payment type to EXTENSION_FEE and call the main function
  req.body.paymentType = 'EXTENSION_FEE';
  return createPayOSPayment(req, res, next);
}

export async function createPayOSPayment(req, res, next) {
  try {
    const userId = req.user?.id;
    const {
      bookingId,
      amount,
      description,
      paymentType = 'DEPOSIT',
    } = req.body || {};

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

    // Check authorization - allow staff/admin to create payment for any booking
    if (booking.userId !== userId && req.user.role === 'RENTER') {
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
      returnUrl: `http://localhost:${process.env.PORT || 5000}/api/payos/success?bookingId=${bookingId}`,
      cancelUrl: `http://localhost:${process.env.PORT || 5000}/api/payos/failure?bookingId=${bookingId}`,
    });

    // Save payment reference to database
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        bookingId: bookingId,
        amount: amount,
        paymentMethod: 'PAYOS',
        paymentType: paymentType, // Add payment type
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

        // Update booking status based on payment type
        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            user: { select: { id: true, name: true } },
            vehicle: { select: { id: true, model: true } },
          },
        });

        if (booking) {
          // Handle different payment types
          if (payment.paymentType === 'DEPOSIT') {
            // For deposit payments, confirm the booking and update deposit status
            if (booking.status === 'PENDING') {
              await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                  status: 'CONFIRMED',
                  depositStatus: 'PAID',
                  depositAmount: payment.amount,
                },
              });

              // Update vehicle status to RESERVED (not AVAILABLE)
              await tx.vehicle.update({
                where: { id: booking.vehicleId },
                data: { status: 'RESERVED' },
              });
            }
          } else {
            // For other payment types (rental fees, late fees, etc.), handle accordingly
            // Don't change booking status to COMPLETED unless it's the final payment
            console.log(
              `Processing ${payment.paymentType} payment for booking ${booking.id}`
            );
          }
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

    // Handle different payment types
    if (payment.paymentType === 'DEPOSIT') {
      // Handle deposit payment logic - confirm booking instead of completing it
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { id: true, name: true } },
          vehicle: { select: { id: true, model: true } },
        },
      });

      if (booking && booking.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          // Update booking status to CONFIRMED and set deposit status
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              depositStatus: 'PAID',
              depositAmount: payment.amount,
            },
          });

          // Update vehicle status to RESERVED (not AVAILABLE)
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: { status: 'RESERVED' },
          });
        });

        // Send notification about successful payment
        try {
          await notifyPaymentReceived(updatedPayment, booking);
        } catch (notificationError) {
          console.error(
            'Error sending payment notification:',
            notificationError
          );
        }
      }
    } else if (payment.paymentType === 'RENTAL_FEE') {
      // Handle rental fee payment logic
      // Update booking payment status or other relevant logic
      console.log('Processing rental fee payment');
    } else if (payment.paymentType === 'LATE_FEE') {
      // Handle late fee payment logic
      console.log('Processing late fee payment');
    } else if (payment.paymentType === 'DAMAGE_FEE') {
      // Handle damage fee payment logic
      console.log('Processing damage fee payment');
    } else if (payment.paymentType === 'EXTENSION_FEE') {
      // Handle extension fee payment logic
      console.log('Processing extension fee payment');
    } else {
      // Handle other payment types
      console.log('Processing other payment type');
    }

    // Redirect to frontend success page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?bookingId=${bookingId}&paymentId=${payment.id}&paymentType=${payment.paymentType}`;
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

    // Handle different payment types for failure
    if (payment.paymentType === 'DEPOSIT') {
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
    } else {
      // Handle other payment types failure
      console.log(`Payment failed for type: ${payment.paymentType}`);
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

    // Check if user owns this payment or is staff/admin
    if (payment.userId !== userId && req.user.role === 'RENTER') {
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
        paymentType: payment.paymentType,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate,
      },
    });
  } catch (error) {
    console.error('Get Payment Status Error:', error);
    return next(error);
  }
}
