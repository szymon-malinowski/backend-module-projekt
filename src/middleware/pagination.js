import { ApiError } from './errors.js';

export function pagination(query, extra = []) {
  const allowed = ['page', 'limit', ...extra];
  const unknown = Object.keys(query).filter(key => !allowed.includes(key));
  if (unknown.length) throw new ApiError(400, 'Validation failed', unknown.map(field => ({ field, message: 'Unknown field' })));
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!/^\d+$/.test(String(query.page ?? page)) || !Number.isInteger(page) || page < 1) throw new ApiError(400, 'Validation failed', [{ field: 'page', message: 'Page must be a positive integer' }]);
  if (!/^\d+$/.test(String(query.limit ?? limit)) || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new ApiError(400, 'Validation failed', [{ field: 'limit', message: 'Limit must be an integer from 1 to 100' }]);
  return { page, limit, skip: (page - 1) * limit };
}

export const envelope = (data, page, limit, total) => ({ data, pagination: { page, limit, total } });
