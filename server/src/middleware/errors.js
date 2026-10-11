export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : err.code === 11000 ? 409 : 500);
  const message = err.code === 11000 ? 'A record with that value already exists' : err.message || 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message, ...(err.errors && { errors: err.errors }) });
}
