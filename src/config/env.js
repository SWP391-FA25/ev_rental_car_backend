export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  cookieName: process.env.COOKIE_NAME || 'access_token',
  cookieSecure: (process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
};
