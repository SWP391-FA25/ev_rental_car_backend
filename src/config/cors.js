export function getCorsOptions() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const allowList = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    origin: (origin, cb) => {
      if (!origin || allowList.length === 0 || allowList.includes(origin))
        return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
}
