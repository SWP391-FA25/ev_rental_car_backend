export function getHealth(req, res) {
  res.json({
    success: true,
    data: { status: 'ok' },
    message: 'health',
    timestamp: new Date().toISOString(),
  });
}
