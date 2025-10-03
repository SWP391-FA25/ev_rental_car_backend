import nodemailer from 'nodemailer';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: `${process.env.EMAIL_USERNAME}`,
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
});

// Function to send email notifications
export const sendEmailNotification = async (
  to,
  subject,
  htmlContent,
  textContent = ''
) => {
  try {
    const mailOptions = {
      from: `${process.env.EMAIL_USERNAME}`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send booking confirmation email
export const sendBookingConfirmation = async (to, bookingDetails) => {
  const subject = 'Booking Confirmation - EV Rental';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color:#2c3e50;">Booking Confirmation</h2>
      <p>Dear Customer,</p>
      <p>Your booking has been confirmed with the following details:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Booking Information</h3>
        <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
        <p><strong>Vehicle:</strong> ${bookingDetails.vehicle}</p>
        <p><strong>Pickup Location:</strong> ${bookingDetails.pickupLocation}</p>
        <p><strong>Pickup Time:</strong> ${bookingDetails.pickupTime}</p>
        <p><strong>Return Time:</strong> ${bookingDetails.returnTime}</p>
        <p><strong>Total Amount:</strong> $${bookingDetails.totalAmount}</p>
      </div>
      
      <p>Please arrive at the pickup location 15 minutes before your scheduled time.</p>
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Thank you for choosing EV Rental!</p>
      <p>Best regards,<br/>The EV Rental Team</p>
    </div>
  `;

  return await sendEmailNotification(to, subject, htmlContent);
};

// Function to send payment confirmation email
export const sendPaymentConfirmation = async (to, paymentDetails) => {
  const subject = 'Payment Confirmation - EV Rental';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color:#2c3e50;">Payment Confirmation</h2>
      <p>Dear Customer,</p>
      <p>Your payment has been successfully processed with the following details:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Payment Information</h3>
        <p><strong>Payment ID:</strong> ${paymentDetails.id}</p>
        <p><strong>Booking ID:</strong> ${paymentDetails.bookingId}</p>
        <p><strong>Amount:</strong> $${paymentDetails.amount}</p>
        <p><strong>Payment Method:</strong> ${paymentDetails.method}</p>
        <p><strong>Date:</strong> ${paymentDetails.date}</p>
      </div>
      
      <p>Thank you for your payment. Your booking is now confirmed.</p>
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Thank you for choosing EV Rental!</p>
      <p>Best regards,<br/>The EV Rental Team</p>
    </div>
  `;

  return await sendEmailNotification(to, subject, htmlContent);
};

export default transporter;
