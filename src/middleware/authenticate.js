import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  try {
    const tokenFromCookie = req.cookies?.[process.env.COOKIE_NAME];
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
