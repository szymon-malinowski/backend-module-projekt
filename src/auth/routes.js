import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errors.js';
import { dummyHash, hashPassword, verifyPassword } from './passwords.js';

const email = value => typeof value === 'string' && value.trim().length <= 255
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Invalid email';
const password = value => typeof value === 'string' && value.length >= 12 && value.length <= 128
  ? undefined : 'Password must contain 12–128 characters';
const name = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 120
  ? undefined : 'Name must contain 1–120 characters';

export function authRoutes(database, tokens) {
  const router = Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(validate('query', {}));
  router.post('/register', validate('body', { name, email, password }), asyncHandler(async (req, res) => {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const passwordHash = await hashPassword(req.body.password);
    try {
      const customer = await database.$transaction(async tx => {
        const customer = await tx.customer.create({ data: { name: req.body.name.trim(), email: normalizedEmail } });
        await tx.account.create({ data: { email: normalizedEmail, passwordHash, role: 'customer', customerId: customer.id } });
        return customer;
      });
      res.location(`/customers/${customer.id}`).status(201).json({ data: customer });
    } catch (error) {
      if (error.code === 'P2002') throw new ApiError(409, 'Email already registered');
      throw error;
    }
  }));
  router.post('/login', validate('body', { email, password }), asyncHandler(async (req, res) => {
    const account = await database.account.findUnique({ where: { email: req.body.email.trim().toLowerCase() } });
    const matches = await verifyPassword(req.body.password, account?.passwordHash ?? dummyHash);
    if (!account || !matches) throw new ApiError(401, 'Invalid credentials');
    res.json({ accessToken: tokens.sign(account.id), tokenType: 'Bearer', expiresIn: 3600 });
  }));
  return router;
}
