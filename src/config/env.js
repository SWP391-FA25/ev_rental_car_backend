export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || ' 15m',
  cookieName: process.env.COOKIE_NAME || 'access_token',
  cookieSecure: (process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
  // Firebase config
  firebaseApiKey: process.env.FIREBASE_API_KEY || '',
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  firebaseAppId: process.env.FIREBASE_APP_ID || '',
};
