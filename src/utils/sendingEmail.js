import nodemailer from 'nodemailer';
import { generateEmailTemplate } from './template.email.js';

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: `${process.env.EMAIL_USERNAME}`,
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
});

/**
 * Generic function to send emails with templates
 * @param {string} email - Recipient email
 * @param {string} token - Token for email action
 * @param {string} purpose - Email purpose ('verify-email' or 'reset-password')
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async (email, token, purpose) => {
  try {
    const htmlTemplate = generateEmailTemplate(token, purpose);

    const subjectMap = {
      'verify-email': 'Xác Thực Email - EV Rental',
      'reset-password': 'Đặt Lại Mật Khẩu - EV Rental',
    };

    const mailOptions = {
      from: `"EV Rental" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: subjectMap[purpose] || 'EV Rental Notification',
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendVerificationEmail = async (email, token) => {
  return await sendEmail(email, token, 'verify-email');
};

const sendPasswordResetEmail = async (email, token) => {
  return await sendEmail(email, token, 'reset-password');
};

export { sendVerificationEmail, sendPasswordResetEmail, sendEmail };
export default transporter;
