import { prisma } from '../lib/prisma.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import transporter from '../utils/sendingEmail.js';

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

    const token = generateToken({ email, userId: user.id }, '15m');

    const mailOptions = {
      from: `${process.env.EMAIL_USERNAME}`,
      to: email,
      subject: 'Email Verification',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color:#2c3e50;">Hi there!</h2>
        <p>You recently visited our website and entered your email address.</p>
        <p>Please click the button below to verify your email:</p>

        <a href="http://localhost:5000/api/email/verify/${token}"
          style="
            display: inline-block;
            padding: 12px 20px;
            margin: 20px 0;
            background-color: #4CAF50;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          ">
          Verify Email
        </a>

        <p>If the button doesn’t work, you can also copy and paste this link into your browser:</p>
        <p><a href="http://localhost:5000/api/email/verify/${token}">Click here</a></p>

        <p>Thanks,<br/>The Your App Team</p>
      </div>
    `,
    };

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
      return res.status(400).json({ message: 'Invalid token' });
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return res.status(400).json({ message: 'Invalid token' });
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

    res.status(200).json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email token:', error);
    next(error);
  }
};

export { sendVerifyEmail, verifyEmailToken };
