import { prisma } from '../lib/prisma.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../utils/sendingEmail.js';

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
  } catch (error) {
    console.error('Error sending verification email:', error);
    next(error);
  }
};

const sendForgetPasswordEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset email has been sent',
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = await generateToken(
      { email: user.email, userId: user.id },
      { expiresIn: '1h' }
    );

    // Update user with reset token and expiration
    await prisma.user.update({
      where: { id: user.id },
      data: {
        forgetPasswordToken: resetToken,
      },
    });

    // Send password reset email using the template system
    try {
      const emailResult = await sendPasswordResetEmail(email, resetToken);

      if (emailResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Password reset email sent successfully',
          messageId: emailResult.messageId,
          token: resetToken,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset email',
        });
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email',
      });
    }
  } catch (error) {
    console.error('Error sending forget password email:', error);
    next(error);
  }
};

const verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    let decodedToken;
    try {
      decodedToken = await verifyToken(token);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const { email, userId } = decodedToken;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Check if user is already verified
    if (user.verifyStatus === 'VERIFIED') {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        data: {
          userId: user.id,
          email: user.email,
          verifyStatus: 'VERIFIED',
        },
      });
    }

    if (user.verifyToken !== token) {
      // If token is empty, it means it was already used
      if (!user.verifyToken) {
        return res.status(400).json({
          success: false,
          message:
            'This verification link has already been used. Please request a new verification email.',
        });
      }

      // If token exists but doesn't match, clear it
      await prisma.user.update({
        where: { id: userId },
        data: { verifyStatus: 'UNVERIFIED', verifyToken: '' },
      });
      return res.status(400).json({
        success: false,
        message:
          'Token has been used or invalidated, please request a new verification email',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { verifyStatus: 'VERIFIED', verifyToken: '' },
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user.id,
        email: user.email,
        verifyStatus: 'VERIFIED',
      },
    });
  } catch (error) {
    console.error('Error verifying email token:', error);
    next(error);
  }
};

const verifyForgetPasswordToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    let decodedToken;
    try {
      decodedToken = await verifyToken(token);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const { email, userId } = decodedToken;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Check if the token matches the stored reset token
    if (user.forgetPasswordToken !== token) {
      return res.status(400).json({
        success: false,
        message:
          'Token has been used or invalidated, please request a new password reset',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset token is valid',
      data: {
        userId: user.id,
        email: user.email,
        token: token,
      },
    });
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    next(error);
  }
};

export {
  sendForgetPasswordEmail,
  sendVerifyEmail,
  verifyEmailToken,
  verifyForgetPasswordToken,
};
