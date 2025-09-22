import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const VALID_ACCOUNT_STATUS = ['ACTIVE', 'BANNED', 'SUSPENDED'];
const VALID_ROLES = ['STAFF', 'ADMIN'];

const validateStaffInput = (
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

const getStaff = async (req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: VALID_ROLES },
        softDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (staff.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No staff or admin found' });
    }

    return res.json({ success: true, data: { staff } });
  } catch (err) {
    return next(err);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findUnique({ where: { id } });

    if (!staff || !VALID_ROLES.includes(staff.role) || staff.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff or admin not found' });
    }

    return res.json({ success: true, data: { staff } });
  } catch (err) {
    return next(err);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { email, password, name, phone, address, accountStatus, role } =
      req.body;

    const errors = validateStaffInput(
      { email, password, name, phone, accountStatus },
      true
    );

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: 'Role must be STAFF or ADMIN' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    const staff = await prisma.user.create({
      data: {
        email,
        password,
        name,
        phone,
        address,
        accountStatus: accountStatus || 'ACTIVE',
        role: role || 'STAFF',
      },
    });

    return res.status(201).json({ success: true, data: { staff } });
  } catch (err) {
    return next(err);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, accountStatus } = req.body;

    const errors = validateStaffInput(
      { name, phone, accountStatus, phone },
      false
    );

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const staff = await prisma.user.findUnique({ where: { id } });

    if (!staff || !VALID_ROLES.includes(staff.role) || staff.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff or admin not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name, phone, address, accountStatus },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        accountStatus: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, data: { staff: updated } });
  } catch (err) {
    return next(err);
  }
};

const softDeleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findUnique({ where: { id } });

    if (!staff || !VALID_ROLES.includes(staff.role) || staff.softDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff or admin not found' });
    }

    await prisma.user.update({
      where: { id },
      data: { softDeleted: true, accountStatus: 'INACTIVE' },
    });

    return res.json({ success: true, message: 'Staff/admin soft deleted' });
  } catch (err) {
    return next(err);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staff = await prisma.user.findUnique({ where: { id } });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff or admin not found' });
    }

    if (!VALID_ROLES.includes(staff.role)) {
      return res.status(400).json({
        success: false,
        message: 'This is not a staff or admin account, please check again',
      });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({
      success: true,
      message: 'Staff/admin deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  softDeleteStaff,
  deleteStaff,
};
