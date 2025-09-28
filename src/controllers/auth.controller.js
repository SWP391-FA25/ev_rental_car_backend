import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { prisma } from '../lib/prisma.js';

function signAccessToken(user) {
  const payload = { sub: user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
}

function isBcryptHash(value) {
  return (
    typeof value === 'string' &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)
  );
}

export async function register(req, res, next) {
  try {
    // Validation schema
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().optional(),
      phone: Joi.string()
        .pattern(/^0\d{9}$/)
        .optional()
        .messages({
          'string.pattern.base':
            'Phone must start with 0 and have exactly 10 digits',
        }),
      address: Joi.string().optional(),
      role: Joi.string().valid('RENTER').optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const {
      email,
      password,
      name,
      phone,
      license,
      address,
      role = 'RENTER',
    } = value;

    // Check for existing email (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hash,
        name,
        phone,
        license,
        address,
        role,
        accountStatus: 'ACTIVE',
      },
    });

    // Generate and set token
    const token = signAccessToken(user);
    if (!process.env.COOKIE_NAME) {
      throw new Error('COOKIE_NAME environment variable is not set');
    }
    res.cookie(process.env.COOKIE_NAME, token, cookieOptions());

    // Exclude password from response
    const { password: _, ...safeUser } = user;
    return res.status(201).json({ success: true, data: { user: safeUser } });
  } catch (e) {
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }
    return next(e);
  }
}

export async function login(req, res, next) {
  try {
    // Validation schema
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { email, password } = value;

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), softDeleted: false },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res
        .status(403)
        .json({ success: false, message: 'Account is not active' });
    }

    let passwordOk = false;

    if (isBcryptHash(user.password)) {
      passwordOk = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plaintext password support: compare directly, then migrate to bcrypt
      if (password === user.password) {
        passwordOk = true;
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash },
        });
      }
    }

    if (!passwordOk) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = signAccessToken(user);

    if (!process.env.COOKIE_NAME) {
      throw new Error('COOKIE_NAME environment variable is not set');
    }
    res.cookie(process.env.COOKIE_NAME, token, cookieOptions());

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (!process.env.COOKIE_NAME) {
      throw new Error('COOKIE_NAME environment variable is not set');
    }
    res.clearCookie(process.env.COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    if (!req.user?.id)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (err) {
    return next(err);
  }
}
