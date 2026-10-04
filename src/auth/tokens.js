import jwt from 'jsonwebtoken';
import { ApiError, asyncHandler } from '../middleware/errors.js';

export function createTokens(secret = process.env.JWT_SECRET) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes. See .env.example.');
  }
  const issuer = 'backend-module-rest-api';
  const audience = 'backend-module-clients';
  return {
    sign: accountId => jwt.sign({}, secret, {
      algorithm: 'HS256', subject: String(accountId), issuer, audience, expiresIn: 3600,
    }),
    verify(token) {
      try {
        const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience, maxAge: '1h' });
        if (!/^\d+$/.test(claims.sub) || !Number.isInteger(claims.exp)
          || !Number.isInteger(claims.iat) || claims.iat > Math.floor(Date.now() / 1000)
          || Number(claims.sub) < 1 || Number(claims.sub) > 2147483647) throw new Error('Invalid claims');
        return Number(claims.sub);
      } catch {
        throw new ApiError(401, 'Authentication required');
      }
    },
  };
}

export function authenticate(database, tokens) {
  return asyncHandler(async (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') || '');
    if (!match) throw new ApiError(401, 'Authentication required');
    const id = tokens.verify(match[1]);
    const account = await database.account.findUnique({
      where: { id }, select: { id: true, role: true, customerId: true },
    });
    if (!account) throw new ApiError(401, 'Authentication required');
    req.auth = account;
    next();
  });
}
