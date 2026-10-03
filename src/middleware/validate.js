import { ApiError } from './errors.js';

// Each field validator returns an error message or undefined. Values are not coerced.
// Route-specific schemas will be added alongside their business endpoints.
export function validate(source, rules, { required = Object.keys(rules) } = {}) {
  if (!['body', 'params', 'query'].includes(source)) throw new Error('Invalid validation source');
  return (req, res, next) => {
    const input = req[source];
    const details = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return next(new ApiError(400, 'Validation failed', [
        { field: source, message: 'Expected an object' },
      ]));
    }
    for (const field of Object.keys(input)) {
      if (!Object.hasOwn(rules, field)) details.push({ field, message: 'Unknown field' });
    }
    for (const [field, check] of Object.entries(rules)) {
      if (!Object.hasOwn(input, field)) {
        if (required.includes(field)) details.push({ field, message: 'Required field' });
      } else {
        const message = check(input[field]);
        if (message) details.push({ field, message });
      }
    }
    if (details.length) return next(new ApiError(400, 'Validation failed', details));
    next();
  };
}
