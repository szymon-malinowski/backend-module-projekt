import { ApiError } from './errors.js';

// A small process-local limiter protects the public auth endpoints. Production deployments
// with multiple instances should replace the store with a shared Redis-backed limiter.
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = hits.get(key);
    if (!current || now >= current.resetAt) hits.set(key, { count: 1, resetAt: now + windowMs });
    else current.count += 1;
    const state = hits.get(key);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - state.count)));
    if (state.count > max) {
      res.set('Retry-After', String(Math.ceil((state.resetAt - now) / 1000)));
      return next(new ApiError(429, 'Too many requests'));
    }
    next();
  };
}
