/* eslint-disable no-unused-vars */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (details) this.details = details;
  }
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  // Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: err.errors,
    });
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key',
      meta: err.meta,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      meta: err.meta,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Malformed JSON body (express.json)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Malformed JSON' });
  }

  // Custom API error
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ success: false, message: err.message, details: err.details });
  }

  // Fallback
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || 'Internal Server Error' });
}
