export function successResponse(res, data, message = 'OK', statusCode = 200, meta) {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function errorResponse(res, message, statusCode = 500, errors = []) {
  return res.status(statusCode).json({ success: false, message, errors });
}
