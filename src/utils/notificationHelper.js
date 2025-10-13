import { prisma } from '../lib/prisma.js';

/**
 * Create a notification for a specific user
 * @param {string} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (INFO, SUCCESS, WARNING, ERROR)
 * @param {number} priority - Priority level (1: Low, 2: Medium, 3: High)
 * @param {string} actionUrl - Optional action URL
 * @returns {Promise<Object>} Created notification
 */
export const createNotificationForUser = async (
  userId,
  title,
  message,
  type = 'INFO',
  priority = 1,
  actionUrl = null
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        actionUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify renter when staff creates a booking for them
 * @param {Object} booking - Booking object with user, vehicle, station info
 * @param {string} createdByRole - Role of user who created booking (STAFF/ADMIN)
 */
export const notifyBookingCreated = async (booking, createdByRole) => {
  const vehicleName = booking.vehicle?.model || 'vehicle';
  const startTime = new Date(booking.startTime).toLocaleDateString('vi-VN');

  const title = 'Booking Created';
  const message = `Your booking for ${vehicleName} has been created for ${startTime}`;

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'INFO',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify renter when booking is confirmed
 * @param {Object} booking - Booking object
 */
export const notifyBookingConfirmed = async (booking) => {
  const title = 'Booking Confirmed';
  const message =
    'Your booking has been confirmed! You can now proceed with your rental.';

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'SUCCESS',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify renter when rental starts (IN_PROGRESS)
 * @param {Object} booking - Booking object
 */
export const notifyBookingStarted = async (booking) => {
  const vehicleName = booking.vehicle?.model || 'vehicle';
  const title = 'Rental Started';
  const message = `Your rental for ${vehicleName} has started. Enjoy your ride!`;

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'INFO',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify renter when rental is completed
 * @param {Object} booking - Booking object
 */
export const notifyBookingCompleted = async (booking) => {
  const totalAmount = booking.totalAmount || 0;
  const title = 'Rental Completed';
  const message = `Your rental has been completed. Total: ${totalAmount.toLocaleString('vi-VN')} VND. Thank you!`;

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'SUCCESS',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify renter when booking is cancelled
 * @param {Object} booking - Booking object
 * @param {string} reason - Cancellation reason
 */
export const notifyBookingCancelled = async (booking, reason) => {
  const title = 'Booking Cancelled';
  const message = reason
    ? `Your booking has been cancelled. Reason: ${reason}`
    : 'Your booking has been cancelled.';

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'WARNING',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify renter when payment is received
 * @param {Object} payment - Payment object
 * @param {Object} booking - Booking object
 */
export const notifyPaymentReceived = async (payment, booking) => {
  const amount = payment.amount || 0;
  const title = 'Payment Received';
  const message = `Payment of ${amount.toLocaleString('vi-VN')} VND received for your booking.`;

  return await createNotificationForUser(
    booking.userId,
    title,
    message,
    'SUCCESS',
    2,
    `/user/profile?tab=trips`
  );
};

/**
 * Notify staff at station when renter creates a new booking
 * @param {Object} booking - Booking object
 * @param {string} stationId - Station ID
 */
export const notifyStaffNewBooking = async (booking, stationId) => {
  try {
    // Get all staff assigned to this station
    const stationStaff = await prisma.stationStaff.findMany({
      where: { stationId },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    });

    // Filter only STAFF role users
    const staffUsers = stationStaff.filter(
      (staff) => staff.user.role === 'STAFF'
    );

    if (staffUsers.length === 0) {
      console.log(`No staff found for station ${stationId}`);
      return;
    }

    const vehicleName = booking.vehicle?.model || 'vehicle';
    const stationName = booking.station?.name || 'station';
    const renterName = booking.user?.name || 'Customer';

    const title = 'New Booking Received';
    const message = `New booking received for ${vehicleName} at ${stationName} from ${renterName}`;

    // Create notifications for all staff at the station
    const notifications = await Promise.all(
      staffUsers.map((staff) =>
        createNotificationForUser(
          staff.userId,
          title,
          message,
          'INFO',
          2,
          `/staff?tab=bookings`
        )
      )
    );

    console.log(
      `Created ${notifications.length} notifications for staff at station ${stationId}`
    );
    return notifications;
  } catch (error) {
    console.error('Error notifying staff about new booking:', error);
    throw error;
  }
};

/**
 * Notify admin when payment fails
 * @param {Object} payment - Payment object
 * @param {Object} booking - Booking object
 */
export const notifyPaymentFailed = async (payment, booking) => {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (admins.length === 0) {
      console.log('No admin users found');
      return;
    }

    const amount = payment.amount || 0;
    const renterName = booking.user?.name || 'Customer';
    const title = 'Payment Failed';
    const message = `Payment of ${amount.toLocaleString('vi-VN')} VND failed for booking by ${renterName}`;

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotificationForUser(
          admin.id,
          title,
          message,
          'ERROR',
          3,
          `/admin/bookings`
        )
      )
    );

    console.log(
      `Created ${notifications.length} notifications for admins about failed payment`
    );
    return notifications;
  } catch (error) {
    console.error('Error notifying admins about failed payment:', error);
    throw error;
  }
};
