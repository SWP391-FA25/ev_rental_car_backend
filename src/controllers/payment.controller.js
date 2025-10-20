import { prisma } from '../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { saveFileToLocal } from '../utils/fileUpload.js';

/* Create a cash payment for a booking */
export async function createCashPayment(req, res, next) {
  try {
    const userId = req.user?.id;
    const {
      bookingId,
      amount,
      description,
      paymentType = 'RENTAL_FEE',
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

    // Check permissions - user can pay for their own booking or staff can process payments
    if (
      booking.userId !== userId &&
      req.user.role !== 'STAFF' &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Forbidden: You do not have access to process payment for this booking',
      });
    }

    // Generate unique transaction ID for cash payment
    const transactionId = `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: booking.userId,
        bookingId: bookingId,
        amount: parseFloat(amount),
        paymentMethod: 'CASH',
        paymentType: paymentType,
        transactionId: transactionId,
        status: 'PAID',
        paymentDate: new Date(),
      },
    });

    // Handle different payment types
    if (paymentType === 'DEPOSIT') {
      // Update booking deposit status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositStatus: 'PAID',
          depositAmount: parseFloat(amount),
        },
      });
    } else if (paymentType === 'RENTAL_FEE') {
      // For rental fee, we might want to update booking status or other fields
      console.log('Processing rental fee payment');
    }

    return res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentType: payment.paymentType,
        status: payment.status,
        message: 'Cash payment created successfully',
      },
    });
  } catch (error) {
    console.error('Cash Payment Error:', error);
    return next(error);
  }
}

/* Upload evidence image for an existing cash payment */
export async function uploadCashPaymentEvidence(req, res, next) {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: paymentId',
      });
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check permissions - user can upload evidence for their own payment or staff can process payments
    if (
      payment.userId !== userId &&
      req.user.role !== 'STAFF' &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Forbidden: You do not have access to upload evidence for this payment',
      });
    }

    // Check if payment is cash payment
    if (payment.paymentMethod !== 'CASH') {
      return res.status(400).json({
        success: false,
        message: 'Evidence can only be uploaded for cash payments',
      });
    }

    // Handle evidence upload if provided
    let evidenceUrl = null;
    if (req.file) {
      try {
        const result = await saveFile(
          req.file.buffer,
          req.file.originalname,
          'payments',
          `payment_${payment.id}_`,
          {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            userId: userId,
          }
        );

        if (result.success) {
          evidenceUrl = result.url;

          // Update payment with evidence
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              evidenceUrl: evidenceUrl,
            },
          });
        }
      } catch (error) {
        console.error('Error saving payment evidence:', error);
        return res.status(500).json({
          success: false,
          message: 'Error saving payment evidence',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No evidence file provided',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        evidenceUrl: evidenceUrl,
        message: 'Cash payment evidence uploaded successfully',
      },
    });
  } catch (error) {
    console.error('Cash Payment Evidence Upload Error:', error);
    return next(error);
  }
}

/*Process a cash refund for a booking*/
export async function processCashRefund(req, res, next) {
  try {
    const userId = req.user?.id;
    const { paymentId, refundAmount, reason } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!paymentId || !refundAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentId, refundAmount',
      });
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: true,
            vehicle: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check permissions - only staff or admin can process refunds
    if (req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only staff or admin can process refunds',
      });
    }

    // Check if payment is eligible for refund
    if (payment.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not eligible for refund',
      });
    }

    // Check if refund amount is valid
    const maxRefund = payment.amount - (payment.refundAmount || 0);
    if (parseFloat(refundAmount) > maxRefund) {
      return res.status(400).json({
        success: false,
        message: `Refund amount exceeds maximum allowed (${maxRefund})`,
      });
    }

    // Update payment with refund details
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        refundAmount: (payment.refundAmount || 0) + parseFloat(refundAmount),
        refundDate: new Date(),
        status:
          (payment.refundAmount || 0) + parseFloat(refundAmount) >=
          payment.amount
            ? 'REFUNDED'
            : 'PARTIALLY_REFUNDED',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        refundAmount: parseFloat(refundAmount),
        status: updatedPayment.status,
        message: 'Cash refund processed successfully',
      },
    });
  } catch (error) {
    console.error('Cash Refund Error:', error);
    return next(error);
  }
}

/*Get payment details*/
export async function getPaymentDetails(req, res, next) {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        refunds: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if user has access to this payment
    if (
      payment.userId !== userId &&
      req.user.role !== 'STAFF' &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this payment',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paymentType: payment.paymentType,
          transactionId: payment.transactionId,
          status: payment.status,
          paymentDate: payment.paymentDate,
          refundAmount: payment.refundAmount,
          refundDate: payment.refundDate,
          evidenceUrl: payment.evidenceUrl,
          booking: {
            id: payment.booking.id,
            startTime: payment.booking.startTime,
            endTime: payment.booking.endTime,
            status: payment.booking.status,
            user: payment.booking.user,
            vehicle: payment.booking.vehicle,
          },
          refunds: payment.refunds,
        },
      },
    });
  } catch (error) {
    console.error('Get Payment Details Error:', error);
    return next(error);
  }
}
