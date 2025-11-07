import { prisma } from '../lib/prisma.js';
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: 'Insufficient permissions' });
    }
    return next();
  };
};

export const verifyUser = async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.user;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'RENTER' && user.verifyStatus !== 'VERIFIED') {
    return res
      .status(403)
      .json({ success: false, message: 'User not verified' });
  }

  return next();
};
