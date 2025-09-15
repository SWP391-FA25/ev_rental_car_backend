import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
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
    const { email, password, name, phone, license, address } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hash,
        name,
        phone,
        license,
        address,
        role: 'RENTER', // mặc định
        accountStatus: 'ACTIVE',
      },
    });

    const token = signAccessToken(user);
    res.cookie(process.env.COOKIE_NAME, token, cookieOptions());

    const { password: _pw, ...safeUser } = user;
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
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

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
    res.cookie(process.env.COOKIE_NAME, token, cookieOptions());

    const { password: _pw, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
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

    const { password: _pw, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (err) {
    return next(err);
  }
}
