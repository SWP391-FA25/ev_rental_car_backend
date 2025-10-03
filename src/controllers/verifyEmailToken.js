import { prisma } from '../lib/prisma.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/sendingEmail.js';

const sendVerifyEmail = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validateUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!validateUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (validateUser.verifyStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const email = validateUser.email;
    if (!email) {
      return res.status(400).json({ message: 'You need to enter your email' });
    }

    const token = await generateToken(
      { email, userId: user.id },
      { expiresIn: '5m' }
    );

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: token, verifyStatus: 'PENDING' },
    });

    // Send verification email using the template system
    try {
      const emailResult = await sendVerificationEmail(email, token);

      if (emailResult.success) {
        return res.status(200).json({
          message: 'Verification email sent successfully',
          messageId: emailResult.messageId,
        });
      } else {
        return res
          .status(500)
          .json({ message: 'Failed to send verification email' });
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res
        .status(500)
        .json({ message: 'Error sending verification email' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: token, verifyStatus: 'PENDING' },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    next(error);
  }
};

const verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token - EV Rental</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #A8B8C8 0%, #B8C5D3 100%); }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .message { color: #6c757d; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Invalid Token</div>
            <div class="message">The verification link is invalid or malformed.</div>
          </div>
        </body>
        </html>
      `);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token - EV Rental</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #A8B8C8 0%, #B8C5D3 100%); }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .message { color: #6c757d; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ Invalid or Expired Token</div>
            <div class="message">The verification link has expired or is invalid. Please request a new verification email.</div>
          </div>
        </body>
        </html>
      `);
    }

    const { email, userId } = decodedToken;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.email !== email) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (user.verifyToken !== token) {
      await prisma.user.update({
        where: { id: userId },
        data: { verifyStatus: 'UNVERIFIED', verifyToken: '' },
      });
      return res.status(400).json({
        message:
          'Token has been used or invalidated, please request a new verification email',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { verifyStatus: 'VERIFIED', verifyToken: '' },
    });

    // Send a success response that could be displayed in browser
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - EV Rental</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #A8B8C8 0%, #B8C5D3 100%); }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .message { color: #6c757d; font-size: 16px; line-height: 1.6; }
          .button { display: inline-block; padding: 12px 24px; background: #8B9DAF; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Email Verified Successfully!</div>
          <div class="message">
            Your email has been verified successfully. You can now access all features of EV Rental.
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="button">Return to EV Rental</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error verifying email token:', error);
    next(error);
  }
};

export { sendVerifyEmail, verifyEmailToken };
