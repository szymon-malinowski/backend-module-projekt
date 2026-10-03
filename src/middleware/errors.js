export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Express 4 does not automatically forward rejected route promises.
export const asyncHandler = handler => (req, res, next) =>
  Promise.resolve().then(() => handler(req, res, next)).catch(next);

export function notFound(req, res, next) {
  next(new ApiError(404, 'Route not found'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (['charset.unsupported', 'encoding.unsupported'].includes(error.type)) {
    return res.status(415).json({ error: 'Unsupported request encoding' });
  }
  return res.status(500).json({ error: 'Internal server error' });
}
