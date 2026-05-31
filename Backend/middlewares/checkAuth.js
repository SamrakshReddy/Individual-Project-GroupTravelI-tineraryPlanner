export function checkAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required', errors: [] });
  }
  next();
}

export function requireFields(fields) {
  return (req, res, next) => {
    const missingFields = fields.filter((field) => req.body[field] === undefined || req.body[field] === '');
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: missingFields.map((field) => ({ field, message: `${field} is required` })),
      });
    }
    next();
  };
}
