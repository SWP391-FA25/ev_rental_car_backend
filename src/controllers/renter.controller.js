import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

const VALID_ACCOUNT_STATUS = ['ACTIVE', 'BANNED', 'SUSPENDED'];
const VALID_ROLES = ['RENTER'];

const validateRenterInput = (
  { email, password, name, phone, accountStatus },
  isCreate = true
) => {
  const errors = [];

  if (isCreate) {
    if (!email) {
      errors.push('Email is required');
    } else if (!z.string().email().safeParse(email).success) {
      errors.push('Email is invalid');
    }
    if (!password) {
      errors.push('Password is required');
    }
  }

  if (!name?.trim()) {
    errors.push('Name is required');
  }

  if (phone && !/^0\d{9}$/.test(phone)) {
    errors.push('Phone must start with 0 and have exactly 10 digits');
  }

  if (accountStatus && !VALID_ACCOUNT_STATUS.includes(accountStatus)) {
    errors.push(
      `Invalid accountStatus. Allowed: ${VALID_ACCOUNT_STATUS.join(', ')}`
    );
  }

  return errors;
};

const getRenters = async (req, res, next) => {
  try {
    const renters = await prisma.user.findMany({
      where: {
        role: { in: VALID_ROLES },
        softDeleted: false,
      },
      omit: { stationStaff: true },
      orderBy: { createdAt: 'desc' },
    });

    if (renters.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No renters found' });
    }

    return res.json({ success: true, data: { renters } });
  } catch (err) {
    return next(err);
  }
};

const getRenterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const renter = await prisma.user.findUnique({
      where: { id },
      omit: { stationStaff: true },
    });

    if (!renter || !VALID_ROLES.includes(renter.role) || renter.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Renter not found' });
    }

    return res.json({ success: true, data: { renter } });
  } catch (err) {
    return next(err);
  }
};

const createRenter = async (req, res, next) => {
  try {
    const { email, password, name, phone, address, accountStatus } = req.body;

    const errors = validateRenterInput(
      { email, password, name, phone, accountStatus },
      true
    );
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const [renter] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          address,
          accountStatus: accountStatus || 'ACTIVE',
          role: 'RENTER',
        },
      }),

      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'CREATE',
          tableName: 'User',
          recordId: email,
          oldData: null,
          newData: {
            email,
            name,
            phone,
            address,
            accountStatus,
            role: 'RENTER',
          },
        },
      }),
    ]);

    return res.status(201).json({ success: true, data: { renter } });
  } catch (err) {
    return next(err);
  }
};

const updateRenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, accountStatus} = req.body;

    const errors = validateRenterInput({ name, phone, accountStatus }, false);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const renter = await prisma.user.findUnique({ where: { id } });
    if (!renter || renter.role !== 'RENTER' || renter.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Renter not found' });
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { name, phone, address, accountStatus },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          accountStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'UPDATE',
          tableName: 'User',
          recordId: id,
          oldData: renter,
          newData: { name, phone, address, accountStatus },
        },
      }),
    ]);

    return res.json({ success: true, data: { renter: updated } });
  } catch (err) {
    return next(err);
  }
};

const softDeleteRenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.body.status;

    const VALID_SOFT_DELETE_STATUS = ['SUSPENDED', 'BANNED'];
    if (!VALID_SOFT_DELETE_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_SOFT_DELETE_STATUS.join(', ')}`,
      });
    }

    const renter = await prisma.user.findUnique({ where: { id } });
    if (!renter || renter.role !== 'RENTER' || renter.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Renter not found' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { softDeleted: true, accountStatus: status },
      }),

      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'DELETE',
          tableName: 'User',
          recordId: id,
          oldData: renter,
          newData: { softDeleted: true, accountStatus: status },
        },
      }),
    ]);

    return res.json({ success: true, message: 'Renter soft deleted' });
  } catch (err) {
    return next(err);
  }
};

const deleteRenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const renter = await prisma.user.findUnique({ where: { id } });

    if (!renter) {
      return res
        .status(404)
        .json({ success: false, message: 'Renter not found' });
    }

    if (renter.role !== 'RENTER') {
      return res.status(400).json({
        success: false,
        message: 'This is not a renter account, please check again',
      });
    }

    await prisma.$transaction([
      prisma.user.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'DELETE',
          tableName: 'User',
          recordId: id,
          oldData: renter,
          newData: null,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Renter deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const updateRenterPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters long',
      });
    }

    const renter = await prisma.user.findUnique({ where: { id } });

    if (!renter || !VALID_ROLES.includes(renter.role) || renter.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Renter not found' });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { password: hash } });

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export {
  createRenter,
  deleteRenter,
  getRenters,
  getRenterById,
  softDeleteRenter,
  updateRenter,
  updateRenterPassword,
};
