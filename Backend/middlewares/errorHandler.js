export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errors = Array.isArray(err.errors) ? err.errors : [];

  if (statusCode >= 500) {
    console.error({
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Server error' : err.message,
    errors,
  });
}
